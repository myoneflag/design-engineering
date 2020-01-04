import AWS from "aws-sdk";
import * as cprocess from "child_process";
import { NextFunction, Request, Response, Router } from "express";
import * as formidable from "formidable";
import { Fields, Files } from "formidable";
import * as fs from "fs";
import path from "path";
import * as pdf from "pdfjs-dist";
import { promisify } from "util";
import uuid from "uuid";
import { PAPER_SIZES } from "../../../common/src/paper-config";
import { s3 } from "../aws";
import { Session } from "../entity/Session";
import { ApiHandleError } from "../helpers/apiWrapper";
import { AuthRequired } from "../helpers/withAuth";

async function convertToPng(pdfPath: string, pngHash: string): Promise<string> {
    const pngPath = "/tmp/" + pngHash + ".png";
    const result = await promisify(cprocess.exec)("convert -density 250 " + pdfPath + "[0] -quality 100 " + pngPath);
    return pngPath;
}

async function getPdfDims(pdfPath: string) {
    const pdfFile = await pdf.getDocument(pdfPath).promise;
    const pages = pdfFile.numPages;

    let pageText = "";
    const pageItems = await (await pdfFile.getPage(1)).getTextContent();
    pageItems.items.forEach((i) => {
        pageText += " " + i.str;
    });

    console.log("received pdf:");
    console.log(pageText);

    let paperPattern = "";
    Object.keys(PAPER_SIZES).forEach((name) => {
        if (paperPattern.length) {
            paperPattern += "|";
        }
        paperPattern += name;
    });

    let regexp = "(?:SCALE|Scale|scale)[-: \n\t]*([0-9]+):([0-9]+)[ \n\t]*@?[ \n\t]*(" + paperPattern + ")?";
    let m = pageText.match(regexp);

    let paperSize = "Not detected";
    let scale = "1:100";
    let scaleNumber = 1 / 100;
    console.log("got match: " + JSON.stringify(m));

    if (m) {

        if (m.length >= 4 && m[3] != null) {
            paperSize = m[3];
        }

        if (m.length >= 3) {
            const l = m[1];
            const r = m[2];

            const lef = Number(l);
            const rig = Number(r);

            if (!isNaN(lef) && !isNaN(rig)) {
                scale = lef + ":" + rig;
                if (rig !== 0) {
                    scaleNumber = lef / rig;
                }
            } else {
                // Sadly, we didn't have size.
            }
        }

    }


    // try again
    regexp = "SCALE[-: \n\t][ \n\t]*@?[ \n\t]*(" + paperPattern + ")";
    m = pageText.match(regexp);
    if (m && m.length >= 2) {
        paperSize = m[1];
    }

    const vp = (await pdfFile.getPage(1)).getViewport({ scale: 1 });
    let w = vp.width;
    let h = vp.height;

    console.log("raw width: " + w + " height: " + h);

    let maxw = 0;
    let maxh = 0;
    if (w > h) {
        maxw = PAPER_SIZES.A1.widthMM;
        maxh = PAPER_SIZES.A1.heightMM;
    } else {
        maxh = PAPER_SIZES.A1.widthMM;
        maxw = PAPER_SIZES.A1.heightMM;
    }

    const minMul = Math.min(maxw / w, maxh / h);
    w *= minMul;
    h *= minMul;

    Object.values(PAPER_SIZES).forEach((sz) => {
        if (sz.name === paperSize) {
            if (w > h) {
                w = sz.widthMM;
                h = sz.heightMM;
            } else {
                h = sz.widthMM;
                w = sz.heightMM;
            }
        }
    });

    return { pages, paperSize: { name: paperSize, widthMM: w, heightMM: h }, scale, scaleNumber };
}

function formidablePromise(req: Request): Promise<{ fields: Fields, files: Files }> {
    return new Promise((resolve, reject) => {
        const form = new formidable.IncomingForm();
        form.parse(req, (err, fields, files) => {
            if (err) {
                return reject(err);
            }
            resolve({ fields, files });
        });
    });
}

export class PDFController {

    @ApiHandleError()
    @AuthRequired()
    public async uploadPdf(req: Request, res: Response, next: NextFunction, session: Session) {
        console.log("rendering pdf");
        const form = await formidablePromise(req);
        const pdfPath = form.files.pdf.path;

        const pngHash = uuid();
        const pngDest = "/static/" + pngHash + ".png";

        convertToPng(pdfPath, pngHash).then((pngPath) => {
            console.log("png done rendering: " + pngDest + " to path " + pngPath);

            const params: AWS.S3.Types.PutObjectRequest = {
                Bucket: "h2x-pdf-renders",
                Body: fs.createReadStream(pngPath).on("error", (err) => {
                    console.log("File error: ", err);
                }),
                Key: pngHash + ".png"
            };
            console.log("uploading png");
            s3.upload(params, (err, data) => {
                if (err) {
                    console.log("Error", err);
                } else if (data) {
                    console.log("Upload Success", data);
                }
            });

            const params2: AWS.S3.Types.PutObjectRequest = {
                Bucket: "h2x-pdf-renders",
                Body: fs.createReadStream(pdfPath).on("error", (err) => {
                    console.log("File error: ", err);
                }),
                Key: pngHash + ".pdf"
            };

            console.log("uploading pdf");
            s3.upload(params2, (err, data) => {
                if (err) {
                    console.log("Error", err);
                } else if (data) {
                    console.log("Upload Success", data);
                }
            });
        });

        const dims = await getPdfDims(pdfPath);


        res.status(200).send({
            success: true,
            data: {
                paperSize: dims.paperSize,
                scaleName: dims.scale,
                scale: dims.scaleNumber,
                key: path.basename(pngHash + ".png"),
                totalPages: dims.pages
            }
        });
    }

    @ApiHandleError()
    @AuthRequired()
    public async getImageLink(req: Request, res: Response, next: NextFunction, session: Session) {
        const key = req.params.key;


        const sGetUrl = s3.getSignedUrl("getObject", {
            Bucket: "h2x-pdf-renders",
            Key: key
        });
        const sHeadUrl = s3.getSignedUrl("headObject", {
            Bucket: "h2x-pdf-renders",
            Key: key
        });

        return res.status(200).send({
            success: true,
            data: {
                get: sGetUrl,
                head: sHeadUrl
            }
        });
    }
}

const router: Router = Router();

const controller = new PDFController();

// Retrieve all Users
router.post("/", controller.uploadPdf.bind(controller));
router.get("/:key", controller.getImageLink.bind(controller));

export const pdfRouter = router;

