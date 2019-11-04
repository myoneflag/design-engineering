import {Module} from 'vuex';
import {RootState} from '@/store/types';
import {getters} from '@/store/catalog/getters';
import {actions} from '@/store/catalog/actions';
import {mutations} from '@/store/catalog/mutations';
import CatalogState from '@/store/catalog/types';

export const state: CatalogState = {
    defaultCatalog: {
        valves: {},
        fixtures: {},
        pipes: {},
        mixingValves: {},
        psdStandards: {},
        fluids: {},
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
