import { Module } from "vuex";
import { RootState } from "../../../src/store/types";
import { getters } from "../../../src/store/profile/getters";
import { actions } from "../../../src/store/profile/actions";
import { mutations } from "../../../src/store/profile/mutations";
import ProfileState from "../../../src/store/profile/types";
import { SupportedLocales } from "../../../../common/src/api/locale";

export const state: ProfileState = {
    profile: null,
    viewedVideoIds: [],
    numDrawingsCreated: 0,
    numFeedbackSubmitted: 0,
    locale: null,
};

const namespaced: boolean = true;

export const profile: Module<ProfileState, RootState> = {
    namespaced,
    state,
    getters,
    actions,
    mutations
};
