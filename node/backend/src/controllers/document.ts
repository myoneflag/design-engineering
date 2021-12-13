import { Brackets, Entity, IsNull, SaveOptions } from "typeorm";
import { NextFunction, Request, Response, Router } from "express";
import { OPERATION_NAMES } from "../../../common/src/api/document/operation-transforms";
import { initialDrawing } from "../../../common/src/api/document/drawing";
import { diffState } from "../../../common/src/api/document/state-differ";
import { CURRENT_VERSION } from "../../../common/src/api/config";
import { Document, DocumentStatus } from "../../../common/src/models/Document";
import { Operation } from "../../../common/src/models/Operation";
import { Session } from "../../../common/src/models/Session";
import { ShareDocument } from './../../../common/src/models/ShareDocument';
import { AccessLevel, User } from "../../../common/src/models/User";
import { ApiHandleError } from "../helpers/apiWrapper";
import { AuthRequired, withAuth } from "../helpers/withAuth";
import { AccessType, withDocument, withOrganization } from "../helpers/withResources";
import random from '../helpers/random';
import { cloneSimple } from "../../../common/src/lib/utils";
import ConcurrentDocument from "../services/concurrentDocument";
import { toSupportedLocale } from "../../../common/src/api/locale";
import { handleWebSocket } from "./document/handlers";
import { EXAMPLE_DRAWING, EXAMPLE_DRAWING_VERSION, EXAMPLE_META } from "../../../common/src/api/constants/example-drawing";
import { DocumentUpgrader } from "../services/DocumentUpgrader";
import { Organization } from "../../../common/src/models/Organization";
import { CustomEntity } from "../../../common/src/models/CustomEntity";
import { EntityType } from "../../../common/src/api/document/entities/types";

export class DocumentController {
    @ApiHandleError()
    @AuthRequired()
    public async reset(req: Request, res: Response, next: NextFunction, session: Session) {
        await withDocument(Number(req.params.id), res, session, AccessType.DELETE, async (doc) => {
            await ConcurrentDocument.broadcastDelete(Number(req.params.id));

            await Promise.all((await doc.operations).map((o) => {
                return o.remove();
            }));

            res.status(200).send({
                success: true,
                data: null,
            });
        });
    }

    @ApiHandleError()
    @AuthRequired()
    public async create(req: Request, res: Response, next: NextFunction, session: Session) {
        const user = await session.user;
        const createExampleDoc = parseInt(req.query.templateId, 10) === 1;
        const userWithOrg = await User.findOne({ username: user.username }, { relations: ['organization'] });
        const org = userWithOrg.organization;
        if (user.accessLevel >= AccessLevel.MANAGER) {
            if (!org) {
                res.status(401).send({
                    success: false,
                    message: "You can only create documents in your own organization. You are in " + (org ? org.id : "no organization"),
                });
                return;
            }
        }

        const sd = ShareDocument.create();
        sd.token = random(10);
        await sd.save();
        const doc = Document.create();
        doc.organization = org;
        doc.createdBy = user;
        doc.createdOn = new Date();
        doc.locale = toSupportedLocale(req.body.locale);
        doc.metadata = createExampleDoc ? EXAMPLE_META : cloneSimple(initialDrawing(doc.locale).metadata.generalInfo);
        doc.version = createExampleDoc ? EXAMPLE_DRAWING_VERSION : CURRENT_VERSION;
        doc.state = DocumentStatus.ACTIVE;
        doc.shareDocument = sd;
        await doc.save();

        if (createExampleDoc) {
            // save the first document operation
            const now = new Date();
            const op1 = Operation.create();
            op1.document = Promise.resolve(doc);
            op1.dateTime = now;
            op1.blame = null;
            op1.operation = diffState(initialDrawing(doc.locale), EXAMPLE_DRAWING, undefined)[0];
            op1.orderIndex = 0;
            await op1.save();

            // save the first document operation
            const op2 = Operation.create();
            op2.document = Promise.resolve(doc);
            op2.dateTime = now;
            op2.blame = null;
            op2.operation = { type: OPERATION_NAMES.COMMITTED_OPERATION, id: 1 };
            op2.orderIndex = 0;
            await op2.save();

            // In case the document is upgraded in development without updating the example document,
            // the example document needs to be upgraded.
            await DocumentUpgrader.onDocumentUpgradeRequest(doc.id);
        }
        res.status(200).send({
            success: true,
            data: doc,
        });
    }

    @ApiHandleError()
    @AuthRequired()
    public async delete(req: Request, res: Response, next: NextFunction, session: Session) {
        await withDocument(Number(req.params.id), res, session, AccessType.DELETE, async (doc) => {
            await ConcurrentDocument.broadcastDelete(Number(req.params.id));

            doc.state = DocumentStatus.DELETED;
            await doc.save();

            res.status(200).send({
                success: true,
                data: null,
            });
        });
    }

    @ApiHandleError()
    @AuthRequired()
    public async restore(req: Request, res: Response, next: NextFunction, session: Session) {
        await withDocument(Number(req.params.id), res, session, AccessType.UPDATE, async (doc) => {
            if (doc.state !== DocumentStatus.DELETED) {
                res.status(400).send({
                    success: false,
                    message: "can't restore a document that isn't deleted",
                });
            }
            doc.state = DocumentStatus.ACTIVE;
            await doc.save();

            res.status(200).send({
                success: true,
                data: null,
            });
        });
    }

    @ApiHandleError()
    @AuthRequired()
    public async update(req: Request, res: Response, next: NextFunction, session: Session) {
        await withDocument(Number(req.params.id), res, session, AccessType.UPDATE, async (doc) => {
            const { organization, metadata, tags } = req.body;

            if (organization !== undefined) {
                let called = false;
                await withOrganization(organization, res, session, AccessType.UPDATE, async (org) => {
                    called = true;
                    doc.organization = org;
                });
                if (!called) {
                    return;
                }
            }

            if (metadata !== undefined) {
                doc.metadata = metadata;
            }
            if (tags !== undefined) {
                doc.tags = tags;
            }

            await doc.save();
            res.status(200).send({
                success: true,
                data: doc,
            });
        });
    }

    @ApiHandleError()
    @AuthRequired()
    public async find(req: Request, res: Response, next: NextFunction, session: Session) {
        // find only the ones we care about.
        let results: Document[];
        const access = (await session.user).accessLevel;
        if (access >= AccessLevel.MANAGER) {
            // we can only access our own org.
            const user = await session.user;
            await user.reload();
            const org = user.organization;
            if (org == null) {
                results = [];
            } else {
                const where = [
                    { organization: org.id, state: DocumentStatus.ACTIVE },
                ];
                if (session.user.accessLevel <= AccessLevel.MANAGER) {
                    where.push({ organization: org.id, state: DocumentStatus.DELETED });
                }

                results = await Document.find( {
                    where,
                    order: {
                        createdOn: "DESC",
                    },
                });
            }
        } else {
            results = await Document.find({ order: { createdOn: "DESC" } });
        }

        res.status(200).send({
            success: true,
            data: results,
        });
    }

    @ApiHandleError()
    @AuthRequired()
    public async findOne(req: Request, res: Response, next: NextFunction, session: Session) {
        await withDocument(Number(req.params.id), res, session, AccessType.READ, async (doc) => {
            res.status(200).send({
                success: true,
                data: doc,
            });
        });
    }

    @ApiHandleError()
    public async findOneShared(req: Request, res: Response, next: NextFunction, session: Session) {
        const sd = await ShareDocument.findOne({ token: req.params.sharedId });
        const doc = sd && await Document.findOne({ where: { shareDocument: { id: sd.id } } });

        if (!doc) {
            return res.status(404).send({
                success: false,
                message: "Shared document link is invalid",
            });
        }
        res.status(200).send({
            success: true,
            data: doc,
        });
    }

    @ApiHandleError()
    @AuthRequired()
    public async findOperations(req: Request, res: Response, next: NextFunction, session: Session) {
        await withDocument(Number(req.params.id), res, session, AccessType.READ, async (doc) => {
            const after = req.query.after === undefined ? -1 : Number(req.query.after);
            const ops = await Operation
                .createQueryBuilder("operation")
                .leftJoinAndSelect("operation.blame", "user")
                .where("operation.document = :document", { document: doc.id })
                .andWhere("operation.\"orderIndex\" > :after", { after })
                .orderBy("\"orderIndex\"", "ASC")
                .getMany();

            res.status(200).send({
                success: true,
                data: ops,
            });
        });
    }

    @ApiHandleError()
    @AuthRequired()
    public async clone(req: Request, res: Response, next: NextFunction, session: Session) {
        const user = await session.user;
        const targetId = Number(req.params.id);

        // Do not await - this can be a long process and we want the UI to update asap
        withDocument(targetId, res, session, AccessType.READ, async (target) => {

            const userWithOrg = await User.findOne({ username: user.username }, { relations: ["organization"] });
            const org = userWithOrg.organization;

            await withOrganization(org.id, res, session, AccessType.READ, async (org1) => {
                const doc = Document.create();
                doc.organization = org1;
                doc.createdBy = user;
                doc.createdOn = new Date();
                doc.metadata = target.metadata;
                doc.metadata.title = "Copy of " + doc.metadata.title;
                doc.state = DocumentStatus.PENDING;
                doc.version = target.version;
                doc.lastModifiedOn = target.lastModifiedOn;
                doc.lastModifiedBy = target.lastModifiedBy;
                doc.upgradingLockExpires = new Date();
                doc.locale = target.locale;

                await doc.save();

                const ops = await Operation.createQueryBuilder("operation")
                    .leftJoinAndSelect("operation.blame", "user")
                    .where("operation.document = :document", { document: target.id })
                    .orderBy("\"orderIndex\"", "ASC")
                    .getMany();

                let lastOrderIndex = 0;
                for (const op of ops) {
                    const newOp = Operation.create();
                    newOp.operation = op.operation;
                    newOp.dateTime = op.dateTime;
                    newOp.blame = op.blame;
                    newOp.orderIndex = op.orderIndex;
                    newOp.document = Promise.resolve(doc);
                    await newOp.save();
                    lastOrderIndex = newOp.orderIndex;
                }
                doc.nextOperationIndex = lastOrderIndex + 1;

                const drawing = initialDrawing(doc.locale);
                const drawingWithTitle = initialDrawing(doc.locale);
                drawingWithTitle.metadata.generalInfo.title = doc.metadata.title;

                const titleChangeDiff = diffState(drawing, drawingWithTitle, undefined);

                if (titleChangeDiff.length) {
                    const titleChangeOp = Operation.create();
                    titleChangeOp.orderIndex = lastOrderIndex + 1;
                    titleChangeOp.document = Promise.resolve(doc);
                    titleChangeOp.blame = session.user;
                    titleChangeOp.dateTime = new Date();
                    titleChangeOp.operation = titleChangeDiff[0];

                    const commitOp = Operation.create();
                    commitOp.orderIndex = lastOrderIndex + 2;
                    commitOp.document = Promise.resolve(doc);
                    commitOp.blame = session.user;
                    commitOp.dateTime = new Date();
                    commitOp.operation = { type: OPERATION_NAMES.COMMITTED_OPERATION, id: lastOrderIndex + 2 };

                    await titleChangeOp.save();
                    await commitOp.save();

                    doc.nextOperationIndex = lastOrderIndex + 3;
                }

                // copy over custom entities to new document
                const customEntities = await CustomEntity.find({
                    select: ["id", "entity", "document_id", "type"],
                    where: {
                        document_id: targetId,
                        type: EntityType.LOAD_NODE,
                        deletedAt: IsNull(),
                    },
                });
                customEntities.forEach((custEnt) => {
                    custEnt.document_id = doc.id;
                    custEnt.created_by = session.user.name;
                });
                CustomEntity.insert(customEntities, { reload: false });

                doc.state = DocumentStatus.ACTIVE;
                await doc.save();

                res.status(200).send({
                    success: true,
                    data: doc,
                });
            });

        });
    }
}

const router = Router();
const controller = new DocumentController();

router.ws("/:id/websocket", (ws, req) => {
    const docId = Number(req.params.id);
    withAuth(
        req,
        async (session) => {
            withDocument(docId, null, session, AccessType.UPDATE,
                async (doc) => handleWebSocket(doc, ws, false, session));
        },
        (msg) => {
            ws.send("You are not authorised");
            ws.send(msg);
        },
    );
});

router.ws("/share/:id/websocket", async (ws, req) => {
    const token = req.params.id;
    const sd = await ShareDocument.findOne({token});

    if (!sd) {
        ws.send('Invalid link!');
        return;
    }

    const doc = await Document.findOne({where: {shareDocument: {id: sd.id}}});
    if (!doc) {
        ws.send('Document has been deleted!');
        return;
    }
    handleWebSocket(doc, ws, true, null);
});

router.post("/:id/reset", controller.reset.bind(controller));

router.post("/", controller.create.bind(controller));
router.delete("/:id", controller.delete.bind(controller));
router.post("/:id/clone", controller.clone.bind(controller));
router.get("/:id/operations", controller.findOperations.bind(controller));
router.put("/:id", controller.update.bind(controller));
router.get("/:id", controller.findOne.bind(controller));
router.get("/shared/:sharedId", controller.findOneShared.bind(controller));
router.post("/:id/restore", controller.restore.bind(controller));
router.get("/", controller.find.bind(controller));

export const documentRouter = router;
