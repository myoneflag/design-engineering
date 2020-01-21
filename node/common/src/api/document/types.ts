// please also maintain the equivalent messages in the backend code.
import * as OT from "./operation-transforms";
import { Coord } from "./drawing";

export enum DocumentWSMessageType {
    OPERATION = 'OPERATION',
    DOCUMENT_DELETED = 'DOCUMENT_DELETED',
    DOCUMENT_LOADED = 'DOCUMENT_LOADED',
}

export interface OperationMessage {
    type: DocumentWSMessageType.OPERATION;
    operation: OT.OperationTransformConcrete;
}

export interface DocumentDeletedMessage {
    type: DocumentWSMessageType.DOCUMENT_DELETED;
}


export interface DocumentLoadedMessage {
    type: DocumentWSMessageType.DOCUMENT_LOADED;
}


export type DocumentWSMessage = Array<OperationMessage | DocumentDeletedMessage | DocumentLoadedMessage>;


export interface Success<T> {
    success: true;
    data: T;
}

export interface Failure {
    success: false;
    message: string;
}

export type APIResult<T> = Success<T> | Failure;

export interface FloorPlanRenders {
    bySize: {[key: string]: FloorPlanRender};
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

export enum RenderSize {
    SMALL,
    MEDIUM,
    LARGE,
}
