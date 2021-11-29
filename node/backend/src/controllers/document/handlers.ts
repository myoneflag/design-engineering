import { EntityManager } from "typeorm";
import { CURRENT_VERSION, assertUnreachable } from "../../../../common/src/api/config";
import { initialDrawing, DrawingState } from "../../../../common/src/api/document/drawing";
import { OperationTransformConcrete, OPERATION_NAMES } from "../../../../common/src/api/document/operation-transforms";
import { diffState } from "../../../../common/src/api/document/state-differ";
import { applyDiffNative } from "../../../../common/src/api/document/state-ot-apply";
import { DocumentClientMessage, DocumentWSMessageType } from "../../../../common/src/api/document/types";
import { DocumentStatus } from "../../../../common/src/models/Document";
import { Operation } from "../../../../common/src/models/Operation";
import { Document } from "../../../../common/src/models/Document";
import ConcurrentDocument from "../../services/concurrentDocument";
import { Session } from "../../../../common/src/models/Session";

async function prepQueueOperations(doc: Document, lastOpId: number, toSend: DocumentClientMessage) {
    const operations = await Operation
        .createQueryBuilder("operation")
        .leftJoinAndSelect("operation.blame", "user")
        .where("operation.document = :document", { document: doc.id })
        .andWhere('operation.orderIndex > :minOrderIndex', { minOrderIndex: lastOpId })
        .orderBy("operation.orderIndex", "ASC")
        .getMany();

    for (const op of operations) {
        toSend.push({
            type: DocumentWSMessageType.OPERATION,
            operation: op.operation,
        });
        lastOpId = op.orderIndex;
    }
    return { lastOpId };
}

export async function composeDrawingState(tx: EntityManager, doc: Document) {
    const operations = await tx.getRepository(Operation)
        .createQueryBuilder("operation")
        .leftJoinAndSelect("operation.blame", "user")
        .where("operation.document = :document", { document: doc.id })
        .orderBy("operation.orderIndex", "ASC")
        .getMany();

    // form document to get snapshot
    const drawing = initialDrawing(doc.locale);
    let lastOpId = -1;
    for (const op of operations) {
        if (op.operation.type === OPERATION_NAMES.DIFF_OPERATION) {
            applyDiffNative(drawing, op.operation.diff);
        }
        lastOpId = op.orderIndex;
    }
    return { operations, drawing, lastOpId };
}

function documentLoadStateChecks(doc: Document, ws) {
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
            // OK
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
}

export async function handleWebSocket(doc: Document, ws, readonly: boolean, session: Session) {
    documentLoadStateChecks(doc, ws);
    const cdoc = new ConcurrentDocument(
        doc.id,
        async (nextOpId) => {
            ({ lastOpId } = await prepQueueOperations(doc, lastOpId, toSend));
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

    function handlePostMessage() {
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
    }
    if (!readonly && session) {
        handlePostMessage();
    }

    let operations: Operation[];
    let drawing: DrawingState;
    let lastOpId = -1;
    await cdoc.withDocumentLock(async (tx, docVal) => {
        ({ operations, drawing, lastOpId } = await composeDrawingState(tx, doc));

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
}
