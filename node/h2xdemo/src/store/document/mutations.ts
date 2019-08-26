import { MutationTree } from 'vuex';
import { DocumentState } from './types';
import * as OT from './operationTransforms';
import {OTEventBus} from './operationTransforms';
import deepEqual from 'deep-equal';

export const mutations: MutationTree<DocumentState> = {
    /**
     * Here we apply an operation to the current document.
     * This includes executing the effect of the operation, and
     * @param state
     * @param operation
     */
    applyOperation(state, operation: OT.OperationTransform) {
        console.log("Applying operation: " + JSON.stringify(operation));
        if (operation.id === -1) {
            operation.id = state.nextId;
        } else if (state.history.length && operation.id === state.history[state.history.length - 1].id) {
            if (!deepEqual(operation, state.history[state.history.length - 1])) {
                console.log('Warning: inconsistent operation received: ' + JSON.stringify(operation)
                    + ' vs ' + JSON.stringify(state.history[state.history.length - 1]));
            } else {
                // We can skip this one
                console.log('Info: Received identical operation from server as one that was optimistically applied. Skipping');
                return;
            }
        } else if (operation.id != state.nextId) {
            console.log('Warning: operation is too far in the future: ')
        }

        state.history.push(operation);
        let handled: boolean = true;

        switch (operation.type) {

            case OT.OPERATION_NAMES.SET_TITLE: {
                state.drawing.title = (operation as OT.SetTitleOperation).titleTo;
                break;
            }
            case OT.OPERATION_NAMES.ADD_BACKGROUND: {
                state.drawing.backgrounds.push((operation as OT.AddBackgroundOperation).background);
                break;
            }
            case OT.OPERATION_NAMES.UPDATE_BACKGROUND: {
                const op = operation as OT.UpdateBackgroundOperation;
                state.drawing.backgrounds.splice(op.index, 1, op.background);
                break;
            }
            case OT.OPERATION_NAMES.DELETE_BACKGROUND: {
                const op = operation as OT.DeleteBackgroundOperation;
                state.drawing.backgrounds.splice(op.index, 1);
                break;
            }
            default:
                handled = false;
        }
        if (handled) {
            state.history.push(operation);
            state.nextId = Math.max(state.nextId, operation.id) + 1;
            OTEventBus.$emit('ot-applied', operation);
        } else {
        }
    },
};

