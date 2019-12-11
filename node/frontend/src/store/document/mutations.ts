import {MutationTree} from 'vuex';
import {DocumentState, initialDocumentState} from './types';
import * as OT from './operation-transforms/operation-transforms';
import {OPERATION_NAMES} from './operation-transforms/operation-transforms';
import {MainEventBus} from '../../../src/store/main-event-bus';
import {applyOtOnState} from '../../../src/store/document/operation-transforms/state-ot-apply';
import * as _ from 'lodash';
import {cloneSimple} from '../../../src/lib/utils';
import {DrawableEntityConcrete} from '../../../src/store/document/entities/concrete-entity';
import {EntityType} from '../../../src/store/document/entities/types';
import stringify from "json-stable-stringify";

export const mutations: MutationTree<DocumentState> = {
    /**
     * Here we apply an operation to the current document.
     * This includes executing the effect of the operation, and
     * @param state
     * @param operation
     */
    applyOperation(state, operation: OT.OperationTransformConcrete) {
        state.history.push(operation);

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
        }


        if (operation.type === OT.OPERATION_NAMES.COMMITTED_OPERATION) {

            while (state.stagedCommits.length) {
                const toApply = state.stagedCommits[0];
                let handled: boolean = true;
                switch (toApply.type) {
                    case OT.OPERATION_NAMES.ADD_OPERATION:
                    case OT.OPERATION_NAMES.DELETE_OPERATION:
                    case OT.OPERATION_NAMES.UPDATE_OPERATION:
                    case OT.OPERATION_NAMES.MOVE_OPERATION: {
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

        MainEventBus.$emit('ot-applied');
    },

    revert(state, redraw) {
        state.drawing = cloneSimple(state.committedDrawing);
        MainEventBus.$emit('ot-applied', redraw);
    },

    reset(state) {
        Object.assign(state, cloneSimple(initialDocumentState));
    },

    loaded(state, loaded) {
        state.uiState.loaded = loaded;
    },

    addEntity(state, entity: DrawableEntityConcrete) {
        if (entity.type === EntityType.BACKGROUND_IMAGE) {
            state.drawing.backgrounds.push(entity);
        } else {
            state.drawing.entities.push(entity);
        }
        MainEventBus.$emit('add-entity', entity);
    },

    setId(state, id: number) {
        state.documentId = id;
    },

    deleteEntity(state, entity: DrawableEntityConcrete) {
        if (entity.type === EntityType.BACKGROUND_IMAGE) {
            const i = state.drawing.backgrounds.findIndex((b) => b.uid === entity.uid);
            if (i === -1) {
                throw new Error('deleted something that doesn\'t exist');
            } else {
                state.drawing.backgrounds.splice(i, 1);
            }
        } else {
            const i = state.drawing.entities.findIndex((e) => e.uid === entity.uid);
            if (i === -1) {
                throw new Error('deleted an entitiy that doesn\'t exist');
            } else {
                state.drawing.entities.splice(i, 1);
            }
        }
        MainEventBus.$emit('delete-entity', entity);
    },
};

