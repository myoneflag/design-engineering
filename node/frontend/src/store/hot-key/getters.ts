import { GetterTree } from "vuex";
import { RootState } from '../types';
import HotKeyState from './types';

export const getters: GetterTree<HotKeyState, RootState> = {
    setting(state) {
        return state.setting;
    },
    loaded(state) {
        return state.loaded;
    },
};
