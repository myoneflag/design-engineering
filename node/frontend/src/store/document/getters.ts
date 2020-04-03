import { GetterTree } from "vuex";
import { DocumentState, initialDocumentState } from "./types";
import { RootState } from "../types";
import { Level } from "../../../../common/src/api/document/drawing";
import { OPERATION_NAMES, OperationTransformConcrete } from "../../../../common/src/api/document/operation-transforms";
import { Operation } from "../../../../common/src/models/Operation";
import { assertUnreachable } from "../../../../common/src/api/config";

export const getters: GetterTree<DocumentState, RootState> = {
    title(state): string {
        return state.drawing.metadata.generalInfo.title;
    },

    document(state): DocumentState {
        return state;
    },

    currentLevel(state): Level | null {
        if (!state.uiState.levelUid) {
            return null;
        }
        return state.drawing.levels[state.uiState.levelUid];
    },

    isBrandNew(state): boolean {
        return (
            state.history.length === 0 &&
            state.optimisticHistory.length === 0 &&
            state.nextId === initialDocumentState.nextId
        );
    },

    sortedLevels(state): Level[] {
        const levels = Object.values(state.drawing.levels) as Level[];
        return levels.sort((a, b) => -(a.floorHeightM - b.floorHeightM));
    },

    uncommittedEntityUids(state): string[] {
        const res: string[] = [];

        if (state.diffFilter.shared) {
            res.push(...Object.keys(state.diffFilter.shared));
        }
        if (state.diffFilter.levels) {
            Object.keys(state.diffFilter.levels).forEach((lvlUid) => {
                if (state.diffFilter.levels[lvlUid] && state.diffFilter.levels[lvlUid].entities) {
                    res.push(...Object.keys(state.diffFilter.levels[lvlUid].entities));
                }
            });
        }
        return res;
    },

    isSyncing(state): boolean {
        return state.optimisticHistory.length > 0;
    },

    discreteHistory(state): Operation[][] {
        const result: Operation[][] = [];
        let build: Operation[] = [];
        for (const op of state.fullHistory) {
            switch (op.operation.type) {
                case OPERATION_NAMES.DIFF_OPERATION:
                    build.push(op);
                    break;
                case OPERATION_NAMES.COMMITTED_OPERATION:
                    if (build.length) {
                        result.push(build);
                        build = [];
                    }
                    break;
                default:
                    assertUnreachable(op.operation);
            }
        }
        return result;
    },

    calculationsUpToDate(state): boolean {
        if (
            state.uiState.lastCalculationId < state.nextId
        ) {
            return false;
        }
        return true;
    }
};
