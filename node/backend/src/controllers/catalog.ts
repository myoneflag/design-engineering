import {AuthRequired} from "../helpers/withAuth";
import {Catalog} from "../entity/Catalog";
import {NextFunction, Request, Response, Router} from "express";
import {Session} from "../entity/Session";
import {AccessType, withDocument} from "../helpers/withResources";

export class CatalogController {
    @AuthRequired()
    public async getCatalog(req: Request, res: Response, next: NextFunction, session: Session) {
        await withDocument(Number(req.query.document), res, session, AccessType.READ, async (doc) => {

            const catalog = await Catalog
                .createQueryBuilder("catalog")
                .where("catalog.document = :document", { document: doc.id })
                .getOne();

            if (!catalog) {
                res.status(404).send({
                    success: false,
                    message: "Catalog not found",
                });
                return;
            }

            res.status(200).send({
                success: true,
                data: catalog.content,
            });
        });
    }
}
const router: Router = Router();

const controller = new CatalogController();

// Retrieve all Users
router.get('/', controller.getCatalog.bind(controller));

export const catalogRouter = router;
