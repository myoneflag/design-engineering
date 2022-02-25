import { CURRENT_VERSION, assertUnreachable } from "../../../../common/src/api/config";
import { DrawingState } from "../../../../common/src/api/document/drawing";
import { OperationTransformConcrete, OPERATION_NAMES } from "../../../../common/src/api/document/operation-transforms";
import { applyDiffNative } from "../../../../common/src/api/document/state-ot-apply";
import { DocumentClientMessage, DocumentWSMessageType, OperationMessage } from "../../../../common/src/api/document/types";
import { DocumentStatus } from "../../../../common/src/models/Document";
import { Operation } from "../../../../common/src/models/Operation";
import { Document } from "../../../../common/src/models/Document";
import ConcurrentDocument from "../../services/concurrentDocument";
import { Session } from "../../../../common/src/models/Session";
import { Drawing, DrawingStatus } from "../../../../common/src/models/Drawing";
import ws from "ws";
import config from "../../config/config";
import { DocumentUpgrader } from "../../services/DocumentUpgrader";
import LRU from "lru-cache";
import { DrawingRepository } from "../../repositories/DrawingRepository";

export async function handleWebSocket(doc: Document, webSocket: ws, readonly: boolean, session: Session) {
    const errorMessage = checkForLoadingErrors(doc, webSocket);
    if (errorMessage) {
        sendErrorMessage(webSocket, errorMessage);
        return;
    }
    try {

        // we're using a local cache to cache written operations so we don't have to queru the database right away
        // this code, as a client to the MQ, will publish a message and will immediately be received by the same client
        const localCache = new LRU({
            max: 100,               // cache last 100 operations
            length: () => 1,        // no matter the operation size, we count it as 1
            maxAge: 1000 * 30 },    // for 30 seconds
        );

        function getCachedOperations(lastOpOrderId: number) {
            let operationId = lastOpOrderId + 1;
            const operations = [];
            let operation;

            operation = localCache.get(operationId);
            while (operation) {
                operations.push(operation);
                operationId++;
                operation = localCache.get(operationId);
            }

            return operations;
        }

        if (!config.MODE_PRODUCTION) {
            if (doc.version < CURRENT_VERSION) {
                await DocumentUpgrader.onDocumentUpgradeRequest(doc.id);
            }
        }

        const outgoingMessageQueue: DocumentClientMessage = [];
        let lastOpId;

        const cdoc = new ConcurrentDocument(
            doc.id,
            async function onDocumentUpdate() {
                try {
                    const timingLabel = `timer:updateMessage:${doc.id}`;
                    console.time(timingLabel);

                    let operations;

                    operations = getCachedOperations(lastOpId);
                    if (!operations.length) {
                        console.log("operations cache miss");
                        operations = await getDbOperations(doc, lastOpId);
                        if (!operations) {
                            throw new Error("No operations found during Update notification");
                        }
                    }

                    const lastOperation = operations.slice(-1)[0];

                    lastOpId = lastOperation.orderIndex;

                    const messages = createMessagesFromOperations(operations);
                    outgoingMessageQueue.push(...messages);
                    await sendOutgoingQueue();
                    console.timeEnd(timingLabel);
                } catch (err) {
                    console.error(err);
                    sendErrorMessage(webSocket, "An error has ocurred while receiving updates. Please refresh.");
                }
            },
            async () => {
                outgoingMessageQueue.push({
                    type: DocumentWSMessageType.DOCUMENT_DELETED,
                });
                await sendOutgoingQueue();
            });

        setupCloseAndPingHandler(cdoc);

        function setupIncomingMessageHandler() {
            webSocket.on("message", async (message) => {
                incomingMessageQueue.push(message as string);
                await onIncommingMessage();
            });

            const incomingMessageQueue: string[] = [];
            async function onIncommingMessage() {
                try {
                    const timingLabel = `timer:incommingMessage:${doc.id}`;
                    console.time(timingLabel);
                    while (incomingMessageQueue.length) {
                        const message = incomingMessageQueue.splice(0, 1)[0];
                        const ops: OperationTransformConcrete[] = JSON.parse(message as string);
                        if (ops.length) {
                            let nextOpId = 0;
                            await cdoc.withDocumentLock(async (tx, docVal) => {
                                nextOpId = docVal.nextOperationIndex;
                                const drawingObj = await tx.getRepository(Drawing).findOneOrFail(
                                    { where: { documentId: docVal.id, status: DrawingStatus.CURRENT }});
                                const now = new Date();
                                for (const op of ops) {
                                    op.id = nextOpId;
                                    const newOperation = Operation.create();
                                    newOperation.document = Promise.resolve(docVal);
                                    newOperation.dateTime = now;
                                    newOperation.blame = session.user;
                                    newOperation.operation = op;
                                    newOperation.orderIndex = op.id;
                                    newOperation.version = CURRENT_VERSION;
                                    newOperation.documentId = docVal.id;
                                    await tx.insert(Operation, newOperation);

                                    localCache.set(newOperation.orderIndex, newOperation);

                                    if (op.type === OPERATION_NAMES.DIFF_OPERATION) {
                                        applyDiffNative(drawingObj.drawing, op.diff);
                                        drawingObj.dateTime = newOperation.dateTime;
                                        drawingObj.blame = newOperation.blame;
                                    }

                                    nextOpId += 1;
                                    docVal.nextOperationIndex = nextOpId;
                                }

                                await tx.update(Drawing, drawingObj.id, { ... drawingObj });

                                docVal.lastModifiedBy = session.user;
                                docVal.lastModifiedOn = now;
                                docVal.metadata = drawingObj.drawing.metadata.generalInfo;
                                await tx.update(Document, docVal.id, docVal);
                            });
                            await cdoc.notifyUpdate(nextOpId);
                        }
                    }
                    console.timeEnd(timingLabel);
                } catch (err) {
                    console.error(err);
                    sendErrorMessage(webSocket, "An error has occured while updating the document. Please refresh and try again.");
                }
            }
        }
        if (!readonly && session) {
            setupIncomingMessageHandler();
        }

        lastOpId = await handleInitialData(lastOpId, outgoingMessageQueue);

        async function sendOutgoingQueue() {
            while (outgoingMessageQueue.length) {
                const message = outgoingMessageQueue.splice(0);
                await webSocket.send(JSON.stringify(message));
            }
        }

        await sendOutgoingQueue();

    } catch (err) {
        console.error(err);
        sendErrorMessage(webSocket, "An error has occured establishing the connection to the server.");
    }

    async function handleInitialData(lastOpId: any, outgoingMessageQueue: DocumentClientMessage) {
        let drawing: DrawingState;
        lastOpId = doc.nextOperationIndex - 1;
        const drawingObject = await DrawingRepository.findCurrentDrawing(doc.id);
        drawing = drawingObject.drawing;

        const openDocumentMessages = createMessagesFromDrawing(drawing, lastOpId);
        outgoingMessageQueue.push(...openDocumentMessages);
        return lastOpId;
    }

    function setupCloseAndPingHandler(cdoc: ConcurrentDocument) {
        const pingPid = setInterval(function timeout() {
            try {
                webSocket.ping("heartbeat");
            } catch (e) {
                closeHandler();
            }
        }, 10000);
        const closeHandler = () => {
            clearInterval(pingPid);
            cdoc.close();
        };
        webSocket.on("close", closeHandler);
        return closeHandler;
    }
}

async function getDbOperations(doc: Document, lastOpId: number): Promise<Operation[]> {
    let operations;
    let attemptCount = 0;
    while ( true && attemptCount < 10) {
        operations = await Operation
            .createQueryBuilder("operation")
            .leftJoinAndSelect("operation.blame", "user")
            .where("operation.document = :document", { document: doc.id })
            .andWhere('operation.orderIndex > :minOrderIndex', { minOrderIndex: lastOpId })
            .orderBy("operation.orderIndex", "ASC")
            .getMany();
        if (operations.length > 0) {
            break;
        }
        attemptCount++;
        console.log(`Retrying fetching operations ${attemptCount}`);
    }
    return operations;
}

export function sendErrorMessage(webSocket: ws, message: string) {
    const msg: DocumentClientMessage = [{
        type: DocumentWSMessageType.DOCUMENT_ERROR,
        message,
    }];
    webSocket.send(JSON.stringify(msg));
}

function checkForLoadingErrors(doc: Document, webSocket: ws) {
    let errorMessage;
    switch (doc.state) {
        case DocumentStatus.ACTIVE:
            if (config.MODE_PRODUCTION && doc.version !== CURRENT_VERSION) {
                errorMessage = "Cannot open this document - it is out of date.";
            }
            break;
        case DocumentStatus.DELETED: {
            errorMessage = "Cannot open this document - it is deleted.";
            return;
        }
        case DocumentStatus.PENDING: {
            errorMessage = "Cannot open this document - it is pending. Try again later";
            return;
        }
        default:
            assertUnreachable(doc.state);
    }
    return errorMessage;
}

function createMessagesFromDrawing(drawing: DrawingState, lastOpId: number) {
    const openDocumentMessages: DocumentClientMessage = [];
    openDocumentMessages.push({
        type: DocumentWSMessageType.OPERATION,
        operation: {
            type: OPERATION_NAMES.DIFF_OPERATION,
            diff: drawing,
            inverse: null,
            id: lastOpId,
        },
    });
    openDocumentMessages.push({
        type: DocumentWSMessageType.OPERATION,
        operation: { type: OPERATION_NAMES.COMMITTED_OPERATION, id: lastOpId },
    });
    openDocumentMessages.push({
        type: DocumentWSMessageType.DOCUMENT_LOADED,
    });
    return openDocumentMessages;
}

function createMessagesFromOperations(operations: Operation[]) {
    return operations.map( (op) => {
        return {
            type: DocumentWSMessageType.OPERATION,
            operation: op.operation,
        } as OperationMessage;
    });
}
