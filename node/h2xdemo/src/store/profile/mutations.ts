import {MutationTree} from 'vuex';
import {DocumentState} from '@/store/document/types';
import * as OT from '@/store/document/operation-transforms/operation-transforms';
import ProfileState from '@/store/profile/types';

export const mutations: MutationTree<ProfileState> = {
    setUsername(state, username: string) {
        state.username = username;
    },
}
