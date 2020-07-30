import { Module } from "vuex";
import { RootState } from "../../../src/store/types";
import { getters } from "../../../src/store/catalog/getters";
import { actions } from "../../../src/store/catalog/actions";
import { mutations } from "../../../src/store/catalog/mutations";
import CatalogState from "../../../src/store/catalog/types";

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
        prv: {
            manufacturer: [],
            size: {},
        },
        balancingValves: {
            manufacturer: [],
        },
        hotWaterPlant: {
            manufacturer: [],
            grundfosPressureDrop: {},
        }
    },
    loaded: false
};

const namespaced: boolean = true;

export const catalog: Module<CatalogState, RootState> = {
    namespaced,
    state,
    getters,
    actions,
    mutations
};

