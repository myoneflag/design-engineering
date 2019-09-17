import {GetterTree} from 'vuex';
import {RootState} from '@/store/types';
import CatalogState from '@/store/catalog/types';
import _ from 'lodash';

export const getters: GetterTree<CatalogState, RootState> = {
    loaded(state) {
        return state.loaded;
    },

    default(state) {
        return state.defaultCatalog;
    },

    defaultPipeMaterialChoices(state) {
        const result: Array<[string, string]> = [];
        _.forOwn(state.defaultCatalog.pipes, (val, key) => {
            result.push([key, val.name]);
        });
        return result;
    },

    defaultValveChoices(state) {
        const result: Array<[string, string]> = [];
        _.forOwn(state.defaultCatalog.valves, (val, key) => {
            result.push([key, val.name]);
        });
        return result;
    },
};
