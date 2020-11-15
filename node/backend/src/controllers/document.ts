import { Brackets } from "typeorm";
import { NextFunction, Request, Response, Router } from "express";
import { DocumentClientMessage, DocumentWSMessageType } from "../../../common/src/api/document/types";
import { OPERATION_NAMES, OperationTransformConcrete } from "../../../common/src/api/document/operation-transforms";
import { DrawingState, initialDrawing } from "../../../common/src/api/document/drawing";
import { applyDiffNative } from "../../../common/src/api/document/state-ot-apply";
import { diffState } from "../../../common/src/api/document/state-differ";
import { assertUnreachable, CURRENT_VERSION } from "../../../common/src/api/config";
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
import {compressDocumentIfRequired} from "../services/compressDocument";

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
        if (!user.temporaryUser){
            const userWithOrg = await User.findOne({username: user.username}, {relations: ['organization']});
            const org = userWithOrg.organization;
            if (user.accessLevel >= AccessLevel.MANAGER) {
                // We can only create in our own org.
                if (org === undefined || req.body.organization !== org.id) {
                    res.status(401).send({
                        success: false,
                        message: "You can only create documents in your own organization. You are in " + (org ? org.id : "no organization"),
                    });
                    return;
                }
            }

            let qorg = req.body.organization;
            if (!qorg && org) {
                qorg = org.id;
            }

            await withOrganization(qorg, res, session, AccessType.READ, async (org1) => {
                const sd = ShareDocument.create();
                sd.token =  random(10);
                await sd.save();

                const doc = Document.create();
                doc.organization = org1;
                doc.createdBy = user;
                doc.createdOn = new Date();
                doc.metadata = cloneSimple(initialDrawing.metadata.generalInfo);
                doc.version = CURRENT_VERSION;
                doc.state = DocumentStatus.ACTIVE;
                doc.shareDocument = sd;
                await doc.save();

                res.status(200).send({
                    success: true,
                    data: doc,
                });
            });
        } else {
            const sd = ShareDocument.create();
            sd.token = random(10);
            await sd.save();

            const doc = Document.create();
            doc.organization = null;
            doc.createdBy = user;
            doc.createdOn = new Date();
            doc.metadata = cloneSimple(initialDrawing.metadata.generalInfo);
            doc.version = CURRENT_VERSION;
            doc.state = DocumentStatus.ACTIVE;
            doc.shareDocument = sd;
            await doc.save();

            res.status(200).send({
                success: true,
                data: doc
            });
        }
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
                data: null
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
                    message: "can't restore a document that isn't deleted"
                });
            }
            doc.state = DocumentStatus.ACTIVE;
            await doc.save();

            res.status(200).send({
                success: true,
                data: null
            });
        });
    }

    @ApiHandleError()
    @AuthRequired()
    public async update(req: Request, res: Response, next: NextFunction, session: Session) {
        await withDocument(Number(req.params.id), res, session, AccessType.UPDATE, async (doc) => {
            const { organization, metadata } = req.body;

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
            console.log('here in general?')
            console.log(user)
            if (org == null) {
                results = [];
            } else {
                results = await Document
                    .createQueryBuilder("document")
                    .where("document.organization = :organization", { organization: org.id })
                    .andWhere(new Brackets((qb) => {
                        qb.where("document.state = :state", { state: DocumentStatus.ACTIVE });

                        if (session.user.accessLevel <= AccessLevel.MANAGER) {
                            qb.orWhere("document.state = :state2", { state2: DocumentStatus.DELETED });
                        }
                    }))
                    .orderBy("document.createdOn", "DESC")
                    .getMany();
            }
            await Promise.all(results.map((r) => r.reload()));
        } else {
            results = await Document.find({ order: { "createdOn": "DESC" } });
        }

        res.status(200).send({
            success: true,
            data: results
        });
    }

    @ApiHandleError()
    @AuthRequired()
    public async findOne(req: Request, res: Response, next: NextFunction, session: Session) {
        await withDocument(Number(req.params.id), res, session, AccessType.READ, async (doc) => {
            res.status(200).send({
                success: true,
                data: doc
            });
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
                data: ops
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
            if (user.accessLevel >= AccessLevel.MANAGER) {
                // We can only create in our own org.
                if (org === undefined || req.body.organization !== org.id) {
                    res.status(401).send({
                        success: false,
                        message: "You can only create documents in your own organization. You are in " + (org ? org.id : "no organization")
                    });
                    return;
                }
            }

            let qorg = req.body.organization;
            if (!qorg && org) {
                qorg = org.id;
            }

            await withOrganization(qorg, res, session, AccessType.READ, async (org1) => {
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

                const drawing = cloneSimple(initialDrawing);
                const drawingWithTitle = cloneSimple(initialDrawing);
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
    withAuth(
        req,
        async (session) => {
            withDocument(Number(req.params.id), null, session, AccessType.UPDATE, async (doc) => {
                // sanity checks.
                await compressDocumentIfRequired(doc);
                switch (doc.state) {
                    case DocumentStatus.ACTIVE:
                        if (doc.version !== CURRENT_VERSION) {
                            const msg: DocumentClientMessage = [{
                                type: DocumentWSMessageType.DOCUMENT_ERROR,
                                message: 'Cannot open this document - it is out of date.',
                            }];
                            ws.send(JSON.stringify(msg));
                            return;
                        }

                        // that's ok
                        break;
                    case DocumentStatus.DELETED: {
                        const msg: DocumentClientMessage = [{
                            type: DocumentWSMessageType.DOCUMENT_ERROR,
                            message: 'Cannot open this document - it is deleted.',
                        }];
                        ws.send(JSON.stringify(msg));
                        return ;
                    }
                    case DocumentStatus.PENDING: {
                        const msg: DocumentClientMessage = [{
                            type: DocumentWSMessageType.DOCUMENT_ERROR,
                            message: 'Cannot open this document - it is pending. Try again later',
                        }];
                        ws.send(JSON.stringify(msg));
                        return;
                    }
                    default:
                        assertUnreachable(doc.state);
                }

                const cdoc = new ConcurrentDocument(
                    Number(req.params.id),
                    async (nextOpId) => {
                        operations = await Operation
                            .createQueryBuilder("operation")
                            .leftJoinAndSelect("operation.blame", "user")
                            .where("operation.document = :document", { document: Number(req.params.id) })
                            .andWhere('operation.orderIndex > :minOrderIndex', {minOrderIndex: lastOpId})
                            .orderBy("operation.orderIndex", "ASC")
                            .getMany();

                        for (const op of operations) {
                            toSend.push({
                                type: DocumentWSMessageType.OPERATION,
                                operation: op.operation,
                            });
                            lastOpId = op.orderIndex;
                        }
                        await sendQueueToWs();
                    },
                    async () => {
                        toSend.push({
                            type: DocumentWSMessageType.DOCUMENT_DELETED,
                        });
                        await sendQueueToWs();
                    });


                const pingPid = setInterval(function timeout() {
                    try {
                        ws.ping("heartbeat");
                    } catch (e) {
                        closeHandler();
                    }
                }, 10000);

                const closeHandler = () => {
                    clearInterval(pingPid);
                    cdoc.close();
                };

                ws.on("close", closeHandler);

                ws.on("message", (message) => {
                    // use a message queue to process each message serially.
                    messageQueue.push(message as string);
                    onMessageQueuePush();
                });

                const messageQueue: string[] = [];
                let messageQueueWorking = false;
                async function onMessageQueuePush() {
                    if (!messageQueueWorking) {
                        messageQueueWorking = true;

                        while (messageQueue.length) {
                            const message = messageQueue.splice(0, 1)[0];

                            const ops: OperationTransformConcrete[] = JSON.parse(message as string);
                            if (ops.length) {

                                let nextOpId = 0;
                                await cdoc.withDocumentLock(async (tx, docVal) => {
                                    nextOpId = docVal.nextOperationIndex;
                                    const now = new Date();
                                    for (const op of ops) {
                                        op.id = nextOpId;
                                        const toStore = Operation.create();
                                        toStore.document = Promise.resolve(docVal);
                                        toStore.dateTime = now;
                                        toStore.blame = session.user;

                                        toStore.operation = op;
                                        toStore.orderIndex = op.id;
                                        await tx.save(toStore);
                                        nextOpId += 1;
                                        docVal.nextOperationIndex = nextOpId;
                                    }

                                    docVal.lastModifiedBy = session.user;
                                    docVal.lastModifiedOn = now;
                                    await tx.save(docVal);
                                });

                                await cdoc.notifyUpdate(nextOpId);
                            }
                        }

                        messageQueueWorking = false;
                    }
                }


                let operations: Operation[] = [];
                let drawing: DrawingState = cloneSimple(initialDrawing);
                let lastOpId = -1;
                // Now that we have hooked update handlers, Load document. Reconstruct the state, and send the
                // initial document state.
                await cdoc.withDocumentLock(async (tx, docVal) => {

                    operations = await tx.getRepository(Operation)
                        .createQueryBuilder("operation")
                        .leftJoinAndSelect("operation.blame", "user")
                        .where("operation.document = :document", { document: Number(req.params.id) })
                        .orderBy("operation.orderIndex", "ASC")
                        .getMany();


                    // form document to get snapshot
                    drawing = cloneSimple(initialDrawing);
                    for (const op of operations) {
                        if (op.operation.type === OPERATION_NAMES.DIFF_OPERATION) {
                            applyDiffNative(drawing, op.operation.diff);
                        }
                        lastOpId = op.orderIndex;
                    }

                    docVal.metadata = drawing.metadata.generalInfo;
                    await tx.save(docVal);
                });


                const wholeThing = diffState(initialDrawing, drawing, undefined);

                const toSend: DocumentClientMessage = [];

                if (operations.length) {
                    if (wholeThing.length) {
                        wholeThing[0].id = lastOpId - 1;
                        toSend.push({ type: DocumentWSMessageType.OPERATION, operation: wholeThing[0] });
                    }
                    toSend.push({
                        type: DocumentWSMessageType.OPERATION,
                        operation: { type: OPERATION_NAMES.COMMITTED_OPERATION, id: lastOpId },
                    });
                }

                toSend.push({
                    type: DocumentWSMessageType.DOCUMENT_LOADED,
                });

                let working = false;
                async function sendQueueToWs() {
                    if (!working) {
                        working = true;
                        while (toSend.length) {
                            const sendNow = toSend.splice(0);
                            await ws.send(JSON.stringify(sendNow));
                        }
                        working = false;
                    }
                }

                await sendQueueToWs();

            });
        },
        (msg) => {
            ws.send("You are not authorised");
            ws.send(msg);
        },
    );
});

router.ws("/share/:id/websocket", async (ws, req) => {
    const token = req.params.id;
    const sd = await ShareDocument.findOne({token: token});

    if (!sd) {
        ws.send('Invalid link!');
        return;
    }
    
    const doc = await Document.findOne({where: {shareDocument: {id: sd.id}}});
    if (!doc) {
        ws.send('Document has been deleted!');
        return;
    }

    // sanity checks.
    switch (doc.state) {
        case DocumentStatus.ACTIVE:
            if (doc.version !== CURRENT_VERSION) {
                const msg: DocumentClientMessage = [{
                    type: DocumentWSMessageType.DOCUMENT_ERROR,
                    message: 'Cannot open this document - it is out of date.',
                }];
                ws.send(JSON.stringify(msg));
                return;
            }

            // that's ok
            break;
        case DocumentStatus.DELETED: {
            const msg: DocumentClientMessage = [{
                type: DocumentWSMessageType.DOCUMENT_ERROR,
                message: 'Cannot open this document - it is deleted.',
            }];
            ws.send(JSON.stringify(msg));
            return ;
        }
        case DocumentStatus.PENDING: {
            const msg: DocumentClientMessage = [{
                type: DocumentWSMessageType.DOCUMENT_ERROR,
                message: 'Cannot open this document - it is pending. Try again later',
            }];
            ws.send(JSON.stringify(msg));
            return;
        }
        default:
            assertUnreachable(doc.state);
    }

    const cdoc = new ConcurrentDocument(
        doc.id,
        async () => {
            operations = await Operation
                .createQueryBuilder("operation")
                .leftJoinAndSelect("operation.blame", "user")
                .where("operation.document = :document", { document: doc.id })
                .andWhere('operation.orderIndex > :minOrderIndex', {minOrderIndex: lastOpId})
                .orderBy("operation.orderIndex", "ASC")
                .getMany();

            for (const op of operations) {
                toSend.push({
                    type: DocumentWSMessageType.OPERATION,
                    operation: op.operation,
                });
                lastOpId = op.orderIndex;
            }
            await sendQueueToWs();
        },
        async () => {
            toSend.push({
                type: DocumentWSMessageType.DOCUMENT_DELETED,
            });
            await sendQueueToWs();
        }
    );

    const pingPid = setInterval(function timeout() {
        try {
            ws.ping("heartbeat");
        } catch (e) {
            closeHandler();
        }
    }, 10000);

    const closeHandler = () => {
        clearInterval(pingPid);
        cdoc.close();
    };

    ws.on("close", closeHandler);
    
    let operations: Operation[] = [];
    let drawing: DrawingState = cloneSimple(initialDrawing);
    let lastOpId = -1;
    // Now that we have hooked update handlers, Load document. Reconstruct the state, and send the
    // initial document state.
    await cdoc.withDocumentLock(async (tx, docVal) => {
        operations = await tx.getRepository(Operation)
            .createQueryBuilder("operation")
            .leftJoinAndSelect("operation.blame", "user")
            .where("operation.document = :document", { document: doc.id })
            .orderBy("operation.orderIndex", "ASC")
            .getMany();

        // form document to get snapshot
        drawing = cloneSimple(initialDrawing);
        for (const op of operations) {
            if (op.operation.type === OPERATION_NAMES.DIFF_OPERATION) {
                applyDiffNative(drawing, op.operation.diff);
            }
            lastOpId = op.orderIndex;
        }

        docVal.metadata = drawing.metadata.generalInfo;
        await tx.save(docVal);
    });

    const wholeThing = diffState(initialDrawing, drawing, undefined);

    const toSend: DocumentClientMessage = [];

    if (operations.length) {
        if (wholeThing.length) {
            wholeThing[0].id = lastOpId - 1;
            toSend.push({ type: DocumentWSMessageType.OPERATION, operation: wholeThing[0] });
        }
        toSend.push({
            type: DocumentWSMessageType.OPERATION,
            operation: { type: OPERATION_NAMES.COMMITTED_OPERATION, id: lastOpId },
        });
    }

    toSend.push({
        type: DocumentWSMessageType.DOCUMENT_LOADED,
    });

    let working = false;
    async function sendQueueToWs() {
        if (!working) {
            working = true;
            while (toSend.length) {
                const sendNow = toSend.splice(0);
                await ws.send(JSON.stringify(sendNow));
            }
            working = false;
        }
    }

    await sendQueueToWs();
});

router.post("/:id/reset", controller.reset.bind(controller));

router.post("/", controller.create.bind(controller));
router.delete("/:id", controller.delete.bind(controller));
router.post("/:id/clone", controller.clone.bind(controller));
router.get("/:id/operations", controller.findOperations.bind(controller));
router.put("/:id", controller.update.bind(controller));
router.get("/:id", controller.findOne.bind(controller));
router.post("/:id/restore", controller.restore.bind(controller));
router.get("/", controller.find.bind(controller));

export const documentRouter = router;
