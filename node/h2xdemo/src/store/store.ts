// index.ts
import Vue from 'vue';
import Vuex, { StoreOptions } from 'vuex';
import { RootState } from './types';
import { document } from './document/index';
import { profile } from './profile';
import {tools} from '@/store/tools';

Vue.use(Vuex);

// export for testing
export const store: StoreOptions<RootState> = {
  state: {
    version: '1.0.0.0',
  },
  modules: {
    document,
    profile,
    tools,
  },
};

export default new Vuex.Store<RootState>(store);
