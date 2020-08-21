import { ActionTree } from "vuex";
import { RootState } from "../types";
import OnboardingState from "./types";
import { Onboarding } from '../../../../common/src/models/Onboarding';

export const actions: ActionTree<OnboardingState, RootState> = {
    setOnboarding({ commit, state }, payload: Onboarding | null) {
        commit("setOnboarding", payload);
    },
    setCurrentStep({commit, state}, payload: number) {
        commit("setCurrentStep", payload);
    }
};
