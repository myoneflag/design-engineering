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
        console.log("Applying operation: " + JSON.stringify(operation));
        if (operation.order === -1) {
            operation.order = state.lastOrder + 1;
        }
        state.history.push(operation);
        let handled: boolean = true;

        switch (operation.type) {

            case OT.OPERATION_NAMES.SET_TITLE: {
                state.drawing.title = (operation as OT.setTitleOperation).titleTo;
                break;
            }
            case OT.OPERATION_NAMES.SET_BACKGROUND: {
                const op: OT.SetBackgroundOperation = (operation as OT.SetBackgroundOperation);
                state.drawing.background.centerX = op.centerX;
                state.drawing.background.centerY = op.centerY;
                state.drawing.background.scale = op.scale;
                state.drawing.background.paperScale = op.paperScale;
                state.drawing.background.paper = op.paper;
                state.drawing.background.uri = op.uri;
                state.drawing.background.crop = op.crop;

                state.drawing.background.crop.x = op.crop.x;
                state.drawing.background.crop.y = op.crop.y;
                state.drawing.background.crop.w = op.crop.w;
                state.drawing.background.crop.h = op.crop.h;
                break;
            }
            case OT.OPERATION_NAMES.SET_PAPER: {
                const op: OT.SetPaperOperation = (operation as OT.SetPaperOperation);
                state.drawing.paper.name = op.name;
                state.drawing.paper.scale = op.scale;
                break;
            }
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

