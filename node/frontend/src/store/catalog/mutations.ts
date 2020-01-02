import { MutationTree } from "vuex";
import CatalogState from "../../../src/store/catalog/types";
import { MainEventBus } from "../../../src/store/main-event-bus";

export const mutations: MutationTree<CatalogState> = {
    setDefault(state, payload) {
        state.defaultCatalog = payload;
    },

    setLoaded(state, loaded) {
        state.loaded = loaded;
    }
};
