import { Module } from "vuex";
import { RootState } from "../../../src/store/types";
import { getters } from "../../../src/store/tools/getters";
import { actions } from "../../../src/store/tools/actions";
import { mutations } from "../../../src/store/tools/mutations";
import ToolState from "./types";
import { DEFAULT_TOOL } from "../../../src/htmlcanvas/lib/tool";

export const state: ToolState = {
    currentTool: DEFAULT_TOOL
};

const namespaced: boolean = true;

export const tools: Module<ToolState, RootState> = {
    namespaced,
    state,
    getters,
    actions,
    mutations
};
