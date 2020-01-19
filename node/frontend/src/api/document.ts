import { APIResult, DocumentWSMessage, DocumentWSMessageType } from "../../../common/src/api/document/types";
import * as OT from "../../../common/src/api/document/operation-transforms";
import axios from "axios";
import { Document } from "../../../common/src/models/Document";
import { Organization } from "../../../common/src/models/Organization";
import { GeneralInfo } from "../../../common/src/api/document/drawing";
import { OperationTransformConcrete } from "../../../common/src/api/document/operation-transforms";
import { Operation } from "../../../common/src/models/Operation";

const wss = new Map<number, WebSocket>();

export function openDocument(
    id: number,
    onOperation: (ot: OT.OperationTransformConcrete) => void,
    onDeleted: () => void,
    onLoaded: () => void,
    onError: (msg: string) => void
) {
    if (wss.has(id)) {
        throw new Error("warning: Document is already open");
    }
    const HOST = location.origin.replace(/^http(s?)/, "ws$1");
    const ws = new WebSocket(HOST + "/api/documents/" + id + "/websocket");
    wss.set(id, ws);

    ws.onmessage = (wsmsg: MessageEvent) => {
        if (wsmsg.type === "message") {
            const data: DocumentWSMessage = JSON.parse(wsmsg.data as string);
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
            onError(ev.code + " " + ev.reason);
        }
    };
}

export async function updateDocument(
    id: number,
    organization: string | undefined,
    metadata: GeneralInfo | undefined
): Promise<APIResult<Document>> {
    try {
        return (
            await axios.put("/api/documents/" + id, {
                organization,
                metadata
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

export async function closeDocument(id: number) {
    if (wss.has(id)) {
        const ws = wss.get(id)!;
        queues.delete(id);
        wss.delete(id);
        await ws.close();
    } else {
        throw new Error("Document already closed: " + id);
    }
}

export async function sendOperations(id: number, ops: OT.OperationTransformConcrete[]) {
    if (wss.has(id)) {
        await wss.get(id)!.send(JSON.stringify(ops));
    } else {
        throw new Error("Document already closed");
    }
}

const queues = new Map<number, OT.OperationTransformConcrete[][]>();
const submitLoopRunning = new Set<number>();

async function submitLoop(id: number) {
    submitLoopRunning.add(id);
    if (wss.has(id)) {
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

export async function createDocument(orgId: string): Promise<APIResult<Document>> {
    try {
        return (
            await axios.post("/api/documents/", {
                organization: orgId
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

export async function resetDocument(id: number): Promise<APIResult<void>> {
    try {
        return (await axios.post("/api/documents/" + id + "/reset")).data;
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

export async function cloneDocument(id: number, organization: string): Promise<APIResult<Document>> {
    try {
        return (await axios.post("/api/documents/" + id + "/clone", {organization})).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}


export async function getDocumentOperations(id: number, after: number): Promise<APIResult<Operation[]>> {
    try {
        return (await axios.get("/api/documents/" + id + "/operations", {params: {after}}, )).data;
    } catch (e) {
        if (e.response && e.response.data && e.response.data.message) {
            return { success: false, message: e.response.data.message };
        } else {
            return { success: false, message: e.message };
        }
    }
}
