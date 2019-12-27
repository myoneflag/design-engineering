import {Module} from 'vuex';
import {getters} from './getters';
import {actions} from './actions';
import {mutations} from './mutations';
import {DocumentState, initialDocumentState} from './types';
import {RootState} from '../types';
import {EntityType} from '../../../src/store/document/entities/types';
import {cloneSimple} from '../../../src/lib/utils';
import {assertUnreachable} from "../../config";
import {ConnectableEntityConcrete, DrawableEntityConcrete} from "./entities/concrete-entity";

export const state: DocumentState = cloneSimple(initialDocumentState);

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
        case EntityType.FITTING:
        case EntityType.SYSTEM_NODE:
        case EntityType.RISER:
        case EntityType.FLOW_RETURN:
        case EntityType.DIRECTED_VALVE:
        case EntityType.LOAD_NODE:
            return true;
        case EntityType.TMV:
        case EntityType.FIXTURE:
        case EntityType.BACKGROUND_IMAGE:
        case EntityType.PIPE:
            return false;
    }
    assertUnreachable(type);
}

export function isConnectableEntity(e: DrawableEntityConcrete): e is ConnectableEntityConcrete {
    return isConnectable(e.type);
}

export function isCentered(type: EntityType): boolean {
    switch (type) {
        case EntityType.FITTING:
        case EntityType.SYSTEM_NODE:
        case EntityType.RISER:
        case EntityType.FLOW_RETURN:
        case EntityType.TMV:
        case EntityType.FIXTURE:
        case EntityType.LOAD_NODE:
        case EntityType.DIRECTED_VALVE:
            return true;
        case EntityType.BACKGROUND_IMAGE:
        case EntityType.PIPE:
            return false;
    }
    assertUnreachable(type);
}

export function getDragPriority(type: EntityType): number {
    switch (type) {
        case EntityType.SYSTEM_NODE:
        case EntityType.LOAD_NODE:
            return 100;
        case EntityType.DIRECTED_VALVE:
            return 30;
        case EntityType.RISER:
            return 10;
        case EntityType.FITTING:
            return 5;
        case EntityType.FLOW_RETURN:
            return 0;
        case EntityType.TMV:
        case EntityType.FIXTURE:
        case EntityType.BACKGROUND_IMAGE:
        case EntityType.PIPE:
            throw new Error('not a connectable');
    }
    assertUnreachable(type);
}
