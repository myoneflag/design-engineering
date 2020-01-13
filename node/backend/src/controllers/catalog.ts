import { initialCatalog } from "../../../frontend/src/store/catalog/initial-catalog/initial-catalog";
import {NextFunction, Request, Response, Router} from "express";
import {Session} from "../entity/Session";
import {AuthRequired} from "../helpers/withAuth";
import {AccessType, withDocument} from "../helpers/withResources";

export class CatalogController {
    @AuthRequired()
    public async getCatalog(req: Request, res: Response, next: NextFunction, session: Session) {
        await withDocument(Number(req.query.document), res, session, AccessType.READ, async (doc) => {
            res.status(200).send({
                success: true,
                data: initialCatalog,
            });
        });
    }
}
const router: Router = Router();

const controller = new CatalogController();

// Retrieve all Users
router.get('/', controller.getCatalog.bind(controller));

export const catalogRouter = router;
