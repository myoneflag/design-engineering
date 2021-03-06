import {
    APIResult,
    DocumentClientMessage,
    DocumentWSMessageType
} from "../../../common/src/api/document/types";
import * as OT from "../../../common/src/api/document/operation-transforms";
import axios from "axios";
import ReconnectingWebSocket, { CloseEvent } from "reconnecting-websocket";
import { Document } from "../../../common/src/models/Document";
import { DrawingState, GeneralInfo } from "../../../common/src/api/document/drawing";
import { Operation } from "../../../common/src/models/Operation";
import { assertUnreachable } from "../../../common/src/api/config";
import { SupportedLocales } from "../../../common/src/api/locale";

const ongoingWebsockets = new Map<number | string, ReconnectingWebSocket>();

export function openDocument(
    id: number,
    operationNextIdFunc: () => number,
    onOperation: (ot: OT.OperationTransformConcrete) => void,
    onDeleted: () => void,
    onLoaded: () => void,
    onError: (msg: string) => void,
    baseWebsocketPath: string = "/api/documents/"
) {

    function websocketUrl() {
        const lastOpId = operationNextIdFunc() - 1;
        let baseWebsocketUrl = HOST + baseWebsocketPath + id + "/websocket";
        if (lastOpId > 0)
            baseWebsocketUrl += `?lastOpId=${lastOpId}`;
        return baseWebsocketUrl;
    }

    let connectionAttempt = 0;
    if (ongoingWebsockets.has(id)) {
        throw new Error("warning: Document is already open");
    }
    const HOST = location.origin.replace(/^http(s?)/, "ws$1");
    const ws = new ReconnectingWebSocket(websocketUrl, undefined, { maxRetries: 5 });
    ongoingWebsockets.set(id, ws);

    ws.onmessage = (wsmsg: MessageEvent) => {
        if (wsmsg.type === "message") {
            const data: DocumentClientMessage = JSON.parse(wsmsg.data as string);
            data.forEach((msg) => {
                switch (msg.type) {
                    case DocumentWSMessageType.OPERATION:
                        onOperation(msg.operation);
                        break;
                    case DocumentWSMessageType.DOCUMENT_DELETED:
                        onDeleted();
                        break;
                    case DocumentWSMessageType.DOCUMENT_LOADED:
                        onLoaded();
                        break;
                    case DocumentWSMessageType.DOCUMENT_ERROR:
                    case DocumentWSMessageType.DOCUMENT_UPDATE:
                        onError(msg.message);
                        break;
                    default:
                        assertUnreachable(msg);
                }
            });
        } else {
            throw new Error(
                "unknown websocket message type " + JSON.stringify(wsmsg.type) + " " + JSON.stringify(wsmsg)
            );
        }
    };

    queues.set(id, []);

    ws.onclose = (ev: CloseEvent) => {
        if (ev.code !== 1000) {
            connectionAttempt++
            if (connectionAttempt > 4) {
                onError(ev.code + " " + ev.reason);
            }
        }
    };
}

export async function updateDocument(
    id: number,
    organization: string | undefined,
    metadata: GeneralInfo | undefined,
    tags: string | undefined
): Promise<APIResult<Document>> {
    try {
        return (
            await axios.put("/api/documents/" + id, {
                organization,
                metadata,
                tags
            })
        ).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function closeDocument(id: number | string) {
    if (ongoingWebsockets.has(id)) {
        const ws = ongoingWebsockets.get(id)!;
        queues.delete(id);
        ongoingWebsockets.delete(id);
        await ws.close();
    } else {
        throw new Error("Document already closed: " + id);
    }
}

export async function sendOperations(id: number, ops: OT.OperationTransformConcrete[]) {
    if (ongoingWebsockets.has(id)) {
        const p = ongoingWebsockets.get(id)!.send(JSON.stringify(ops));
        const timedOut = await Promise.race([
            p,
            new Promise((res, rej) => {
                setTimeout(() => {
                    res(true);
                }, 1000);
            })
        ]);

        if (timedOut) {
            await p;
        }
    } else {
        throw new Error("Document already closed");
    }
}

const queues = new Map<number | string, OT.OperationTransformConcrete[][]>();
const submitLoopRunning = new Set<number>();

async function submitLoop(id: number) {
    submitLoopRunning.add(id);
    if (ongoingWebsockets.has(id)) {
        const queue = queues.get(id)!;
        await sendOperations(id, queue[0]);
        queue.splice(0, 1);
        if (queue.length) {
            await submitLoop(id);
        } else {
            submitLoopRunning.delete(id);
        }
    }
}

export async function submitOperation(id: number, commit: any, ops: OT.OperationTransformConcrete[]) {
    // yay it's javascript! There's no atomic concurrency issues!
    const queue = queues.get(id)!;

    queue.push(ops);
    if (!submitLoopRunning.has(id)) {
        return await submitLoop(id);
    }
}

export async function getDocuments(): Promise<APIResult<Document[]>> {
    try {
        return (await axios.get("/api/documents/")).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function getDocument(id: number): Promise<APIResult<Document>> {
    try {
        return (await axios.get("/api/documents/" + id)).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function getSharedDocument(sharedId: string): Promise<APIResult<Document>> {
    try {
        return (await axios.get("/api/documents/shared/" + sharedId)).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export const EXAMPLE_DOCUMENT_ID = 1;
export async function createDocument(locale: SupportedLocales, templateId: number | null = null): Promise<APIResult<Document>> {
    try {
        let params = {};
        if (templateId != null) {
            params = {
                templateId
            }
        }
        return (
            await axios.post("/api/documents/", {
                locale: locale
            }, { params: params } )
        ).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function deleteDocument(id: number): Promise<APIResult<void>> {
    try {
        return (await axios.delete("/api/documents/" + id)).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function restoreDocument(id: number): Promise<APIResult<void>> {
    try {
        return (await axios.post("/api/documents/" + id + "/restore")).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function cloneDocument(id: number): Promise<APIResult<Document>> {
    try {
        return (await axios.post("/api/documents/" + id + "/clone")).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function getDocumentHistory(id: number): Promise<APIResult<Operation[]>> {
    try {
        return (await axios.get("/api/documents/" + id + "/history")).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}

export async function getDocumentHistorySnapshot(id: number, lastOpId: number): Promise<APIResult<DrawingState>> {
    try {
        return (await axios.get("/api/documents/" + id + "/snapshot/" + lastOpId)).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}
