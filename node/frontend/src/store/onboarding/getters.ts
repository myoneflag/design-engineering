import { GetterTree } from 'vuex';
import { RootState } from '../types';
import OnboardingState from './types';

export const getters: GetterTree<OnboardingState, RootState> = {
    onboarding(state): OnboardingState {
        return state;
    }
}