import {ActionTree} from 'vuex';
import {RootState} from '@/store/types';
import CatalogState, {Catalog} from '@/store/catalog/types';

export const actions: ActionTree<CatalogState, RootState> = {
    setDefault({commit, state}, payload: Catalog) {
        commit('setDefault', payload);
        commit('setLoaded', true);
    },
};
