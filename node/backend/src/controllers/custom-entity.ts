import { Router, Request, Response, NextFunction } from 'express';
import { IsNull } from 'typeorm';
import { ApiHandleError } from '../helpers/apiWrapper';
import { AuthRequired } from '../helpers/withAuth';
import { Session } from '../../../common/src/models/Session';
import { CustomEntity } from '../../../common/src/models/CustomEntity';

export class HotKeyController {
    @ApiHandleError()
    @AuthRequired()
    public async getEntity(req: Request, res: Response) {
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
const controller = new HotKeyController();

router.get("/", controller.getEntity.bind(controller));
router.post('/', controller.post.bind(controller));
router.put('/:id', controller.update.bind(controller));
router.delete('/:id', controller.delete.bind(controller));

export const customEntityRouter = router;
