import { ActionTree } from 'vuex';
import axios from 'axios';
import * as OT from './operation-transforms/operation-transforms';
import { RootState } from '../types';
import {Background, DocumentState} from '@/store/document/types';
import {diffState} from '@/store/document/operation-transforms/state-differ';
import {applyOtOnState} from '@/store/document/operation-transforms/state-ot-apply';


function submitOperation(commit: any, op: OT.OperationTransform) {
    return axios.post('/api/document/operation', op);
}

export const actions: ActionTree<DocumentState, RootState> = {
    applyRemoteOperation({commit, state}, op) {
        commit('applyOperation', op);
    },

    setTitle({ commit, state}, title: string): any {
        commit('setTitle', title);
    },

    addBackground({commit, state}, {background} ): any {
        commit('addBackground', {background});
    },

    updateBackground({commit, state}, {background, index}): any {
        commit('updateBackground', {background, index});
    },

    deleteBackground({commit, state}, background): any {
        const index = state.drawing.backgrounds.findIndex((b) => b.uid === background.uid);
        if (index === -1) {
            throw new Error('tried to delete background ' + JSON.stringify(background) + ' but it doesn\'t exist');
        }
        commit('deleteBackground', background);
    },

    updateBackgroundInPlace(
        {commit, state},
        {background, update}: { background: Background, update: (background: Background) => object},
    ) {
        const index = state.drawing.backgrounds.findIndex((b) => b.uid === background.uid);
        if (index === -1) {
            throw new Error('tried to update background ' + JSON.stringify(background) + ' but it doesn\'t exist');
        }
        commit('updateBackgroundInPlace', {background, update: update(state.drawing.backgrounds[index])});
    },

    scaleBackground({commit, state}, {background, factor}) {
        const index = state.drawing.backgrounds.findIndex((b) => b.uid === background.uid);
        if (index === -1) {
            throw new Error('tried to scale background ' + JSON.stringify(background) + ' but it doesn\'t exist');
        }
        commit('scaleBackground', {background, factor});
    },

    // Call this action to commit the current operation transforms. TODO: make that atomic.
    commit({commit, state}) {
        const diff = diffState(state.committedDrawing, state.drawing);
        diff.forEach((v: OT.OperationTransform) => applyOtOnState(state.committedDrawing, v));
        state.optimisticHistory.push(...diff);
        const wait = (index: number) => {
            if (index === diff.length) { return; }
            submitOperation(commit, diff[index]).then(
                () => wait(index + 1),
            );
        };
        wait(0);
    },

    reset({commit, state}) {
        commit('reset');
    },
};
