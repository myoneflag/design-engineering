import { ActionTree } from "vuex";
import * as OT from "../../../../common/src/api/document/operation-transforms";
import { OPERATION_NAMES } from "../../../../common/src/api/document/operation-transforms";
import { RootState } from "../types";
import { blankDiffFilter, DocumentState, EntityParam, UIState } from "../../../src/store/document/types";
import { diffState } from "../../../../common/src/api/document/state-differ";
import { applyOpOntoStateVue } from "../../../src/store/document/operation-transforms/state-ot-apply";
import * as _ from "lodash";
import { submitOperation, updateDocument } from "../../../src/api/document";
import Vue from "vue";
import { MainEventBus } from "../main-event-bus";
import { assertUnreachable } from "../../../../common/src/api/config";
import { cloneSimple } from "../../../../common/src/lib/utils";
import { DrawingMode } from "../../htmlcanvas/types";
import DirectedValveEntity from "../../../../common/src/api/document/entities/directed-valves/directed-valve-entity";
import { reportError } from "../../../src/api/error-report";

export const actions: ActionTree<DocumentState, RootState> = {
    reCalculate({ commit }, payload) {
        commit("setReCalculate", payload);
    },
    applyRemoteOperation({ commit, state }, op) {
        commit("applyRemoteOperation", op);
    },
    setPreviewMode({ commit }, value) {
        commit("setPreviewMode", value);
    },
    setActiveFlowSystem({ commit }, value) {
        commit("setActiveFlowSystem", value);
    },
    addEntity({ commit, state }, entity) {
        commit("addEntity", entity);
    },

    updateDependenceOn({ commit, state }, entityDependencies: Map<string, DirectedValveEntity | null>) {
        commit("updateDependenceOn", entityDependencies);
    },

    deleteEntity({ commit, state }, entity) {
        commit("deleteEntity", entity);
    },

    addEntityOn({ commit, state }, args: EntityParam) {
        commit("addEntityOn", args);
    },

    deleteEntityOn({ commit, state }, args: EntityParam) {
        commit("deleteEntityOn", args);
    },

    addLevel({ commit, state }, level) {
        commit("addLevel", level);
    },

    deleteLevel({ commit, state }, level) {
        commit("deleteLevel", level);
    },

    setCurrentLevelUid({ commit, state }, levelUid) {
        commit("setCurrentLevelUid", levelUid);
    },

    validateAndCommit({ commit, state }, logUndo: boolean = true) {
        MainEventBus.$emit("validate-and-commit", logUndo);
    },

    // Call this action to commit the current operation transforms. TODO: make that atomic.
    commit({ commit, state }, { skipUndo, diffAll }: { skipUndo?: boolean, diffAll?: boolean } = { skipUndo: false, diffAll: false }) {
        diffAll = true; // we are disabling diffing until it is correct.

        if (state.uiState.drawingMode === DrawingMode.History) {
            return;
        }

        if (state.uiState.viewOnly) {
            commit("revert");
            return;
        }

        
        // We have to clone to stop reactivity affecting the async post values later.
        // We choose to clone the resulting operations rather than the input for performance.
        const diff = cloneSimple(diffState(state.committedDrawing, state.drawing, diffAll ? undefined : state.diffFilter));
        diff.forEach((v: OT.OperationTransformConcrete) => {
            if (v.type !== OPERATION_NAMES.DIFF_OPERATION) {
                throw new Error("diffState gave a weird operation");
            }
            applyOpOntoStateVue(state.committedDrawing, v);
        });


        Vue.set(state, "diffFilter", blankDiffFilter());
        if (diff.length === 0) {
            return;
        }

        if (diff.length) {
            if (!skipUndo) {
                state.undoStack.splice(state.undoIndex);
                state.undoStack.push(cloneSimple(diff));
                state.undoIndex++;
            }
            diff.push({ type: OPERATION_NAMES.COMMITTED_OPERATION, id: -1 });
        }

        state.optimisticHistory.push(...diff);

        const prevHistoryId = state.history.length ? state.history[state.history.length - 1].id : -1;

        submitOperation(state.documentId, commit, diff).catch((e) => {
            setUiStateViewOnly(state.uiState, "An error occured while saving the changes on the server", e);
            this.dispatch("document/revert");
        });

        setTimeout(() => {
            const thisHistoryId = state.history.length ? state.history[state.history.length - 1].id : -1;
            if (thisHistoryId === prevHistoryId) {
                setUiStateViewOnly(state.uiState, "Having trouble saving for the last 10 seconds, please refresh", null);
            }
        }, 10000);

        MainEventBus.$emit("committed", true);
    },

    resetPastes({ commit, state, dispatch }) {
        commit("resetPastes");
    },

    applyDiff({ commit, state, dispatch }, diff) {
        commit("applyDiff", diff);
    },

    applyDiffs({ commit, state, dispatch }, diffs) {
        commit("applyDiffs", diffs);
    },

    undo(args) {
        const { commit, state, dispatch } = args;
        if (state.undoIndex && state.uiState.drawingMode !== DrawingMode.History) {
            state.undoIndex--;
            for (let i = state.undoStack[state.undoIndex].length - 1; i >= 0; i--) {
                const op = state.undoStack[state.undoIndex][i];
                switch (op.type) {
                    case OPERATION_NAMES.DIFF_OPERATION:
                        commit("applyDiff", op.inverse);
                        break;
                    case OPERATION_NAMES.COMMITTED_OPERATION:
                        throw new Error("Don't know how to handle this");
                    default:
                        assertUnreachable(op);
                }
            }
        }

        dispatch("commit", { skipUndo: true });
    },

    redo(args) {
        const { commit, state, dispatch } = args;
        if (state.undoIndex < state.undoStack.length && state.uiState.drawingMode !== DrawingMode.History) {
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < state.undoStack[state.undoIndex].length; i++) {
                const op = state.undoStack[state.undoIndex][i];
                switch (op.type) {
                    case OPERATION_NAMES.DIFF_OPERATION:
                        commit("applyDiff", op.diff);
                        break;
                    case OPERATION_NAMES.COMMITTED_OPERATION:
                        throw new Error("Don't know how to handle this");
                    default:
                        assertUnreachable(op);
                }
            }
            state.undoIndex++;
        }

        dispatch("commit", { skipUndo: true });
    },

    setId({ commit, state }, payload) {
        commit("setId", payload);
    },

    swapDrawing({ commit, state }, newState) {
        commit("swapDrawing", newState);
    },

    revert({ commit, state }, redraw) {
        // We need to wait for entity mutation watchers to fire and update the filter.
        // Reverse all optimistic operations
        commit("revert", redraw);
    },

    revertFull({ commit, state }) {
        commit("revertFull");
    },

    reset({ commit, state }) {
        commit("reset");
    },

    resetDrawing({ commit, state }) {
        commit("resetDrawing");
    },

    loaded({ commit, state }, loaded) {
        commit("loaded", loaded);
    },

    updatePipeEndpoints({ commit, state }, params) {
        commit("updatePipeEndpoints", params);
    },

    setShareToken({ commit }, payload) {
        commit("setShareToken", payload);
    },

    setIsLoading({ commit }, payload) {
        commit("setIsLoading", payload);
    }
};

export function setUiStateViewOnly(uiState: UIState, message: string, error: Error | null) {
    reportError(message, error);
    uiState.viewOnly = true;
    uiState.viewOnlyReason = message;
}
