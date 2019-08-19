import { ActionTree } from 'vuex';
import axios from 'axios';
import * as OT from './operationTransforms';
import { RootState } from '../types';
import { DocumentState } from '@/store/document/types';

export const actions: ActionTree<DocumentState, RootState> = {
    titleChange({ commit, state}, title): any {
        console.log('Changing state to ' + title + ' via action');
        commit('applyOperation', OT.createTitleChangeOperation(-1, state.drawing.title, title));
    },
    open({commit}): any {
        commit('open');
    },
    close({commit}): any {
        commit('close');
    },
};
