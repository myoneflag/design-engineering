import { GetterTree } from "vuex";
import { RootState } from "../../../src/store/types";
import CatalogState from "../../../src/store/catalog/types";
import _ from "lodash";
import {Choice, parseCatalogNumberExact} from "../../../../common/src/lib/utils";

export const getters: GetterTree<CatalogState, RootState> = {
    loaded(state) {
        return state.loaded;
    },

    default(state) {
        return state.defaultCatalog;
    },

    defaultPipeMaterialChoices(state) {
        const result: Choice[] = [];
        _.forOwn(state.defaultCatalog.pipes, (val, key) => {
            result.push({ key, name: val.name });
        });
        return result;
    },

    defaultValveChoices(state) {
        const result: Choice[] = [];
        _.forOwn(state.defaultCatalog.valves, (val, key) => {
            result.push({ key, name: val.name });
        });
        return result;
    },

    defaultFluidChoices(state) {
        const result: Choice[] = [];
        _.forOwn(state.defaultCatalog.fluids, (val, key) => {
            result.push({ key, name: `${val.name} (${(parseCatalogNumberExact(val.densityKGM3)! / 1000).toFixed(5) } s.g.)` });
        });
        return result;
    }
};
