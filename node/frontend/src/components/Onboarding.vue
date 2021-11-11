<template>
    <b-modal 
        id="onboarding" 
        centered
        hide-footer 
        hide-header 
        no-close-on-backdrop
        no-close-on-esc
        v-model="onboarding.show"
        v-if="onboarding.show"
    >
        <template v-if="dialog">
            <div class="d-block">
                <h4>{{ dialog.title }}</h4>
                <p v-html="dialog.text">{{ dialog.text }}</p>
            </div>
            <div class="d-flex mt-3 align-items-center justify-content-end flex-wrap">
                <div id="step-indicator" v-if="onboarding.totalSteps > 1">
                    <span 
                        class="dot"
                        :class="{ active: number === onboarding.currentStep }" 
                        v-for="number in onboarding.totalSteps" 
                        :key="number"
                        @click="() => handleNavigate(number)"
                    ></span>
                </div>
                <b-button 
                    variant="outline-primary"  
                    @click="handleClickOK"
                    style="width: 67px"
                    v-if="onboarding.totalSteps === 1 || onboarding.currentStep === onboarding.totalSteps"
                >
                    {{ onboarding.totalSteps > 1 && 'Finish' || 'OK' }}
                </b-button>
                <b-button 
                    variant="outline-primary"
                    @click="handleClickNext"
                    style="width: 60px"
                    v-else
                >Next</b-button>
                
                <b-form-checkbox 
                    name="checkBoxOnboardingDontShow" 
                    class="ml-2"
                    style="white-space: nowrap;"
                    v-model="preventShow"
                    v-if="onboarding.currentStep === onboarding.totalSteps"
                >Don’t show me this again</b-form-checkbox>
            </div>
        </template>
    </b-modal>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';
import { User } from '../../../common/src/models/User';
import { LoginEventType } from '../../../common/src/models/AccessEvents';
import OnboardingState, { ONBOARDING_SCREEN } from '../store/onboarding/types';
import { OnboardingSteps, ONBOARDING_STEPS } from '../store/onboarding/steps';
import { getDataByUsername } from '../api/access-events';
import { updateOnboarding, UpdateOnboarding } from '../api/onboarding';

@Component({
    props: {
        screen: String
    }
})
export default class Onboarding extends Vue {
    preventShow: boolean = true;
    steps: OnboardingSteps = ONBOARDING_STEPS;

    mounted() {
        this.displayOnboarding();
    }

    beforeDestroy() {
        this.$store.dispatch("onboarding/setOnboarding", {
            screen: "",
            totalSteps: 0,
            currentStep: null,
            show: false,
        } as OnboardingState);
    }

    get profile(): User {
        return this.$store.getters["profile/profile"];
    }

    get onboarding(): OnboardingState {
        return this.$store.getters["onboarding/onboarding"];
    }

    get dialog() {
        const steps = this.steps[this.$props.screen];
        
        return steps.find(step => step.step === this.onboarding.currentStep) || null;
    }

    async isFirstTimeLogin() {
        let result = false;

        await getDataByUsername({
            username: this.profile.username,
            type: LoginEventType.LOGIN,
        }).then(res => {
            if (res.success) {
                result = res.data.length <= 1 && this.profile.eulaAccepted;
            }
        });

        return result;
    }

    handleClickOK() {
        this.$store.dispatch("onboarding/setOnboarding", {
            ...this.onboarding,
            totalSteps: 0,
            currentStep: null,
            show: false,
        } as OnboardingState);

        if ((this.preventShow && this.profile.onboarding)) {
                    
            const onboardingUpdateProps: UpdateOnboarding = {
                id: this.profile.onboarding!.id
            }

            if (this.onboarding.screen === ONBOARDING_SCREEN.HOME) {
                onboardingUpdateProps['home'] = 1;
            } else if (this.onboarding.screen === ONBOARDING_SCREEN.DOCUMENT) {
                onboardingUpdateProps['document'] = 1;
            } else if (this.onboarding.screen === ONBOARDING_SCREEN.DOCUMENT_SETTING) {
                onboardingUpdateProps['document_setting'] = 1;
            }

            updateOnboarding(onboardingUpdateProps).then(res => {
                if (res.success) {
                    this.$store.dispatch("profile/setOnboarding", res.data);
                }
            });
        }

        this.preventShow = true;
    }

    handleClickNext() {
        if (this.onboarding.currentStep) {
            const mode = this.steps[this.onboarding.screen][this.onboarding.currentStep].mode;
            if (mode) {
                this.$emit("update:mode", mode);
            }
        }
        this.$store.dispatch("onboarding/setCurrentStep", ++this.onboarding.currentStep!);
    }

    handleNavigate(step: number) {
        this.$store.dispatch("onboarding/setCurrentStep", step);
    }

    async displayOnboarding() {

        if (!this.profile)
            return;

        const { screen } = this.$props;
       
        if (this.profile.onboarding) {
            if (screen === ONBOARDING_SCREEN.HOME && this.profile.onboarding.home === 0) {
                this.$store.dispatch("onboarding/setOnboarding", {
                    ...this.onboarding, 
                    screen,
                    totalSteps: this.steps[ONBOARDING_SCREEN.HOME].length, 
                    currentStep: 1,
                    show: true,
                } as OnboardingState);
            } else 
            if (screen === ONBOARDING_SCREEN.DOCUMENT && this.profile.onboarding.document === 0) {
                this.$store.dispatch("onboarding/setOnboarding", {
                    ...this.onboarding, 
                    screen,
                    totalSteps: this.steps[ONBOARDING_SCREEN.DOCUMENT].length, 
                    currentStep: 1,
                    show: true,
                } as OnboardingState);
            } else
            if (screen === ONBOARDING_SCREEN.DOCUMENT_SETTING && this.profile.onboarding.document_setting === 0) {
                this.$store.dispatch("onboarding/setOnboarding", {
                    ...this.onboarding, 
                    screen,
                    totalSteps: this.steps[ONBOARDING_SCREEN.DOCUMENT_SETTING].length, 
                    currentStep: 1,
                    show: true,
                } as OnboardingState);
            }
        }
    }

    @Watch('screen')
    onScreenChanged(value: string, oldValue: string) {
        this.displayOnboarding();
    }
}
</script>

<style lang="less">
.onboarding {
    z-index: 9999 !important;
    background-color: #ffffff !important;
    color: #343a40 !important;
    position: relative !important;
}
</style>

<style scoped lang="less">
#step-indicator {
    flex: 1;
    white-space: nowrap;
}
.dot {
    height: 15px;
    width: 15px;
    border: 1px solid #bbbbbb;
    background-color: #ffffff;
    border-radius: 50%;
    display: inline-block;
    vertical-align: middle;
    cursor: pointer;
    margin-right: 4px;
}
.dot.active {
    background-color: #bbbbbb;
}
</style>