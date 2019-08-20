import Vue from 'vue';

export interface OperationTransform {
    order: number;
    type: string;
}

export interface setTitleOperation extends OperationTransform {
    titleFrom: string;
    titleTo: string;
}

export function createsetTitleOperation(order: number, titleFrom: string, titleTo: string): setTitleOperation {
    return {order, type: OPERATION_NAMES.SET_TITLE, titleFrom, titleTo};
}

export interface SetBackgroundOperation extends OperationTransform {
    oldUri: string;
    oldPaper: string;
    oldScale: number;
    oldPaperScale: string; // keep a record of paper scale, which is obfuscated in calculations, but needed by the editor.
    oldCenterX: number;
    oldCenterY: number;
    oldCrop: {
        x: number;
        y: number;
        w: number;
        h: number;
    };

    uri: string;
    paper: string;
    scale: number;
    paperScale: string;
    centerX: number;
    centerY: number;
    crop: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
}

export interface SetPaperOperation extends OperationTransform {
    oldName: string;
    oldScale: string;

    name: string;
    scale: string;
}

export const OPERATION_NAMES = {
    SET_TITLE: 'SET_TITLE',
    SET_BACKGROUND: 'SET_BACKGROUND',
    SET_PAPER: 'SET_PAPER',
};

export const OTEventBus = new Vue();
