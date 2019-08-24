import {GetterTree} from 'vuex';
import {DocumentState} from '@/store/document/types';
import {RootState} from '@/store/types';
import ProfileState from '@/store/profile/types';

export const getters: GetterTree<ProfileState, RootState> = {
    username(state) {
        return state.username;
    },
};
