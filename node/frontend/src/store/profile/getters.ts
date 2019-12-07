import {GetterTree} from 'vuex';
import {RootState} from '../../../src/store/types';
import ProfileState from '../../../src/store/profile/types';

export const getters: GetterTree<ProfileState, RootState> = {
    profile(state) {
        return state.profile;
    },
};
