import { IsNull } from "typeorm";
import { NextFunction, Request, Response, Router } from "express";
import { initialDrawing, Level } from "../../../common/src/api/document/drawing";
import { diffObject, diffState } from "../../../common/src/api/document/state-differ";
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
import { handleWebSocket, sendErrorMessage } from "./document/handlers";
import { EXAMPLE_DRAWING, EXAMPLE_DRAWING_VERSION, EXAMPLE_META } from "../../../common/src/api/constants/example-drawing";
import { CustomEntity } from "../../../common/src/models/CustomEntity";
import { EntityType } from "../../../common/src/api/document/entities/types";
import ws from "ws";
import { Drawing, DrawingStatus } from "../../../common/src/models/Drawing";
import { applyDiffNative } from "../../../common/src/api/document/state-ot-apply";
import { DiffOperation, OPERATION_NAMES } from "../../../common/src/api/document/operation-transforms";
import { DocumentUpgrader } from "../services/DocumentUpgrader";
import { OperationRepository } from "../repositories/OperationRepository";
import { DrawingRepository } from "../repositories/DrawingRepository";

export class DocumentController {

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
        const initialDrawingState = cloneSimple(initialDrawing(doc.locale));
        let newDocumentState;
        if (createExampleDoc) {
            doc.metadata = EXAMPLE_META;
            doc.version = EXAMPLE_DRAWING_VERSION;
            newDocumentState = cloneSimple(EXAMPLE_DRAWING);
        } else {
            doc.metadata = initialDrawingState.metadata.generalInfo;
            doc.version = CURRENT_VERSION;
            newDocumentState = cloneSimple(initialDrawingState);
        }
        doc.state = DocumentStatus.ACTIVE;
        doc.shareDocument = sd;
        await doc.save();

        const drawingData = Drawing.create();
        drawingData.dateTime = new Date();
        drawingData.documentId = doc.id;
        drawingData.status = DrawingStatus.CURRENT;
        drawingData.drawing = initialDrawingState;
        drawingData.version = CURRENT_VERSION;

        if (createExampleDoc) {
            const exampleDiff = diffState(initialDrawingState, newDocumentState, undefined)[0];
            applyDiffNative(drawingData.drawing, (exampleDiff as DiffOperation).diff);
        }
        await drawingData.save();

        const operation = Operation.create();
        operation.documentId = doc.id;
        operation.orderIndex = doc.nextOperationIndex;
        operation.operation = {
            id: operation.orderIndex,
            type: OPERATION_NAMES.DIFF_OPERATION,
            diff: drawingData.drawing,
            inverse: diffObject(drawingData.drawing, null, undefined),
        };
        operation.blame = doc.createdBy;
        operation.dateTime = doc.createdOn;
        operation.version = CURRENT_VERSION;
        Operation.insert(operation);

        doc.nextOperationIndex++;
        doc.save();

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

                results = await Document.find({
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
    public async listHistory(req: Request, res: Response, next: NextFunction, session: Session) {
        const documentId = Number(req.params.id);
        await withDocument(documentId, res, session, AccessType.READ, async (doc) => {
            const operations = await OperationRepository.findOperationsBatch(documentId, true, null, null,
                (op: Operation) => {
                    // null-out the body of the operation diff since it's not needed, and enormous for large documents
                    // we do need the operation type and a brief of levels/entities affected by operation
                    if (op.operation.type === OPERATION_NAMES.DIFF_OPERATION) {
                        nullOutDiffDocumentProperties(op.operation.diff);
                        nullOutDiffDocumentProperties(op.operation.inverse);
                    }
                });
            res.status(200).send({
                success: true,
                data: operations,
            });
        });

        function nullOutDiffDocumentProperties(operation: any) {
            if (operation) {
                if (operation.shared) {
                    Object.values(operation.shared).forEach((ent) => {
                        nullOutEntityProperties(ent);
                    });
                }
                if (operation.levels) {
                    Object.values(operation.levels).forEach((level: Level) => {
                        if (level.entities) {
                            Object.values(level.entities).forEach((ent) => {
                                nullOutEntityProperties(ent);
                            });
                        }
                    });
                }
            }
        }

        function nullOutEntityProperties(ent: any) {
            Object.keys(ent).forEach((prop) => {
                if (prop !== "id" && prop !== "type" && prop !== "deleted") {
                    ent[prop] = null;
                }
            });
        }
    }

    @ApiHandleError()
    @AuthRequired()
    public async getDocumentHistorySnapshot(req: Request, res: Response, next: NextFunction, session: Session) {

        const DOCUMENT_AUTO_SNAPSHOT = 5000;

        const documentId = Number(req.params.id);
        const operationOrderIndex = Number(req.params.opId);
        console.info(`Retrieve document snapshot at orderIndex: ${operationOrderIndex}`);
        await withDocument(documentId, res, session, AccessType.READ, async (document) => {
            // when we compose the drawing from operations,
            // we upgrade internally as we encounter new versions in the list of operations

            // check for snapshots with orderIndex closest to operationId
            // if no snapshots exists start from initial drawing
            let drawing = initialDrawing(document.locale);
            let lastVersion = -1;
            let retrieveOperationStartIndex = -1;

            // if snapshots do exist get the latest and load up the drawing
            const existingSnapShots = await DrawingRepository.findSnapshotDrawingsSorted(document.id);
            if (existingSnapShots && existingSnapShots.length) {
                const closestSnapshot = existingSnapShots.slice().reverse()
                    .find((snap) => operationOrderIndex > snap.orderIndex);
                if (closestSnapshot) {
                    console.info(`Found snapshot docId: ${documentId} orderIndex: ${closestSnapshot.orderIndex}, id: ${closestSnapshot.id}`);
                    console.info(`Snapshot has ${Object.keys(closestSnapshot.drawing.levels).length}`);
                    drawing = closestSnapshot.drawing;
                    lastVersion = closestSnapshot.version;
                    retrieveOperationStartIndex = closestSnapshot.orderIndex + 1;
                }
            }

            // load up operations only after the snapshots operation up to the requested operation
            await OperationRepository.findOperationsBatch(
                documentId, false, retrieveOperationStartIndex, operationOrderIndex, async (op) => {
                    lastVersion =
                        DocumentUpgrader.updateDrawingStateWithOperations([op], drawing, true, lastVersion);
                    // every so many operations, create a snapshot of the document
                    // next time history is retrieved the snapshot is used
                    if (op.orderIndex && (op.orderIndex % DOCUMENT_AUTO_SNAPSHOT === 0)) {
                        console.info(`Creating snapshot docId: ${documentId} orderIndex: ${op.orderIndex}`);
                        const snapShot = Drawing.create();
                        snapShot.documentId = documentId;
                        snapShot.blame = op.blame;
                        snapShot.dateTime = op.dateTime;
                        snapShot.orderIndex = op.orderIndex;
                        snapShot.version = op.version;
                        snapShot.status = DrawingStatus.SNAPSHOT;
                        snapShot.drawing = drawing;
                        console.log(`Saving snapshot with ${Object.keys(drawing.levels).length} levels.`);
                        await Drawing.getRepository().insert(snapShot);
                    }
                });

            // the final drawing (even if it stops at an older version) we upgrade again up to CURRENT_VERSION
            // when we do so, migration mandatory operations need to be added to the drawing since they contain
            // critical changes for the document
            await OperationRepository.findMigrationOperations(
                documentId, operationOrderIndex + 1, async (op) => {
                    lastVersion =
                        DocumentUpgrader.updateDrawingStateWithOperations([op], drawing, true, lastVersion);
                });

            res.status(200).send({
                success: true,
                data: drawing,
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
                doc.locale = target.locale;

                await doc.save();

                const drawingObj = await DrawingRepository.findCurrentDrawing(targetId);
                const newDrawing = drawingObj.drawing;
                const newDrawingObject = Drawing.create();
                newDrawingObject.documentId = doc.id;
                newDrawingObject.drawing = newDrawing;
                newDrawingObject.status = DrawingStatus.CURRENT;
                newDrawingObject.version = CURRENT_VERSION;
                newDrawingObject.drawing.metadata.generalInfo.title = doc.metadata.title;
                await newDrawingObject.save();

                const operation = Operation.create();
                operation.documentId = doc.id;
                operation.orderIndex = doc.nextOperationIndex;
                operation.operation = {
                    id: operation.orderIndex,
                    type: OPERATION_NAMES.DIFF_OPERATION,
                    diff: newDrawing,
                    inverse: diffObject(newDrawing, null, undefined),
                };
                operation.blame = doc.lastModifiedBy;
                operation.dateTime = doc.lastModifiedOn;
                operation.version = CURRENT_VERSION;
                Operation.insert(operation);

                doc.nextOperationIndex++;
                doc.save();

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

router.ws("/:id/websocket", (webSocket: ws, req) => {
    const docId = Number(req.params.id);
    withAuth(
        req,
        async (session) => {
            withDocument(docId, null, session, AccessType.UPDATE,
                async (doc) => handleWebSocket(doc, webSocket, false, session));
        },
        (msg) => {
            sendErrorMessage(webSocket, "Authorization failed: " + msg);
        },
    );
});

router.ws("/share/:id/websocket", async (webSocket: ws, req) => {
    const token = req.params.id;
    const sd = await ShareDocument.findOne({ token });

    if (!sd) {
        sendErrorMessage(webSocket, 'Invalid link!');
        return;
    }

    const doc = await Document.findOne({ where: { shareDocument: { id: sd.id } } });
    if (!doc) {
        sendErrorMessage(webSocket, 'Document has been deleted!');
        return;
    }
    handleWebSocket(doc, webSocket, true, null);
});

router.post("/", controller.create.bind(controller));
router.delete("/:id", controller.delete.bind(controller));
router.post("/:id/clone", controller.clone.bind(controller));
router.get("/:id/history", controller.listHistory.bind(controller));
router.get("/:id/snapshot/:opId", controller.getDocumentHistorySnapshot.bind(controller));
router.put("/:id", controller.update.bind(controller));
router.get("/:id", controller.findOne.bind(controller));
router.get("/shared/:sharedId", controller.findOneShared.bind(controller));
router.post("/:id/restore", controller.restore.bind(controller));
router.get("/", controller.find.bind(controller));

export const documentRouter = router;
