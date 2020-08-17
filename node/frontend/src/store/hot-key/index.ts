import { Module } from "vuex";
import { RootState } from '../types';
import { getters } from "./getters";
import { actions } from "./actions";
import { mutations } from "./mutations";
import HotKeyState from "./types";

export const state: HotKeyState = {
    setting: {},
    loaded: false   
};

const namespaced: boolean = true;

export const hotKey: Module<HotKeyState, RootState> = {
    namespaced,
    state,
    getters,
    actions,
    mutations
};

