import { MutationTree } from "vuex";
import ProfileState from "../../../src/store/profile/types";
import { User } from "../../../../common/src/models/User";
import { viewedVideoIds } from "../../api/videos";

export const mutations: MutationTree<ProfileState> = {
    setProfile(state, profile: User | null) {
        state.profile = profile;
    },

    setViewedVideoIds(state, viewedVideoIds: string[]) {
        state.viewedVideoIds.splice(0, state.viewedVideoIds.length, ...viewedVideoIds);
    },

    setNumDrawingsCreated(state, num: number) {
        state.numDrawingsCreated = num;
    },

    setNumFeedbackSubmitted(state, num: number) {
        state.numFeedbackSubmitted = num;
    },

    clearOnBoardingStats(state) {
        state.numDrawingsCreated = 0;
        state.numFeedbackSubmitted = 0;
        state.viewedVideoIds.splice(0, state.viewedVideoIds.length);
    }
};
