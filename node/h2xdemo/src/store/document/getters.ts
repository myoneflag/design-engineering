import { GetterTree } from 'vuex';
import { DocumentState } from './types';
import { RootState } from '../types';

export const getters: GetterTree<DocumentState, RootState> = {
    title(state): string {
        const { title } = state.drawing;
        return title;
    },
};
