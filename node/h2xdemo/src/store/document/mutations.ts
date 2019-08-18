import { MutationTree } from 'vuex';
import { DocumentState } from './types';
import * as OT from './operationTransforms';

export const mutations: MutationTree<DocumentState> = {
    /**
     * Here we apply an operation to the current document.
     * This includes executing the effect of the operation, and
     * @param state
     * @param operation
     */
    applyOperation(state, operation: OT.OperationTransform) {
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
        } else {
            // TODO: log it
        }
    },
    open(state) {
        state.isOpen = true;
    },
    close(state) {
        state.isOpen = false;
    },
};

