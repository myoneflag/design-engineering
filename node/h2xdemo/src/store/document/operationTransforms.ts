import Vue from 'vue';

export interface OperationTransform {
    order: number;
    type: string;
}

export interface TitleChangeOperation extends OperationTransform {
    titleFrom: string;
    titleTo: string;
}

export function createTitleChangeOperation(order: number, titleFrom: string, titleTo: string): TitleChangeOperation {
    return {order, type: OPERATION_NAMES.TITLE_CHANGE, titleFrom, titleTo};
}

export const OPERATION_NAMES = {
    TITLE_CHANGE: 'TITLE_CHANGE',
};

export const OTEventBus = new Vue();
