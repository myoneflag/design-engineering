import { GetterTree } from 'vuex';
import { DocumentState } from './types';
import { RootState } from '../types';

export const getters: GetterTree<DocumentState, RootState> = {
    title(state): string {
        return state.drawing.title;
    },

    document(state): DocumentState {
        return state;
    },
};
