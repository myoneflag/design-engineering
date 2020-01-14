import { ActionTree } from "vuex";
import { RootState } from "../../../src/store/types";
import CatalogState from "../../../src/store/catalog/types";
import { Catalog } from "../../../../common/src/api/catalog/types";

export const actions: ActionTree<CatalogState, RootState> = {
    setDefault({ commit, state }, payload: Catalog) {
        commit("setDefault", payload);
        commit("setLoaded", true);
    }
};
