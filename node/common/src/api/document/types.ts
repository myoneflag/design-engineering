// please also maintain the equivalent messages in the backend code.
import * as OT from "./operation-transforms";
import { Coord } from "./drawing";

export enum DocumentWSMessageType {
    UPDATE = "UPDATE",
    OPERATION = "OPERATION",
    DOCUMENT_DELETED = "DOCUMENT_DELETED",
    DOCUMENT_LOADED = "DOCUMENT_LOADED",
    DOCUMENT_ERROR = 'DOCUMENT_ERROR',
    DOCUMENT_UPDATE = 'DOCUMENT_UPDATE',
}

export interface DocumentMessage {
    type: DocumentWSMessageType;
}

export interface OperationMessage extends DocumentMessage {
    type: DocumentWSMessageType.OPERATION;
    operation: OT.OperationTransformConcrete;
}

export interface DocumentErrorMessage extends DocumentMessage {
    type: DocumentWSMessageType.DOCUMENT_ERROR;
    message: string;
}

export interface DocumentUpdateMessage extends DocumentMessage {
    type: DocumentWSMessageType.DOCUMENT_UPDATE;
    message: string;
}

export interface DocumentUpdate {
    type: DocumentWSMessageType.UPDATE;
    nextOpId: number;
}

export interface DocumentDeletedMessage extends DocumentMessage {
    type: DocumentWSMessageType.DOCUMENT_DELETED;
}

export interface DocumentLoadedMessage extends DocumentMessage {
    type: DocumentWSMessageType.DOCUMENT_LOADED;
}

export type DocumentClientMessageSingle = OperationMessage | DocumentDeletedMessage | DocumentLoadedMessage | DocumentErrorMessage | DocumentUpdateMessage;
export type DocumentClientMessage = DocumentClientMessageSingle[];
export type DocumentInternalEvent = DocumentUpdate | DocumentDeletedMessage;

export interface Success<T> {
    success: true;
    data: T;
    message?: string;
    redirect?: boolean;
}

export interface Failure {
    success: false;
    message: string;
    redirect?: boolean;
}

export type APIResult<T> = Success<T> | Failure;

export interface FloorPlanRenders {
    bySize: { [key: string]: FloorPlanRender };
}

export interface FloorPlanRender {
    images: FloorPlanImage[];
    width: number;
    height: number;
}

export interface FloorPlanImage {
    topLeft: Coord;
    width: number;
    height: number;
    key: string;
}
