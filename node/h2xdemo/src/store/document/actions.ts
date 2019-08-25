import { ActionTree } from 'vuex';
import axios from 'axios';
import * as OT from './operationTransforms';
import { RootState } from '../types';
import { DocumentState } from '@/store/document/types';
import {BackgroundImage} from '@/Drawings/BackgroundImage';
import {PaperSize} from '@/config';


let submitOperation = (commit: any, op: OT.OperationTransform) => {
    axios.post('/api/document/operation', op).then(
        () => console.log("operation " + op + " submitted"),
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

    setTitle({ commit, state}, title): any {
        submitOperation(commit, OT.createsetTitleOperation(-1, state.drawing.title, title));
    },

    open({commit}): any {
        commit('open');
    },
    close({commit}): any {
        commit('close');
    },

    setBackground({ commit, state }, { centerX, centerY, paper, paperScale, scale, uri, crop: {x, y, w, h}}): any {
        const op: OT.SetBackgroundOperation = {

            oldCenterX: state.drawing.background.centerX,
            oldCenterY: state.drawing.background.centerY,
            oldPaper: state.drawing.background.paper,
            oldScale: state.drawing.background.scale,
            oldPaperScale: state.drawing.background.paperScale,
            oldUri: state.drawing.background.uri,
            order: -1,
            oldCrop: Object.assign({}, state.drawing.background.crop),

            centerX,
            centerY,
            paper,
            scale,
            paperScale,
            crop: {
                x,
                y,
                w,
                h,
            },
            type: OT.OPERATION_NAMES.SET_BACKGROUND,
            uri,
        };
        submitOperation(commit, op);
    },

    setPaper({ commit, state }, { name, scale }): any {
        const op: OT.SetPaperOperation = {
            name,
            scale,
            oldName: state.drawing.paper.name,
            oldScale: state.drawing.paper.scale,
            type: OT.OPERATION_NAMES.SET_PAPER,
            order: -1,
        };
        submitOperation(commit, op);
    },

};
