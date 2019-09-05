import { Module } from 'vuex';
import { getters } from './getters';
import { actions } from './actions';
import { mutations } from './mutations';
import { DocumentState, initialValue } from './types';
import { RootState } from '../types';
import * as _ from 'lodash';

export const state: DocumentState = _.cloneDeep(initialValue);

const namespaced: boolean = true;

export const document: Module<DocumentState, RootState> = {
    namespaced,
    state,
    getters,
    actions,
    mutations,
};
