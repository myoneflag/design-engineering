import { ActionTree } from "vuex";
import { RootState } from "../../../src/store/types";
import ProfileState from "../../../src/store/profile/types";
import { recordVideoView, viewedVideoIds } from "../../api/videos";

export const actions: ActionTree<ProfileState, RootState> = {
    async setProfile({ commit, state, dispatch }, username) {
        await commit("setProfile", username);
        return dispatch('refreshViewedVideos');
    },

    async recordVideoView({ commit, state, dispatch }, videoId: string) {
        await commit('pushViewedVideoId', videoId);
        return dispatch('refreshViewedVideos');
    },

    async refreshViewedVideos({ commit, state }) {
        const res = await viewedVideoIds();
        if (res.success) {
            return commit('setViewedVideoIds', res.data);
        } else {
            alert('Could not get viewed video ids: ' + res.message);
        }
    }
};
