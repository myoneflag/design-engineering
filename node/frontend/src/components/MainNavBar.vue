<template>
    <span>
        <div id="email-verification" v-if="profile && !emailVerifiedAt" ref="emailVerification">
            <p>
                <template v-if="emailVerificationSent || (new Date() - +new Date(profile.email_verification_dt)) <= (60 * 60 * 24 * 1000)">
                    Email verification link was sent to your registered email. <a href="#" @click="handleClickVerificationEmail">Send email verification link again.</a>
                </template>
                <template v-else>
                    You need to verify your registered email <a href="#" @click="handleClickVerificationEmail">here!</a>
                </template>
                <span v-if="isLoading" class="ml-1"><b-spinner style="width: 1.0rem; height: 1.0rem;"></b-spinner></span>
            </p>
        </div>
        <b-navbar type="light">
            <b-navbar-nav>
                <b-navbar-brand href="https://h2xengineering.com" v-b-tooltip.hover="{ title: 'Public Site' }">
                    <img src="@/assets/h2x.png" class="d-inline-block align-top" height="30" />
                </b-navbar-brand>
            </b-navbar-nav>
            <b-navbar-nav>
                <b-nav-item :to="{ name: 'home' }" active-class="active" exact>Your Drawings</b-nav-item>
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
                <OnBoardingProgressMenuItem/>
                <ProfileMenuItem />
            </b-navbar-nav>
        </b-navbar>
    </span>
    
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { APIResult } from "../../../common/src/api/document/types";
import { sendEmailVerification } from "../api/users";
import ProfileMenuItem from "../../src/components/ProfileMenuItem.vue";
import OnBoardingProgressMenuItem from "./OnBoardingProgressMenuItem.vue";

@Component({
    props: {
        profile: {
            type: Object,
            require: false,
        },
    },
    components: { OnBoardingProgressMenuItem, ProfileMenuItem }
})
export default class MainNavBar extends Vue {
    onBoardingProgress: any | null = null;
    emailVerificationSent: boolean = false;
    isLoading: boolean = false;

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
        this.isLoading = true;
        sendEmailVerification(this.$props.profile.email, this.$props.profile.username).then((res: APIResult<string>) => {
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
