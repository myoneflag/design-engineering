import { ActionTree } from 'vuex';
import axios from 'axios';
import * as OT from './operation-transforms';
import { RootState } from '../types';
import {Background, DocumentState} from '@/store/document/types';
import {PaperSize} from '@/config';


let submitOperation = (commit: any, op: OT.OperationTransform) => {
    console.log("Submitting operation " + JSON.stringify(op));
    axios.post('/api/document/operation', op).then(
        () => console.log("operation " + JSON.stringify(op) + " submitted"),
    );

    // Take line off to disable optimistic operations.
   // commit('applyOperation', op);
};

// TODO: These actions are supposed to send REST requests to the server to commit them.
// The only thing we are doing right now is optimistically applying actions.
// When we get a confirmation back from the server, we are good.
// If we get a conflict instead, we must rewind the operation stack and re-apply the
// operations as told by the server. If our request got through, we should get our
// operation as a result afterwards because the server would have done conflict resoulution.
export const actions: ActionTree<DocumentState, RootState> = {
    applyRemoteOperation({commit, state}, op) {
        commit('applyOperation', op);
    },

    setTitle({ commit, state}, title: string): any {
        const op: OT.SetTitleOperation = {
            id: -1, titleFrom: state.drawing.title, titleTo: title, type: OT.OPERATION_NAMES.SET_TITLE,
        };
        submitOperation(commit, op);
    },

    addBackground({commit, state}, {background} ): any {
        const op: OT.AddBackgroundOperation = {
            background,
            id: -1,
            type: OT.OPERATION_NAMES.ADD_BACKGROUND,
        };
        submitOperation(commit, op);
    },

    updateBackground({commit, state}, {background, index}): any {
        const newbg = Object.assign({}, background);

        // We know we added selectId manually so we want to delete it before sending it over.
        // TODO: there has to be a better way - just copy the object with fields from the interface.
        // How to do that????
        delete newbg.selectId;
        const oldbg = Object.assign({}, state.drawing.backgrounds[index]);
        delete oldbg.selectId;
        const op: OT.UpdateBackgroundOperation = {
            oldBackground: oldbg,
            background: newbg,
            id: -1,
            type: OT.OPERATION_NAMES.UPDATE_BACKGROUND,
            index,
        };
        submitOperation(commit, op);
    },

    deleteBackground({commit, state}, background): any {
        console.log("Delete background dispatched: " + JSON.stringify(background));
        const selectId = background.selectId;
        for (let i = 0; i < state.drawing.backgrounds.length; i++) {
            const thisbg = state.drawing.backgrounds[i];
            if (thisbg.selectId === selectId) {

                const op: OT.DeleteBackgroundOperation = {
                    deleted: thisbg, id: -1, index: i, type: OT.OPERATION_NAMES.DELETE_BACKGROUND,
                };

                submitOperation(commit, op);
                return;
            }
        }
        console.log('Warning: deleteBackground called but no item to delete');
    },

    updateBackgroundInPlace({commit, state}, {background, update}: { background: Background, update: (background: Background) => object}) {
        const selectId = background.selectId;
        for (let i = 0; i < state.drawing.backgrounds.length; i++) {
            const thisbg = state.drawing.backgrounds[i];
            if (thisbg.selectId === selectId) {

                const op: OT.UpdateBackgroundOperation = {
                    background: Object.assign({}, background, update(background)),
                    id: -1,
                    index: i,
                    oldBackground: background,
                    type: OT.OPERATION_NAMES.UPDATE_BACKGROUND,
                };

                submitOperation(commit, op);
                return;
            }
        }
    },

    scaleBackground({commit, state}, {background, factor}) {
        const selectId = background.selectId;
        for (let i = 0; i < state.drawing.backgrounds.length; i++) {
            const thisbg = state.drawing.backgrounds[i];
            if (thisbg.selectId === selectId) {

                let newBackground: Background = Object.assign({}, background, {
                    scaleFactor: background.scaleFactor * factor,
                });

                const op: OT.UpdateBackgroundOperation = {
                    background: newBackground,
                    id: -1,
                    index: i,
                    oldBackground: background,
                    type: OT.OPERATION_NAMES.UPDATE_BACKGROUND,
                };

                submitOperation(commit, op);
                return;
            }
        }
    },
};
