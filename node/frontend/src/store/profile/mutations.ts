import { MutationTree } from "vuex";
import ProfileState from "../../../src/store/profile/types";
import { User } from "../../../../backend/src/entity/User";

export const mutations: MutationTree<ProfileState> = {
    setProfile(state, profile: User | null) {
        state.profile = profile;
    }
};
