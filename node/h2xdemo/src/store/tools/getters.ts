import {GetterTree} from 'vuex';
import {DocumentState} from '@/store/document/types';
import {RootState} from '@/store/types';
import ProfileState from '@/store/profile/types';
import ToolState from '@/store/tools/types';

export const getters: GetterTree<ToolState, RootState> = {
    getCurrentTool(state) {
        return state.currentTool;
    },
};
