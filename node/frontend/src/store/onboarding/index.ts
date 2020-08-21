import { Module } from "vuex";
import { RootState } from "../types";
import { getters } from "./getters";
import { actions } from "./actions";
import { mutations } from "./mutations";
import OnboardingState from "./types";

export const state: OnboardingState = {
    screen: '',
    totalSteps: 0,
    currentStep: null,
    show: false,
};

const namespaced: boolean = true;

export const onboarding: Module<OnboardingState, RootState> = {
    namespaced,
    state,
    getters,
    actions,
    mutations
};
