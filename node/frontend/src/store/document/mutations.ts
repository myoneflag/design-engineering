import {MutationTree} from 'vuex';
import {DocumentState, initialDocumentState} from './types';
import * as OT from './operation-transforms/operation-transforms';
import {OPERATION_NAMES} from './operation-transforms/operation-transforms';
import {MainEventBus} from '../../../src/store/main-event-bus';
import {applyOtOnState} from '../../../src/store/document/operation-transforms/state-ot-apply';
import {cloneSimple} from '../../../src/lib/utils';
import {DrawableEntityConcrete} from '../../../src/store/document/entities/concrete-entity';
import {EntityType} from '../../../src/store/document/entities/types';
import stringify from "json-stable-stringify";
import Vue from 'vue';
import PipeEntity from "./entities/pipe-entity";

export const mutations: MutationTree<DocumentState> = {
    /**
     * Here we apply an operation to the current document.
     * This includes executing the effect of the operation, and
     * @param state
     * @param operation
     */
    applyOperation(state, operation: OT.OperationTransformConcrete) {
        state.history.push(operation);

        let newData = false;

        if (state.optimisticHistory.length) {
            // optimistic history id typically would be 1. We trust the server to give us correct incrementing ids.
            state.optimisticHistory[0].id = operation.id;

            // Stringify both objects as a cheap[shot] way of dealing with float imprecision before comparing
            if (stringify(state.optimisticHistory[0]) === stringify(operation)) {
                // All g.
                state.optimisticHistory.splice(0, 1);
                state.nextId = Math.max(state.nextId, operation.id) + 1;
                if (operation.type !== OPERATION_NAMES.COMMITTED_OPERATION) {
                    return;
                }
            } else {
                throw new Error('Optimistic operation conflict. TODO: rewind with undo\'s here. New object is: \n' +
                    JSON.stringify(operation) + '\n' +
                    'old object is:\n' +
                    JSON.stringify(state.optimisticHistory[0]),
                );
            }
        } else {
            newData = true;
        }


        if (operation.type === OT.OPERATION_NAMES.COMMITTED_OPERATION) {

            while (state.stagedCommits.length) {
                const toApply = state.stagedCommits[0];
                let handled: boolean = true;
                switch (toApply.type) {
                    case OT.OPERATION_NAMES.DIFF_OPERATION: {
                        applyOtOnState(state.drawing, cloneSimple(toApply));
                        applyOtOnState(state.committedDrawing, cloneSimple(toApply));
                        break;
                    }

                    default:
                        handled = false;
                }

                if (handled) {
                    state.history.push(toApply);
                    state.nextId = Math.max(state.nextId, toApply.id) + 1;
                    state.stagedCommits.splice(0, 1);
                } else {
                    throw new Error('Invalid operation: ' + JSON.stringify(toApply));
                }
            }
        } else {
            state.stagedCommits.push(operation);
        }

        if (newData) {
            MainEventBus.$emit('ot-applied');
        } // else, the data is already represented on screen
    },

    revert(state, redraw) {
        // TODO: emit a reset-level for every changed level. At the moment, we are just resetting current visible
        // level. This is to allow global state to save state.
        state.drawing = cloneSimple(state.committedDrawing);
        MainEventBus.$emit('revert-level', state.uiState.levelUid);
    },

    reset(state) {
        Object.assign(state, cloneSimple(initialDocumentState));
    },

    loaded(state, loaded) {
        state.uiState.loaded = loaded;
    },

    addEntityOn(state, {entity, levelUid}) {
        if (levelUid === null) {
            Vue.set(state.drawing.shared, entity.uid, entity);
        } else {
            Vue.set(state.drawing.levels[levelUid].entities, entity.uid, entity);
        }
        MainEventBus.$emit('add-entity', {entity, levelUid});
    },

    addEntity(state, entity: DrawableEntityConcrete) {
        if (entity.type === EntityType.RISER) {
            Vue.set(state.drawing.shared, entity.uid, entity);
            MainEventBus.$emit('add-entity', {entity, levelUid: null});
        } else {
            Vue.set(state.drawing.levels[state.uiState.levelUid!].entities, entity.uid, entity);
            MainEventBus.$emit('add-entity', {entity, levelUid: state.uiState.levelUid!});
        }
    },

    setId(state, id: number) {
        state.documentId = id;
    },

    deleteEntity(state, entity) {
        if (entity.type === EntityType.RISER) {
            if (entity.uid in state.drawing.shared) {
                Vue.delete(state.drawing.shared, entity.uid);
                MainEventBus.$emit('delete-entity', {entity, levelUid: null});
            } else {
                throw new Error('Deleted an entity that doesn\'t exist ' + JSON.stringify(entity));
            }
        } else if (entity.uid in state.drawing.levels[state.uiState.levelUid!].entities) {
            Vue.delete(state.drawing.levels[state.uiState.levelUid!].entities, entity.uid);
            MainEventBus.$emit('delete-entity', {entity, levelUid: state.uiState.levelUid!});
        } else {
            throw new Error('Deleted an entity that doesn\'t exist ' + JSON.stringify(entity));
        }
    },

    deleteEntityOn(state, {entity, levelUid}) {
        if (levelUid === null) {
            if (entity.type !== EntityType.RISER) {
                throw new Error('Deleting a non shared object from the shared level ' + levelUid + ' ' + JSON.stringify(entity));
            }
            Vue.delete(state.drawing.shared, entity.uid);
        } else if (entity.uid in state.drawing.levels[levelUid].entities) {
            Vue.delete(state.drawing.levels[levelUid].entities, entity.uid);
        } else {
            throw new Error('Deleted an entity that doesn\'t exist ' + JSON.stringify(entity) + ' on level ' + levelUid);
        }
        MainEventBus.$emit('delete-entity', {entity, levelUid});
    },

    addLevel(state, level) {
        Vue.set(state.drawing.levels, level.uid, level);
        MainEventBus.$emit('add-level', level);
    },

    deleteLevel(state, level) {
        if (level.uid in state.drawing.levels) {
            Vue.delete(state.drawing.levels, level.uid);
        } else {
            throw new Error('Deleted a level that doesn\'t exist ' + JSON.stringify(level));
        }
        MainEventBus.$emit('delete-level', level);
        if (level.uid === state.uiState.levelUid) {
            state.uiState.levelUid = null;
            MainEventBus.$emit('current-level-changed');
        }
    },

    setCurrentLevelUid(state, levelUid) {
        state.uiState.levelUid = levelUid;
        MainEventBus.$emit('current-level-changed');
    },

    updatePipeEndpoints(state, {entity, endpoints}: {entity: PipeEntity, endpoints: [string, string]}) {
        (entity.endpointUid as [string, string])[0] = endpoints[0];
        (entity.endpointUid as [string, string])[1] = endpoints[1];
        MainEventBus.$emit('update-pipe-endpoints', {entity, endpoints});
    }
};

