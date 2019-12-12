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
};
