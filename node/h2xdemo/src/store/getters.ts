import {ActionTree, GetterTree} from 'vuex';
import {RootState} from '@/store/types';
import * as _ from 'lodash';

export const getters: GetterTree<RootState, RootState> = {
    appVersion(state) {
        return state.packageVersion;
    },

    effectiveCatalog(state: any) {
        const defaultCatalog = state.catalog.defaultCatalog;
        return defaultCatalog;
    },
};
