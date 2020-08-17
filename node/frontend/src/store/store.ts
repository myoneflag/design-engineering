
import Vue from "vue";
import Vuex, { StoreOptions } from "vuex";
import { RootState } from "./types";
import { document } from "./document";
import { profile } from "./profile";
import { tools } from "./tools";
import { catalog } from "./catalog";
import { hotKey } from './hot-key';
import { getters } from "./getters";

Vue.use(Vuex);

// export for testing
export const store: StoreOptions<RootState> = {
    state: {
        packageVersion: JSON.parse(unescape(process.env.PACKAGE_JSON || '{"version":"0.0.0"}')).version
    },
    getters,
    modules: {
        document,
        profile,
        tools,
        catalog,
        hotKey,
    }
};

export default new Vuex.Store<RootState>(store);
