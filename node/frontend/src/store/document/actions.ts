import {ActionTree} from 'vuex';
import * as OT from './operation-transforms/operation-transforms';
import {OPERATION_NAMES} from './operation-transforms/operation-transforms';
import {RootState} from '../types';
import {DocumentState, EntityParam} from '../../../src/store/document/types';
import {diffState} from '../../../src/store/document/operation-transforms/state-differ';
import {applyOtOnState} from '../../../src/store/document/operation-transforms/state-ot-apply';
import * as _ from 'lodash';
import {cloneSimple} from '../../../src/lib/utils';
import {submitOperation, updateDocument} from "../../../src/api/document";


export const actions: ActionTree<DocumentState, RootState> = {
    applyRemoteOperation({commit, state}, op) {
        commit('applyOperation', op);
    },

    addEntity({commit, state}, entity) {
        commit('addEntity', entity);
    },

    deleteEntity({commit, state}, entity) {
        commit('deleteEntity', entity);
    },

    addEntityOn({commit, state}, args: EntityParam) {
        commit('addEntityOn', args);
    },

    deleteEntityOn({commit, state}, args: EntityParam) {
        commit('deleteEntityOn', args);
    },

    addLevel({commit, state}, level) {
        commit('addLevel', level);
    },

    deleteLevel({commit, state}, level) {
        commit('deleteLevel', level);
    },

    setCurrentLevelUid({commit, state}, levelUid) {
        commit('setCurrentLevelUid', levelUid);
    },

    // Call this action to commit the current operation transforms. TODO: make that atomic.
    commit({commit, state}) {

        if (!_.isEqual(state.drawing.metadata.generalInfo, state.committedDrawing.metadata.generalInfo)) {
            updateDocument(state.documentId, undefined, state.drawing.metadata.generalInfo);
        }


        // We have to clone to stop reactivity affecting the async post values later.
        // We choose to clone the resulting operations rather than the input for performance.
        const diff = cloneSimple(diffState(state.committedDrawing, state.drawing, undefined));
        diff.forEach((v: OT.OperationTransformConcrete) => {
                if (v.type !== OPERATION_NAMES.DIFF_OPERATION) {
                    throw new Error('diffState gave a weird operation');
                }
                applyOtOnState(state.committedDrawing, v);
        });

        if (diff.length === 0) {
            return;
        }

        if (diff.length) {
            diff.push({type: OPERATION_NAMES.COMMITTED_OPERATION, id: -1});
        }

        state.optimisticHistory.push(...diff);

        submitOperation(state.documentId, commit, diff); /*.catch((e) => {
            window.alert('There is a connection issue with the server. Please refresh. \n' +
             e.message + "\n" + e.trace);
        });*/
    },

    setId({commit, state}, payload) {
        commit('setId', payload);
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
