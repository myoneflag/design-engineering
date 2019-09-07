import {MutationTree} from 'vuex';
import ProfileState from '@/store/profile/types';

export const mutations: MutationTree<ProfileState> = {
    setUsername(state, username: string) {
        state.username = username;
    },
};
