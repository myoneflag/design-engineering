import { MutationTree } from "vuex";
import HotKeyState from './types';

export const mutations: MutationTree<HotKeyState> = {
    setSetting(state, payload) {
        state.setting = payload;
    },
    setLoaded(state, loaded) {
        state.loaded = loaded;
    }
};
