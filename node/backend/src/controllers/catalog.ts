import { initialCatalog } from "../../../common/src/api/catalog/initial-catalog/initial-catalog";
import {NextFunction, Request, Response, Router} from "express";
import {Session} from "../../../common/src/models/Session";
import {AuthRequired} from "../helpers/withAuth";
import {AccessType, withDocument} from "../helpers/withResources";
import { ShareDocument } from '../../../common/src/models/ShareDocument';
import { Document } from '../../../common/src/models/Document';

export class CatalogController {
    @AuthRequired()
    public async getCatalog(req: Request, res: Response, next: NextFunction, session: Session) {
        if (req.query.shareToken == "true") {
            const token = req.params.id;
            const sd = await ShareDocument.findOne({token: token});
            const doc = await Document.findOne({where: {shareDocument: {id: sd.id}}})
            
            if (doc) {
                return res.status(200).send({
                    success: true,
                    data: initialCatalog
                });
            } else {
                return res.status(401).send({
                    success: false,
                    message: "Document not found!",
                });
            }
        }

        await withDocument(Number(req.params.id), res, session, AccessType.READ, async (doc) => {
            return res.status(200).send({
                success: true,
                data: initialCatalog,
            });
        });
    }
}

const router: Router = Router();
const controller = new CatalogController();

// Retrieve all Users
router.get('/:id', controller.getCatalog.bind(controller));

export const catalogRouter = router;
