import {Module} from 'vuex';
import {getters} from './getters';
import {actions} from './actions';
import {mutations} from './mutations';
import {DocumentState, initialValue} from './types';
import {RootState} from '../types';
import * as _ from 'lodash';
import {EntityType} from '@/store/document/entities/types';

export const state: DocumentState = _.cloneDeep(initialValue);

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
        case EntityType.INVISIBLE_NODE:
        case EntityType.SYSTEM_NODE:
        case EntityType.FLOW_SOURCE:
        case EntityType.FLOW_RETURN:
            return true;
        case EntityType.TMV:
        case EntityType.FIXTURE:
        case EntityType.BACKGROUND_IMAGE:
        case EntityType.PIPE:
            return false;
        default:
            throw new Error('type not recognised ' + type);
    }
}
