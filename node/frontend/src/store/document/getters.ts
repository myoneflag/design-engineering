import { GetterTree } from 'vuex';
import {DocumentState, initialDocumentState, Level} from './types';
import { RootState } from '../types';

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
        return state.history.length === 0
            && state.optimisticHistory.length === 0
            && state.nextId === initialDocumentState.nextId;
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
    }

};
