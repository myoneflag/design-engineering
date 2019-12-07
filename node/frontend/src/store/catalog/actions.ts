import {ActionTree} from 'vuex';
import {RootState} from '../../../src/store/types';
import CatalogState, {Catalog} from '../../../src/store/catalog/types';

export const actions: ActionTree<CatalogState, RootState> = {
    setDefault({commit, state}, payload: Catalog) {
        commit('setDefault', payload);
        commit('setLoaded', true);
    },
};
