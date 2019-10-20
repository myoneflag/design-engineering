import {Module} from 'vuex';
import {getters} from './getters';
import {actions} from './actions';
import {mutations} from './mutations';
import {DocumentState, initialValue} from './types';
import {RootState} from '../types';
import * as _ from 'lodash';
import {EntityType} from '@/store/document/entities/types';
import {cloneSimple} from '@/lib/utils';

export const state: DocumentState = cloneSimple(initialValue);

const namespaced: boolean = true;

export const document: Module<DocumentState, RootState> = {
    namespaced,
    state,
    getters,
    actions,
    mutations,
};

export function isConnectable(type: EntityType): boolean {
    switch (type) {
        case EntityType.VALVE:
        case EntityType.SYSTEM_NODE:
        case EntityType.FLOW_SOURCE:
        case EntityType.FLOW_RETURN:
            return true;
        case EntityType.TMV:
        case EntityType.FIXTURE:
        case EntityType.BACKGROUND_IMAGE:
        case EntityType.PIPE:
        case EntityType.RESULTS_MESSAGE:
            return false;
    }
}

export function getDragPriority(type: EntityType): number {
    switch (type) {
        case EntityType.VALVE:
            return 5;
        case EntityType.SYSTEM_NODE:
            return 100;
        case EntityType.FLOW_SOURCE:
            return 10;
        case EntityType.FLOW_RETURN:
            return 0;
        case EntityType.TMV:
        case EntityType.FIXTURE:
        case EntityType.BACKGROUND_IMAGE:
        case EntityType.PIPE:
        case EntityType.RESULTS_MESSAGE:
            throw new Error('not a connectable');
    }
}
