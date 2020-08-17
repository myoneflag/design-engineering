import { ActionTree } from "vuex";
import { RootState } from "../types";
import HotKeyState from './types';
import { initialHotKey } from '../../../../common/src/api/initialHotKey';

export const actions: ActionTree<HotKeyState, RootState> = {
    setSetting({ commit }, payload: { [key: string]: string }) {
        let setting: { [key: string]: string } = {};
        Object.entries(initialHotKey).map(([field, prop]) => {
            if (typeof payload[field] === "undefined") {
                setting[field] = prop.default;
            } else {
                setting[field] = payload[field];
            }
        });
        
        commit("setSetting", setting);
        commit("setLoaded", true);
    },
    setLoaded({ commit }, payload: boolean) {
        commit("setLoaded", payload);
    }
};
