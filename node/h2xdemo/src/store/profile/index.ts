import {Module} from 'vuex';
import {RootState} from '@/store/types';
import {getters} from '@/store/profile/getters';
import {actions} from '@/store/profile/actions';
import {mutations} from '@/store/profile/mutations';
import ProfileState from '@/store/profile/types';

export const state: ProfileState = {
    username: '',
};

const namespaced: boolean = true;

export const profile: Module<ProfileState, RootState> = {
    namespaced,
    state,
    getters,
    actions,
    mutations,
};
