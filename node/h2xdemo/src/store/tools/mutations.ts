import {MutationTree} from 'vuex';
import ToolState, {ToolConfig} from '@/store/tools/types';
import {MainEventBus} from '@/store/main-event-bus';

export const mutations: MutationTree<ToolState> = {
    setCurrentTool(state, toolConfig: ToolConfig) {
        state.currentTool = toolConfig;
        MainEventBus.$emit('tool-change', toolConfig);
    },
}
