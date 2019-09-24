import { GetterTree } from 'vuex';
import {DocumentState, initialValue} from './types';
import { RootState } from '../types';

export const getters: GetterTree<DocumentState, RootState> = {
    title(state): string {
        return state.drawing.generalInfo.title;
    },

    document(state): DocumentState {
        return state;
    },

    isBrandNew(state): boolean {
        return state.history.length === 0
            && state.optimisticHistory.length === 0
            && state.nextId === initialValue.nextId;
    },
};
