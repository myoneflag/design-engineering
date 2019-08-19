import { MutationTree } from 'vuex';
import { DocumentState } from './types';
import * as OT from './operationTransforms';
import {OTEventBus} from './operationTransforms';

export const mutations: MutationTree<DocumentState> = {
    /**
     * Here we apply an operation to the current document.
     * This includes executing the effect of the operation, and
     * @param state
     * @param operation
     */
    applyOperation(state, operation: OT.OperationTransform) {
        if (operation.order === -1) {
            operation.order = state.lastOrder + 1;
        }
        state.history.push(operation);
        let handled: boolean = true;

        switch (operation.type) {
            case OT.OPERATION_NAMES.TITLE_CHANGE:
                state.drawing.title = (operation as OT.TitleChangeOperation).titleTo;
                break;
            default:
                handled = false;
        }
        if (handled) {
            state.history.push(operation);
            OTEventBus.$emit('ot-applied', operation);
        } else {
        }
    },
    open(state) {
        state.isOpen = true;
    },
    close(state) {
        state.isOpen = false;
    },
};

