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
import { getDataByUsername } from '../api/access-events';
import { updateOnboarding, UpdateOnboarding } from '../api/onboarding';
import { getDocuments } from '../api/document';

@Component({
    props: {
        screen: String
    }
})
export default class Onboarding extends Vue {
    preventShow: boolean = true;
    steps: {[key: string]: Array<{step: number, title: string, text?: string}>} = {
        [ONBOARDING_SCREEN.HOME]: [
            {   
                step: 1,
                title: 'Become an expert',
                text: 'By watching our bite size videos, it takes less than 10 minutes to get familiar with how H2X works',
            }
        ],
        [ONBOARDING_SCREEN.DOCUMENT]: [
            {
                step: 1,
                title: 'Let’s take a quick tour',
            },
            {
                step: 2,
                title: 'Floor plan workspace',
                text: 'This is where you import and modify PDF backgrounds',
            },
            {
                step: 3,
                title: 'Plumbing workspace',
                text: 'This is where you design your system',
            },
            {
                step: 4,
                title: 'Results workspace',
                text: 'This is where you view results',
            },
            {
                step: 5,
                title: 'Export workspace',
                text: 'This is where you can share and export results',
            },
            {
                step: 6,
                title: 'Manage levels',
                text: 'This is where you add and modify new levels',
            },
            {
                step: 7,
                title: 'Change the settings',
                text: 'Add project information and change design parameters here',
            },
            {
                step: 8,
                title: 'Should we do our first project together?',
                text: `Follow this <a href="https://www.youtube.com/playlist?list=PLIdFxhDHcGgwHcBSDr5L_9K3FKGlyzO1S" target="_blank">Youtube video</a> and <a href="https://drive.google.com/drive/folders/1DQc6Fs7Q1N_YwdhoGaYmkkVVEXxSj0ZK?usp=sharing" target="_blank">download these files</a>`,
            },
        ],
        [ONBOARDING_SCREEN.DOCUMENT_PLUMBING]: [
            {
                step: 1,
                title: 'Hot water?',
                text: 'Choose your service here'
            },
            {
                step: 2,
                title: 'Start with the flow source',
                text: 'This is the water main connection or equivalent',
            },
            {
                step: 3,
                title: 'Riser',
                text: 'Use this to draw a pipe that can be seen on other floor levels',
            },
            {
                step: 4,
                title: 'Reticulation pipe',
                text: 'Use this pipe to reticulate through the building',
            },
            {
                step: 5,
                title: 'Connection pipe',
                text: 'This is used for making the connection to the fixture, also known as first fix or roughin',
            },
            {
                step: 6,
                title: 'Backflow and mixing valves',
                text: 'These valves are used to serve fixtures or groups of fixtures',
            },
            {
                step: 7,
                title: 'Add plant to your system',
                text: 'Whether it is hot water plant, booster pumps, storage tanks or something custom, you can add it here',
            },
            {
                step: 8,
                title: 'Stamp fixtures',
                text: 'Select fixtures from the drop down and locate them where required',
            },
            {
                step: 9,
                title: 'Add valves',
                text: 'Valves will increase the pressure loss in your system, select the required ones from the drop down menu and stamp on the pipes',
            },
            {
                step: 10,
                title: 'Add a node',
                text: 'This is a quick way to increase the load on pipes instead of stamping fixtures',
            },
        ],
        [ONBOARDING_SCREEN.DOCUMENT_SETTING]: [
            {
                step: 1,
                title: 'General',
                text: 'This is where you add project specific information'
            },
            {
                step: 2,
                title: 'Units',
                text: 'You can change between metric and imperials units here',
            },
            {
                step: 3,
                title: 'Catalog',
                text: 'Check out the properties of each component',
            },
            {
                step: 4,
                title: 'Fixtures',
                text: 'This is where you choose what fixtures to use on your project',
            },
            {
                step: 5,
                title: 'Flow systems',
                text: 'Here, you can add a new flow system or change the parameters of the existing ones',
            },
            {
                step: 6,
                title: 'Calculations',
                text: 'Change calculations such as the peak flow rate method here',
            },
            {
                step: 7,
                title: 'Document',
                text: 'Delete or reset the document here',
            },
        ],
    }

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

    async isFirstTimeDocument() {
        let result = false;

        await getDocuments().then((res) => {
            if (res.success) {
                const mine = res.data.filter((r) => r.createdBy.username === this.profile.username);
                result = mine.length === 1 || mine.length === 2;
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
                onboardingUpdateProps['home'] = true;
            } else if (this.onboarding.screen === ONBOARDING_SCREEN.DOCUMENT) {
                onboardingUpdateProps['document'] = true;
            } else if (this.onboarding.screen === ONBOARDING_SCREEN.DOCUMENT_PLUMBING) {
                onboardingUpdateProps['document_plumbing'] = true;
            } else if (this.onboarding.screen === ONBOARDING_SCREEN.DOCUMENT_SETTING) {
                onboardingUpdateProps['document_setting'] = true;
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
        this.$store.dispatch("onboarding/setCurrentStep", ++this.onboarding.currentStep!);
    }

    handleNavigate(step: number) {
        this.$store.dispatch("onboarding/setCurrentStep", step);
    }

    async displayOnboarding() {

        if (!this.profile)
            return;

        const { screen } = this.$props;
       
        if (screen === ONBOARDING_SCREEN.HOME && this.profile.onboarding && this.profile.onboarding.home === 0) {
            this.$store.dispatch("onboarding/setOnboarding", {
                ...this.onboarding, 
                screen,
                totalSteps: 1, 
                currentStep: 1,
                show: true,
            } as OnboardingState);
        }

        if (await this.isFirstTimeDocument()) {
            if (screen === ONBOARDING_SCREEN.DOCUMENT && this.profile.onboarding && this.profile.onboarding.document === 0) {
                this.$store.dispatch("onboarding/setOnboarding", {
                    ...this.onboarding, 
                    screen,
                    totalSteps: 8, 
                    currentStep: 1,
                    show: true,
                } as OnboardingState);
            }

            if (screen === ONBOARDING_SCREEN.DOCUMENT_PLUMBING && this.profile.onboarding && this.profile.onboarding.document_plumbing === 0) {
                this.$store.dispatch("onboarding/setOnboarding", {
                    ...this.onboarding, 
                    screen,
                    totalSteps: 10, 
                    currentStep: 1,
                    show: true,
                } as OnboardingState);
            }

            if (screen === ONBOARDING_SCREEN.DOCUMENT_SETTING && this.profile.onboarding && this.profile.onboarding.document_setting === 0) {
                this.$store.dispatch("onboarding/setOnboarding", {
                    ...this.onboarding, 
                    screen,
                    totalSteps: 7, 
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