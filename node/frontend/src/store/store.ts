// types.ts
import Vue from 'vue';
import Vuex, { StoreOptions } from 'vuex';
import { RootState } from './types';
import { document } from './document/index';
import { profile } from './profile';
import { tools } from '../../src/store/tools';
import { catalog } from '../../src/store/catalog';
import {getters} from '../../src/store/getters';

Vue.use(Vuex);

// export for testing
export const store: StoreOptions<RootState> = {
  state: {
    packageVersion: JSON.parse(unescape(process.env.PACKAGE_JSON || '{"version":"0.0.0"}')).version,
  },
  getters,
  modules: {
    document,
    profile,
    tools,
    catalog,
  },
};

export default new Vuex.Store<RootState>(store);
