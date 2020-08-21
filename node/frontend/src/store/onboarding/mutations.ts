import { MutationTree } from 'vuex';
import OnboardingState from './types';
import { setPropertyByString } from '../../../src/lib/utils';

export const mutations: MutationTree<OnboardingState> = {
    setOnboarding(state, payload: OnboardingState) {
        Object.entries(payload).map(([key, value]) => {
            setPropertyByString(state, key, value);
        });
    },
    setCurrentStep(state, payload: number) {
        state.currentStep = payload;
    }
}
