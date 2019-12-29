import {Module} from 'vuex';
import {RootState} from '../../../src/store/types';
import {getters} from '../../../src/store/catalog/getters';
import {actions} from '../../../src/store/catalog/actions';
import {mutations} from '../../../src/store/catalog/mutations';
import CatalogState from '../../../src/store/catalog/types';

export const state: CatalogState = {
    defaultCatalog: {
        valves: {},
        fixtures: {},
        pipes: {},
        mixingValves: {},
        psdStandards: {},
        dwellingStandards: {},
        fluids: {},
        backflowValves: {},
    },
    loaded: false,
};

const namespaced: boolean = true;

export const catalog: Module<CatalogState, RootState> = {
    namespaced,
    state,
    getters,
    actions,
    mutations,
};

export enum StandardFlowSystemUids {
    ColdWater = 'cold-water',
    HotWater = 'hot-water',
    WarmWater = 'warm-water',
}

export enum StandardMaterialUids {
    Copper = 'copperTypeB',
    Pex = 'pexSdr74',
}
