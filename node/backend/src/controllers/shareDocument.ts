import * as bcrypt from "bcrypt";
import { Router, Request, Response } from 'express';
import { ApiHandleError } from '../helpers/apiWrapper';
import { AuthRequired } from '../helpers/withAuth';
import { ShareDocument } from '../../../common/src/models/ShareDocument';
import { Document } from '../../../common/src/models/Document';

export class ShareDocumentController {
    @ApiHandleError()
    @AuthRequired()
    public async generateToken(req: Request, res: Response) {
        const { documentId } = req.body;
        
        const sd = ShareDocument.create();
        sd.token =  await bcrypt.hash(documentId.toString(), 10);
        await sd.save();

        const doc = await Document.findOne(documentId);
        doc.shareDocument = sd;
        await doc.save();

        res.send({
            success: true,
            data: sd.token
        });
    }
}

const router = Router();
const controller = new ShareDocumentController();

router.post("/shareableLink", controller.generateToken.bind(controller));

export const shareDocumentRouter = router;
