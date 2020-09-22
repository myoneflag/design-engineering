import { Module } from "vuex";
import { RootState } from '../types';
import { getters } from "./getters";
import { actions } from "./actions";
import { mutations } from "./mutations";
import CustomEntityState from "./types";

export const state: CustomEntityState = {
    nodes: null,
    loaded: false,
};

const namespaced: boolean = true;

export const customEntity: Module<CustomEntityState, RootState> = {
    namespaced,
    state,
    getters,
    actions,
    mutations
};
