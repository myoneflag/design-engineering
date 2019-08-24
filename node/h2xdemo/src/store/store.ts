// index.ts
import Vue from 'vue';
import Vuex, { StoreOptions } from 'vuex';
import { RootState } from './types';
import { document } from './document/index';
import { profile } from './profile';

Vue.use(Vuex);

const store: StoreOptions<RootState> = {
  state: {
    version: '1.0.0.0',
  },
  modules: {
    document,
    profile,
  },
};

export default new Vuex.Store<RootState>(store);
