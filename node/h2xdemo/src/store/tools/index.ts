import {Module} from 'vuex';
import {RootState} from '@/store/types';
import {getters} from '@/store/tools/getters';
import {actions} from '@/store/tools/actions';
import {mutations} from '@/store/tools/mutations';
import ToolState from './types';
import {DEFAULT_TOOL} from '@/htmlcanvas/tools/tool';

export const state: ToolState = {
    currentTool: DEFAULT_TOOL,
};

const namespaced: boolean = true;

export const tools: Module<ToolState, RootState> = {
    namespaced,
    state,
    getters,
    actions,
    mutations,
};
