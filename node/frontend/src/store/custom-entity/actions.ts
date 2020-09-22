import { ActionTree } from "vuex";
import { RootState } from "../types";
import CustomEntityState from './types';

export const actions: ActionTree<CustomEntityState, RootState> = {
    setNodes({ commit }, payload) {
        commit("setNodes", payload);
        commit("setLoaded", true);
    },
    setLoaded({ commit }, payload) {
        commit("setLoaded", payload);
    }
};
