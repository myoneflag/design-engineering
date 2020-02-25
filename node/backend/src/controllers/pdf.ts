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
import { PAPER_SIZES } from "../../../common/src/api/paper-config";
import { s3 } from "../aws";
import { Session } from "../../../common/src/models/Session";
import { ApiHandleError } from "../helpers/apiWrapper";
import { AuthRequired } from "../helpers/withAuth";
import PQueue from "p-queue";
import { assertUnreachable } from "../../../common/src/api/config";
import { FloorPlan } from "../../../common/src/models/FloorPlan";
import { RenderSize } from "../../../common/src/api/document/types";
import { GetObjectRequest } from 'aws-sdk/clients/s3';

async function convertToPng(pdfPath: string, pngHash: string, density: number): Promise<string> {
    const pngPath = "/tmp/" + pngHash + ".png";
    const result = await promisify(cprocess.exec)("convert -density " + density + " " + pdfPath + "[0] -quality 100 " + pngPath);
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
    let w = vp.width / 72 * 25.4;
    let h = vp.height  / 72 * 25.4;


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


const renderQueue = new PQueue({concurrency: 1});

export async function ensurePdfEventuallyLoaded(pdfPath: string, pngHash: string) {
    const floorPlans = await FloorPlan.findByIds([pngHash]);
    let floorPlan: FloorPlan;
    if (floorPlans.length) {
        floorPlan = floorPlans[0];
    } else {
        floorPlan = await FloorPlan.create();
        floorPlan.id = pngHash;
        floorPlan.renders = { bySize: {} };
    }

    const output = await promisify(cprocess.exec)("identify " + pdfPath);
    const [widthS, heightS] = output.stdout.split(' ')[2].split('x');
    const width = Number(widthS);
    const height = Number(heightS);

    for (const size of [RenderSize.SMALL, RenderSize.MEDIUM, RenderSize.LARGE]) {
        if (floorPlan.renders.bySize.hasOwnProperty(size)) {
            return;
        }

        // We can predict the width of the PDF so we should make that available to the frontend before the render
        // finishes.

        let ext: string;
        let density: number;
        switch (size) {
            case RenderSize.SMALL:
                ext = '-small';
                density = 20;
                break;
            case RenderSize.MEDIUM:
                ext = '-medium';
                density = 72;
                break;
            case RenderSize.LARGE:
                ext = '-large';
                density = 200;
                break;
            default:
                assertUnreachable(size);
        }

        floorPlan.renders.bySize[size] = {
            images: [{
                topLeft: {x: 0, y: 0},
                width: width / 72 * density,
                height: height / 72 * density,
                key: pngHash + ext + '.png',
            }],
            width: width / 72 * density,
            height: height / 72 * density,
        };

        await floorPlan.save();

        renderQueue.add(() => convertToPng(pdfPath, pngHash + ext, density)).then(async (pngPath) => {

            const params: AWS.S3.Types.PutObjectRequest = {
                Bucket: "h2x-pdf-renders",
                Body: fs.createReadStream(pngPath).on("error", (err) => {
                    console.log("File error: ", err);
                }),
                Key: path.basename(pngPath),
            };
            console.log("uploading png");
            s3.upload(params, (err, data) => {
                if (err) {
                    console.log("Error", err);
                } else if (data) {
                    console.log("Upload Success", data);
                }
            });


        });
    }

    await floorPlan.save();
}

export class PDFController {

    @ApiHandleError()
    @AuthRequired()
    public async uploadPdf(req: Request, res: Response, next: NextFunction, session: Session) {
        console.log("rendering pdf");
        const form = await formidablePromise(req);
        const pdfPath = form.files.pdf.path;

        const pngHash = uuid();

        const params2: AWS.S3.Types.PutObjectRequest = {
            Bucket: "h2x-pdf-renders",
            Body: fs.createReadStream(pdfPath).on("error", (err) => {
                console.log("File error: ", err);
            }),
            Key: pngHash + ".pdf",
        };

        console.log("uploading pdf");
        s3.upload(params2, (err, data) => {
            if (err) {
                console.log("Error", err);
            } else if (data) {
                console.log("Upload Success", data);
            }
        });


        await ensurePdfEventuallyLoaded(pdfPath, pngHash);

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
    public async getRenders(req: Request, res: Response, next: NextFunction, session: Session) {
        let key = req.params.key;

        if (path.basename(key) !== key) {
            res.status(400).send({
                success: false,
                message: "Invalid file key",
            });
            return;
        }

        key = key.split('.')[0];

        let fp = await FloorPlan.findOne({id: key});
        if (!fp) {
            const pdfFile = key + '.pdf';

            console.log('downloading from s3: ' + pdfFile);

            const params: GetObjectRequest = {
                Bucket: "h2x-pdf-renders",
                Key: pdfFile,
            };
            // download pdf again from amazon
            const ostream = await s3.getObject(params).createReadStream();
            const fileStream = fs.createWriteStream('/tmp/' + pdfFile);



            await new Promise((resolve, rej) => {
                ostream.on('error', (err) => {
                    // NoSuchKey: The specified key does not exist
                    rej(err);
                });

                ostream.pipe(fileStream).on('error', (err) => {
                    // capture any errors that occur when writing data to the file
                    rej(err);
                }).on('close', () => {
                    resolve();
                });
            });

            await ensurePdfEventuallyLoaded('/tmp/' + pdfFile, key);
            fp = await FloorPlan.findOne({id: key});

            if (!fp) {
                res.status(404).send({
                    success: false,
                    message: "PDF not found",
                });
                return;
            }
        }

        res.status(200).send({
            success: true,
            data: fp.renders,
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
router.get("/:key/renders", controller.getRenders.bind(controller));

export const pdfRouter = router;

