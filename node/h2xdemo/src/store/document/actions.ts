import {ActionTree} from 'vuex';
import * as OT from './operation-transforms/operation-transforms';
import {OPERATION_NAMES} from './operation-transforms/operation-transforms';
import {RootState} from '../types';
import {DocumentState} from '@/store/document/types';
import {diffState} from '@/store/document/operation-transforms/state-differ';
import {applyOtOnState} from '@/store/document/operation-transforms/state-ot-apply';
import * as _ from 'lodash';
import {MainEventBus} from '@/store/main-event-bus';
import {BackgroundEntity} from '@/store/document/entities/background-entity';
import {submitOperation} from '@/api/submit-operation';
import {cloneSimple} from '@/lib/utils';


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
        {background, update}: { background: BackgroundEntity, update: (background: BackgroundEntity) => object},
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
        // We have to clone to stop reactivity affecting the async post values later.
        // We choose to clone the resulting operations rather than the input for performance.
        const diff = cloneSimple(diffState(state.committedDrawing, state.drawing));
        diff.forEach((v: OT.OperationTransform) => applyOtOnState(state.committedDrawing, v));

        if (diff.length === 0) {
            return;
        }

        if (diff.length) {
            diff.push({type: OPERATION_NAMES.COMMITTED_OPERATION, id: -1});
        }

        state.optimisticHistory.push(...diff);

        submitOperation(commit, diff);


        MainEventBus.$emit('ot-applied');
    },

    revert({commit, state}, redraw) {
        // Reverse all optimistic operations
        commit('revert', redraw);
    },

    reset({commit, state}) {
        commit('reset');
    },

    loaded({commit, state}, loaded) {
        commit('loaded', loaded);
    },
};
