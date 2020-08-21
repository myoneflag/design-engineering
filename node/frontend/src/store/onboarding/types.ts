export default interface OnboardingState {
    screen: string;
    totalSteps: number;
    currentStep: number | null;
    show: boolean;
}

export enum ONBOARDING_SCREEN {
    HOME = "HOME",
    DOCUMENT = "DOCUMENT",
    DOCUMENT_PLUMBING = "DOCUMENT_PLUMBING",
    DOCUMENT_SETTING = "DOCUMENT_SETTING",
}
