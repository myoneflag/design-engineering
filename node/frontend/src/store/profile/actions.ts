import {ActionTree} from 'vuex';
import {RootState} from '../../../src/store/types';
import ProfileState from '../../../src/store/profile/types';

export const actions: ActionTree<ProfileState, RootState> = {
    setProfile({ commit, state }, username) {
        commit ('setProfile', username);
    },
};
