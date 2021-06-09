import { Router, Request, Response, NextFunction } from 'express';
import { IsNull } from 'typeorm';
import { ApiHandleError } from '../helpers/apiWrapper';
import { AuthRequired } from '../helpers/withAuth';
import { Session } from '../../../common/src/models/Session';
import { CustomEntity } from '../../../common/src/models/CustomEntity';
import { EntityType } from '../../../common/src/api/document/entities/types';
import { ShareDocument } from '../../../common/src/models/ShareDocument';

export class CustomEntityController {

    static async getDocumentEntities(documentId: number, type: EntityType ) {
        const data = await CustomEntity.find({
            select: ["id", "entity", "document_id", "type"],
            where: { 
                document_id: documentId,
                type: type,
                deletedAt: IsNull(),
            }
        });
        const result = data.map(row => {
            return {
                id: row.id,
                ...row.entity,
            }
        })
        console.log(result)
        return result;
    }

    @ApiHandleError()
    @AuthRequired()
    public async getEntity(req: Request, res: Response) {
        const entities = await CustomEntityController.getDocumentEntities(req.query.documentId, req.query.type)

        res.send({
            success: true,
            data: entities
        });
    }

    @ApiHandleError()
    public async getEntityShare(req: Request, res: Response) {

        const token = req.query.id;
        const sd = await ShareDocument.findOne({token: token});

        if (!sd) {
            return res.status(401).send({
                success: false,
                message: "Invalid link!",
            });
        }

        const entities = await CustomEntityController.getDocumentEntities(sd.id, req.query.type)

        res.send({
            success: true,
            data: entities
        });
    }

    @ApiHandleError()
    @AuthRequired()
    public async post(req: Request, res: Response, next: NextFunction, session: Session) {
        const customEntity = CustomEntity.create();
        customEntity.id = null;
        customEntity.entity = req.body.entity;
        customEntity.type = req.body.entity.type;
        customEntity.document_id = req.body.documentId;
        customEntity.created_by = session.user.username;
        await customEntity.save();
        customEntity.entity.id = customEntity.id;
        await customEntity.save();

        const data = await CustomEntity.find({
            select: ["id", "entity", "document_id", "type"],
            where: { 
                document_id: req.body.documentId,
                type: req.body.entity.type,
                deletedAt: IsNull(),
            }
        });

        res.send({
            success: true,
            data: data.map(row => {
                return {
                    id: row.id,
                    ...row.entity,
                }
            }),
        });
    }

    @ApiHandleError()
    @AuthRequired()
    public async update(req: Request, res: Response) {
        const customEntity = await CustomEntity.findOne(req.params.id);
        customEntity.entity = req.body.entity;
        await customEntity.save();

        const data = await CustomEntity.find({
            select: ["id", "entity", "document_id", "type"],
            where: { 
                document_id: req.body.documentId,
                type: req.body.entity.type,
                deletedAt: IsNull(),
            }
        });

        res.send({
            success: true,
            data: data.map(row => {
                return {
                    id: row.id,
                    ...row.entity,
                }
            }),
        });
    }

    @ApiHandleError()
    @AuthRequired()
    public async delete(req: Request, res: Response) {
        const customEntity = await CustomEntity.findOne(req.params.id);
        customEntity.deletedAt = new Date();
        await customEntity.save();

        const data = await CustomEntity.find({
            select: ["id", "entity", "document_id", "type"],
            where: { 
                document_id: req.query.documentId,
                type: req.query.type,
                deletedAt: IsNull(),
            }
        });

        res.send({
            success: true,
            data: data.map(row => {
                return {
                    id: row.id,
                    ...row.entity,
                }
            }),
        });
    }
}

const router = Router();
const controller = new CustomEntityController();

router.get("/", controller.getEntity.bind(controller));
router.get("/share", controller.getEntityShare.bind(controller));
router.post('/', controller.post.bind(controller));
router.put('/:id', controller.update.bind(controller));
router.delete('/:id', controller.delete.bind(controller));

export const customEntityRouter = router;
