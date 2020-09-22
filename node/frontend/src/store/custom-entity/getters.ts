import { GetterTree } from "vuex";
import { RootState } from '../types';
import CustomEntityState from './types';
import { initialNodes } from '../../../../common/src/api/initialNodes';

export const getters: GetterTree<CustomEntityState, RootState> = {
    nodes(state) {
        const nodes = state.nodes;

        for (var i = 0; i < initialNodes.length; i++) {
            if (nodes?.findIndex(node => node.uid === initialNodes[i].uid) === -1) {
                nodes.splice(i, 0, initialNodes[i]);
            }
        }

        if (nodes && nodes.length) {
            return nodes;
        } else {
            return initialNodes;
        }
    },
    loaded(state) {
        return state.loaded;
    },
};
