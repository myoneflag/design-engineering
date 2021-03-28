import { auCatalog } from "../../../common/src/api/catalog/initial-catalog/au-catalog";
import {NextFunction, Request, Response, Router} from "express";
import {Session} from "../../../common/src/models/Session";
import {AuthRequired} from "../helpers/withAuth";
import {AccessType, withDocument} from "../helpers/withResources";
import { ShareDocument } from '../../../common/src/models/ShareDocument';
import { Document } from '../../../common/src/models/Document';
import { SupportedLocales } from "../../../common/src/api/locale";
import { usCatalog } from "../../../common/src/api/catalog/initial-catalog/us-catalog";

const catalogsByLocale = {
    [SupportedLocales.AU]: auCatalog,
    [SupportedLocales.UK]: auCatalog,
    [SupportedLocales.US]: usCatalog
};

export class CatalogController {
    @AuthRequired()
    public async getCatalog(req: Request, res: Response, next: NextFunction, session: Session) {
        await withDocument(Number(req.params.id), res, session, AccessType.READ, async (doc) => {
            return res.status(200).send({
                success: true,
                data: catalogsByLocale[doc.locale],
            });
        });
    }

    public async getCatalogShare(req: Request, res: Response) {
        const token = req.params.id;
        const sd = await ShareDocument.findOne({token: token});

        if (!sd) {
            return res.status(401).send({
                success: false,
                message: "Invalid link!",
            });
        }

        const doc = await Document.findOne({where: {shareDocument: {id: sd.id}}})
        
        if (doc) {
            return res.status(200).send({
                success: true,
                data: catalogsByLocale[doc.locale],
            });
        } else {
            return res.status(401).send({
                success: false,
                message: "Document not found!",
            });
        }
    }
}

const router: Router = Router();
const controller = new CatalogController();

// Retrieve all Users
router.get('/:id', controller.getCatalog.bind(controller));
router.get('/share/:id', controller.getCatalogShare.bind(controller));

export const catalogRouter = router;
