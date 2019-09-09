import {ActionTree} from 'vuex';
import {RootState} from '@/store/types';
import ToolState, {ToolConfig} from '@/store/tools/types';

export const actions: ActionTree<ToolState, RootState> = {
    setCurrentTool({ commit, state }, currentTool: ToolConfig) {
        commit ('setCurrentTool', currentTool);
    },
};
