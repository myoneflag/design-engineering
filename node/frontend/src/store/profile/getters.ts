import { GetterTree } from "vuex";
import { RootState } from "../../../src/store/types";
import ProfileState from "../../../src/store/profile/types";
import { getBrowserLocale, toSupportedLocale } from "../../../../common/src/api/locale";

export const getters: GetterTree<ProfileState, RootState> = {
    profile(state) {
        return state.profile;
    },

    viewedVideoIds(state) {
        return state.viewedVideoIds;
    },

    numDrawingsCreated(state) {
        return state.numDrawingsCreated;
    },

    numFeedbackSubmitted(state) {
        return state.numFeedbackSubmitted;
    },

    locale(state) {
        if (state.locale) {
            return state.locale;
        }
        if (localStorage.getItem('locale')) {
            return localStorage.getItem('locale');
        } else {
            return toSupportedLocale(getBrowserLocale());
        }
    }
};
