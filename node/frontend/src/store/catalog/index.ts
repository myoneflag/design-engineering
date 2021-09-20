import { Module } from "vuex";
import { RootState } from "../../../src/store/types";
import { getters } from "../../../src/store/catalog/getters";
import { actions } from "../../../src/store/catalog/actions";
import { mutations } from "../../../src/store/catalog/mutations";
import CatalogState from "../../../src/store/catalog/types";
import {EN12056FrequencyFactor} from "../../../../common/src/api/config";

export const state: CatalogState = {
    defaultCatalog: {
        valves: {},
        fixtures: {},
        pipes: {},
        mixingValves: {},
        psdStandards: {},
        en12056FrequencyFactor: {
            [EN12056FrequencyFactor.IntermittentUse]: 0.5,
            [EN12056FrequencyFactor.FrequentUse]: 0.7,
            [EN12056FrequencyFactor.CongestedUse]: 1.0,
            [EN12056FrequencyFactor.SpecialUse]: 1.2,
        },
        dwellingStandards: {},
        gasDiversification: {},
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

