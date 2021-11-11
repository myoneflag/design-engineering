<template>
    <span>
        <div id="email-verification" v-if="profile && !emailVerifiedAt" ref="emailVerification">
            <p>
                <template v-if="emailVerificationSent || (new Date() - +new Date(profile.email_verification_dt)) <= (60 * 60 * 24 * 1000) && profile.email">
                    Email verification link was sent to your registered email. <a href="#" @click="handleClickVerificationEmail">Send email verification link again.</a>
                </template>
                <template v-else>
                    You need to verify your registered email <a href="#" @click="handleClickVerificationEmail">here!</a>
                </template>
                <span v-if="isLoading" class="ml-1"><b-spinner style="width: 1.0rem; height: 1.0rem;"></b-spinner></span>
            </p>
            <b-modal id="confirm-email" hide-footer>
                <template v-slot:modal-title>
                    Confirm your email
                </template>
                <div class="d-block text-center">
                    <b-input 
                        :disabled="form.isLoading" 
                        type="text" 
                        class="mb-3" 
                        v-model="form.confirmEmail" 
                        placeholder="Enter your email..."
                    ></b-input>
                    <b-button 
                        variant="primary" 
                        block 
                        @click="handleUpdateEmail"
                        :disabled="form.isLoading"
                    >
                        Confirm 
                        <b-spinner v-if="form.isLoading" style="width: 1.0rem; height: 1.0rem;"></b-spinner>
                    </b-button>
                </div>
            </b-modal>
        </div>
        <b-navbar type="light">
            <b-navbar-nav>
                <b-navbar-brand href="https://h2xengineering.com" v-b-tooltip.hover="{ title: 'Public Site' }">
                    <img src="@/assets/h2x.png" class="d-inline-block   mr-0 align-top" height="30" />
                </b-navbar-brand>
            </b-navbar-nav>
            <b-navbar-nav>
                <b-nav-item :to="{ name: 'home' }" active-class="active" exact>Projects</b-nav-item>
            </b-navbar-nav>
            <b-progress id="progressBar" :value="progressValue.value" variant="info" animated></b-progress>
            <b-popover target="progressBar" triggers="hover" placement="top">
                <div>
                    <b-form-group :label="progressValue.rank">
                    <b-form-checkbox-group
                        id="checkbox-group-1"
                        v-model="selected"
                        :options="options"
                    ></b-form-checkbox-group>
                    </b-form-group>
                </div>
            </b-popover>
            <b-navbar-nav class="ml-auto">
                <OnBoardingProgressMenuItem :class="{ onboarding: checkOnboardingClass(HomeStep.Expert) }"/>
                <ProfileMenuItem />
            </b-navbar-nav>
        </b-navbar>
    </span>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { sendEmailVerification, confirmEmail } from "../api/users";
import ProfileMenuItem from "../../src/components/ProfileMenuItem.vue";
import OnBoardingProgressMenuItem from "./OnBoardingProgressMenuItem.vue";
import OnboardingState, { ONBOARDING_SCREEN } from "../store/onboarding/types";
import { HomeStep } from '../store/onboarding/steps';

@Component({
    props: {
        profile: Object,
    },
    components: { OnBoardingProgressMenuItem, ProfileMenuItem }
})
export default class MainNavBar extends Vue {
    onBoardingProgress: any | null = null;
    emailVerificationSent: boolean = false;
    isLoading: boolean = false;
    form: {
        confirmEmail: string
        isLoading: boolean
    } = {
        confirmEmail: "",
        isLoading: false,
    }

    get HomeStep() { 
        return HomeStep;
    }

    get onboarding(): OnboardingState {
        return this.$store.getters["onboarding/onboarding"];
    }

    checkOnboardingClass(step: number) {
        return step === this.onboarding.currentStep && this.onboarding.screen === ONBOARDING_SCREEN.HOME;
    }

    get options() {
        if (!this.onBoardingProgress) {
            return [];
        }

        let opts = [];
        for (let vid of this.onBoardingProgress.level.videoRequirements) {
            opts.push({
                text: `Watch ${vid.title}`,
                value: `video ${vid.id}`,
            });
        }
        if (this.onBoardingProgress.level.feedbackSentRequirement) {
            opts.push({
                text: `Give ${this.onBoardingProgress.level.feedbackSentRequirement} pieces of feedback`,
                value: `feedback`,
            });
        }
        if (this.onBoardingProgress.level.projectsStartedRequirement) {
            opts.push({
                text: `Create ${this.onBoardingProgress.level.projectsStartedRequirement} new projects`,
                value: `projects`,
            });
        }
        return opts;
    }

    get selected() {
        if (!this.onBoardingProgress) {
            return [];
        }

        let opts = [];
        for (let vid of this.onBoardingProgress.doneItems.videos) {
            opts.push(`video ${vid.id}`);
        }
        if (this.onBoardingProgress.doneItems.feedbackItems) {
            opts.push('feedback');
        }
        if (this.onBoardingProgress.doneItems.projects) {
            opts.push('projects');
        }
        return opts;
    }

    get progressValue() {
        if (!this.onBoardingProgress) {
            return {
                rank: '',
                encouragement: '',
                value: 0,
            };
        }

        return {
            rank: this.onBoardingProgress.level.name,
            encouragement: 'Keep going!',
            value: 100 * this.onBoardingProgress.progressElapsed / this.onBoardingProgress.progressTotal,
        };
    }

    handleClickVerificationEmail() {
        if (!this.$props.profile.email && !this.form.confirmEmail) {
            this.$bvModal.show('confirm-email');
            return;
        }

        this.isLoading = true;

        sendEmailVerification(this.$props.profile.email || this.form.confirmEmail, this.$props.profile.username).then(res => {
            if (res.success) {
                this.emailVerificationSent = res.success;
                this.$bvToast.toast(res.message || "", {
                    title: "Send email verification success!",
                    variant: "success"
                });
            } else {
                this.$bvToast.toast(res.message, {
                    title: "Send email verification failed!",
                    variant: "danger"
                });
            }
            
            this.isLoading = false;
        });
    }

    get emailVerifiedAt(): boolean {
        return this.$props.profile?.email_verified_at || false;
    }

    handleUpdateEmail() {
        this.form.isLoading = true;

        confirmEmail(this.form.confirmEmail).then(res => {
            if (res.success) {
                this.$store.dispatch("profile/setProfile", res.data);
                this.$bvModal.hide('confirm-email');
                this.handleClickVerificationEmail();
            } else {
                this.$bvToast.toast("Something went wrong. Please try again later.", {
                    title: "Email Confirmation Failed",
                    variant: "danger"
                });
            }

            this.form.isLoading = false;
        });
    }
}
</script>

<style lang="less">
.navbar {
    padding: 10px;
    background-color: #ffffff;
    border-bottom: 1px solid lightgray;
}

#email-verification {
    padding: 4px;
    background: #e3eaf1;

    p {
        margin-bottom: 0px;
    }
}
</style>
