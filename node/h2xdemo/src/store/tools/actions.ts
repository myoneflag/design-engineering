import {ActionTree} from 'vuex';
import {DocumentState} from '@/store/document/types';
import {RootState} from '@/store/types';
import ProfileState from '@/store/profile/types';
import ToolState, {ToolConfig} from '@/store/tools/types';

export const actions: ActionTree<ToolState, RootState> = {
    setCurrentTool({ commit, state }, currentTool: ToolConfig) {
        commit ('setCurrentTool', currentTool);
    },
};
