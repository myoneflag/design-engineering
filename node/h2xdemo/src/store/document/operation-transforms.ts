import Vue from 'vue';
import { Background} from '@/store/document/types';

export interface OperationTransform {
    id: number;
    type: string;
}

export interface SetTitleOperation extends OperationTransform {
    titleFrom: string;
    titleTo: string;
}

export interface AddBackgroundOperation extends OperationTransform {
    background: Background;
}

export interface UpdateBackgroundOperation extends OperationTransform {
    background: Background;
    oldBackground: Background;
    index: number;
}

export interface DeleteBackgroundOperation extends OperationTransform {
    deleted: Background;
    index: number;
}

export const OPERATION_NAMES = {
    SET_TITLE: 'SET_TITLE',
    ADD_BACKGROUND: 'ADD_BACKGROUND',
    UPDATE_BACKGROUND: 'UPDATE_BACKGROUND',
    DELETE_BACKGROUND: 'DELETE_BACKGROUND',
};

