// please also maintain the equivalent messages in the backend code.

export enum FileWebsocketMessageType {
    OPERATION = 'OPERATION',
    FILE_DELETED = 'FILE_DELETED',
    FILE_LOADED = 'FILE_LOADED',
}

export interface FileWebsocketMessage {
    type: FileWebsocketMessageType;
    operation: any;
    message: string;
}
