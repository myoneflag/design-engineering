import {ActionTree} from 'vuex';
import {RootState} from '@/store/types';
import ProfileState from '@/store/profile/types';

export const actions: ActionTree<ProfileState, RootState> = {
    setUsername({ commit, state }, username) {
        commit ('setUsername', username);
    },
};
