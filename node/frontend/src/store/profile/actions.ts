import { ActionTree } from "vuex";
import { RootState } from "../../../src/store/types";
import ProfileState from "../../../src/store/profile/types";
import { recordVideoView, viewedVideoIds } from "../../api/videos";
import { onBoardingStats } from "../../api/logins";
import { Onboarding } from '../../../../common/src/models/Onboarding';
import { SupportedLocales } from "../../../../common/src/api/locale";

export const actions: ActionTree<ProfileState, RootState> = {
    async setProfile({ commit, state, dispatch }, profile) {
        await commit("setProfile", profile);
        if (profile) {
            return dispatch('refreshOnBoardingStats');
        } else {
            return commit('clearOnBoardingStats');
        }
    },

    async refreshOnBoardingStats({ commit, state }) {
        const res = await onBoardingStats();
        if (res.success) {
            await commit('setViewedVideoIds', res.data.viewedVideoIds);
            await commit('setNumDrawingsCreated', res.data.numDrawingsCreated);
            await commit('setNumFeedbackSubmitted', res.data.numFeedbackSubmitted);
        } else {
            alert('Could not get viewed video ids: ' + res.message);
        }
    },

    setOnboarding({commit, state}, payload: Onboarding) {
        commit("setOnboarding", payload);
    },

    setLocale({commit, state}, payload: SupportedLocales) {
        commit('setLocale', payload)
    }
};
