import {MutationTree} from 'vuex';
import ProfileState, {Profile} from '../../../src/store/profile/types';

export const mutations: MutationTree<ProfileState> = {
    setProfile(state, profile: Profile | null) {
        state.profile = profile;
    },
};
