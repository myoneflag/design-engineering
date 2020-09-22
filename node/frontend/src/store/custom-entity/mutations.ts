import { MutationTree } from "vuex";
import CustomEntityState from './types';

export const mutations: MutationTree<CustomEntityState> = {
    setNodes(state, payload) {
        state.nodes = payload;
    },
    setLoaded(state, loaded) {
        state.loaded = loaded;
    }
};
