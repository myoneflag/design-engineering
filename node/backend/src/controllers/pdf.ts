import {AuthRequired} from "../helpers/withAuth";
import {Catalog} from "../entity/Catalog";
import {NextFunction, Request, Response, Router} from "express";
import {Session} from "../entity/Session";
import * as initialCatalog from "../initial-catalog.json";
import {Document} from '../entity/Document';
import {AccessLevel, User} from "../entity/User";
import * as bcrypt from 'bcrypt';
import uuid from 'uuid';
import {ApiHandleError} from "../helpers/apiWrapper";
import {log, promisify} from "util";
import * as pdf from 'pdfjs-dist';
import * as fs from 'fs';
import * as formidable from 'formidable';
import {Fields, Files} from "formidable";
import * as cprocess from 'child_process';
import * as sizeOf from  'image-size';
import {PAPER_SIZES} from "../../../common/src/paper-config";


async function convertToPng(pdfPath: string, pngHash: string): Promise<string> {
    const pngPath = '/tmp/' + pngHash + '.png';
    const result = await promisify(cprocess.exec)('convert -density 250 ' + pdfPath + '[0] -quality 100 ' + pngPath)
    await promisify(fs.rename)(pngPath, '/var/www/h2x/static/' + pngHash + '.png');

    return pngPath;
}

async function getPdfDims(pdfPath: string) {
    const pdfFile = await pdf.getDocument(pdfPath).promise;
    const pages = pdfFile.numPages;

    let pageText = '';
    let pageItems = await (await pdfFile.getPage(1)).getTextContent();
    pageItems.items.forEach((i) => {
        pageText += ' ' + i.str;
    });

    console.log('received pdf:');
    console.log(pageText);

    let paperPattern = '';
    Object.keys(PAPER_SIZES).forEach((name) => {
        if (paperPattern.length) paperPattern += '|';
        paperPattern += name;
    });

    let regexp = "(?:SCALE|Scale|scale)[-: \n\t]*([0-9]+):([0-9]+)[ \n\t]*@?[ \n\t]*(" + paperPattern +")?";
    let m = pageText.match(regexp);

    let paperSize = 'Not detected';
    let scale = "1:100";
    let scaleNumber = 1 / 100;
    console.log('got match: ' + JSON.stringify(m));

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
    regexp = "SCALE[-: \n\t][ \n\t]*@?[ \n\t]*(" + paperPattern +")";
    m = pageText.match(regexp);
    if (m && m.length >= 2) {
        paperSize = m[1];
    }

    let [x1, y1, x2, y2] = (await pdfFile.getPage(1)).view;
    let w = x2 - x1;
    let h = y2 - y1;

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

    return { pages, paperSize: {name: paperSize, widthMM: w, heightMM: h}, scale, scaleNumber };
}

function formidablePromise (req: Request): Promise<{fields: Fields, files: Files}> {
    return new Promise(function (resolve, reject) {
        const form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            if (err) return reject(err);
            resolve({ fields: fields, files: files })
        })
    })
}

export class PDFController {

    @ApiHandleError()
    @AuthRequired()
    public async uploadPdf(req: Request, res: Response, next: NextFunction, session: Session) {
        const form = await formidablePromise(req);
        const pdfPath = form.files.pdf.path;

        const pngHash = uuid();
        const pngDest = '/static/' + pngHash + ".png";
        convertToPng(pdfPath, pngHash).then((path) => {
            console.log('png done rendering: ' + pngDest + ' to path ' + path);
        });

        const dims = await getPdfDims(pdfPath);

        res.status(200).send({
            success: true,
            data: {
                paperSize: dims.paperSize,
                scaleName: dims.scale,
                scale: dims.scaleNumber,
                uri: pngDest,
                totalPages: dims.pages,
            },
        });
    }

}
const router: Router = Router();

const controller = new PDFController();

// Retrieve all Users
router.post('/', controller.uploadPdf.bind(controller));

export const pdfRouter = router;

