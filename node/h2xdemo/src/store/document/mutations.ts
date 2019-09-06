import { MutationTree } from 'vuex';
import {Background, DocumentState, initialValue} from './types';
import * as OT from './operation-transforms/operation-transforms';
import deepEqual from 'deep-equal';
import uuidv4 from 'uuid/v4';
import {MainEventBus} from '@/store/main-event-bus';
import {applyOtOnState} from '@/store/document/operation-transforms/state-ot-apply';
import * as _ from 'lodash';

export const mutations: MutationTree<DocumentState> = {
    /**
     * Here we apply an operation to the current document.
     * This includes executing the effect of the operation, and
     * @param state
     * @param operation
     */
    applyOperation(state, operation: OT.OperationTransform) {
        state.history.push(operation);

        console.log("Applying operation: " + JSON.stringify(operation));
        if (state.optimisticHistory.length) {
            // optimistic history id typically would be 1. We trust the server to give us correct incrementing ids.
            state.optimisticHistory[0].id = operation.id;
            if (_.isEqual(state.optimisticHistory[0], operation)) {
                // All g.
                state.optimisticHistory.splice(0, 1);
                console.log('Optimistic operation confirmed. Now there\'s ' + JSON.stringify(state.optimisticHistory));
                MainEventBus.$emit('ot-applied', operation);
                return;
            } else {
                throw new Error('Optimistic operation conflict. TODO: rewind with undo\'s here. New object is: \n' + JSON.stringify(operation) + '\nold object is:\n' + JSON.stringify(state.optimisticHistory[0]));
            }
        }

        console.log('New operation from server, applying.');

        let handled: boolean = true;

        switch (operation.type) {
            case OT.OPERATION_NAMES.ADD_OPERATION:
            case OT.OPERATION_NAMES.DELETE_OPERATION:
            case OT.OPERATION_NAMES.UPDATE_OPERATION:
            case OT.OPERATION_NAMES.MOVE_OPERATION: {
                applyOtOnState(state.drawing, _.cloneDeep(operation));
                applyOtOnState(state.committedDrawing, _.cloneDeep(operation));
                break;
            }
            default:
                handled = false;
        }

        if (handled) {
            state.history.push(operation);
            state.nextId = Math.max(state.nextId, operation.id) + 1;
            MainEventBus.$emit('ot-applied', operation);
        } else {
            throw new Error('Invalid operation: ' + JSON.stringify(operation));
        }
    },

    setTitle(state, title) {
        state.drawing.generalInfo.title = title;
        MainEventBus.$emit('ot-applied');
    },

    addBackground(state, {background} ): any {
        state.drawing.backgrounds.push(background);
        MainEventBus.$emit('ot-applied');
    },

    updateBackground(state, {background, index}): any {
        state.drawing.backgrounds[index] = background;
        MainEventBus.$emit('ot-applied');
    },

    deleteBackground(state, background): any {
        const index = state.drawing.backgrounds.findIndex((b) => b.uid === background.uid);
        state.drawing.backgrounds.splice(index, 1);
        MainEventBus.$emit('ot-applied');
    },

    updateBackgroundInPlace(state, {background, update}) {
        const index = state.drawing.backgrounds.findIndex((b) => b.uid === background.uid);
        Object.assign(state.drawing.backgrounds[index], update);
        MainEventBus.$emit('ot-applied');
    },

    scaleBackground(state, {background, factor}) {
        const index = state.drawing.backgrounds.findIndex((b) => b.uid === background.uid);
        state.drawing.backgrounds[index].scaleFactor *= factor;
        MainEventBus.$emit('ot-applied');
    },

    reset(state) {
        Object.assign(state, _.cloneDeep(initialValue));
    },
};

