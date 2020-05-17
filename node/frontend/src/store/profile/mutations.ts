import { MutationTree } from "vuex";
import ProfileState from "../../../src/store/profile/types";
import { User } from "../../../../common/src/models/User";
import { viewedVideoIds } from "../../api/videos";

export const mutations: MutationTree<ProfileState> = {
    setProfile(state, profile: User | null) {
        state.profile = profile;
    },

    pushViewedVideoId(state, videoId: string) {
        if (!state.viewedVideoIds.includes(videoId)) {
            state.viewedVideoIds.push(videoId);
        }
    },

    setViewedVideoIds(state, viewedVideoIds: string[]) {
        state.viewedVideoIds.splice(0, state.viewedVideoIds.length, ...viewedVideoIds);
    }
};
