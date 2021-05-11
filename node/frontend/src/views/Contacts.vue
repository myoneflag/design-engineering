<template>
    <div>
        <MainNavBar></MainNavBar>
        <div class="home" style="overflow-y: auto; overflow-x: hidden; height: calc(100vh - 70px)">
            <b-container>
                <b-row>
                    <b-col>
                        <h1 class="title">
                            Feedback Messages
                        </h1>
                    </b-col>
                </b-row>
                <b-row>
                    <b-col>
                        <b-button
                            variant="warning"
                            v-if="profile.email == null"
                            :to="'/users/username/' + profile.username"
                            >Set your email to subscribe</b-button
                        >
                        <b-button variant="info" v-else-if="!profile.subscribed" @click="subscribe">Subscribe</b-button>
                        <b-button variant="danger" v-else @click="unsubscribe">Unsubscribe</b-button>
                    </b-col>
                </b-row>
                <b-row>
                    <b-col>
                        <b-alert variant="success" v-if="feedbacks.length === 0 && isLoaded" show
                            >There are no feedbacks right now</b-alert
                        >
                    </b-col>
                </b-row>
                <b-row v-for="feedback in feedbacks" :key="feedback.id">
                    <b-col>
                        <b-card>
                            <b-card-text style="text-align: left">
                                <b>Category:</b> {{ feedback.category }}<br />
                                {{ feedback.message }} <br />
                                <b>By:</b>  {{ feedback.submittedBy.name }} <a :href="'/users/username/'+feedback.submittedBy.username">@{{feedback.submittedBy.username}}</a>&nbsp;<a :href="`mailto:`+feedback.submittedBy.email">{{feedback.submittedBy.email}}</a> <br />
                                <b>On:</b> {{ new Date(feedback.createdOn).toLocaleString() }}<br />
                            </b-card-text>
                        </b-card>
                    </b-col>
                </b-row>
            </b-container>
        </div>
    </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import Vue from "vue";
import { User } from "../../../common/src/models/User";
import { getUsers, updateUser } from "../api/users";
import MainNavBar from "../../src/components/MainNavBar.vue";
import DrawingNavBar from "../components/DrawingNavBar.vue";
import { FeedbackMessage } from "../../../common/src/models/FeedbackMessage";
import { getFeedbacks } from "../api/feedback-message";

@Component({
    components: {
        MainNavBar
    }
})
export default class Contacts extends Vue {
    feedbacks: FeedbackMessage[] = [];
    isLoaded: boolean = false;

    mounted() {
        // fill documents
        getFeedbacks().then((res) => {
            if (res.success) {
                this.feedbacks.splice(0, this.feedbacks.length, ...res.data);
                this.isLoaded = true;
            } else {
                this.$bvToast.toast(res.message, {
                    variant: "danger",
                    title: "Error retrieving contact list"
                });
            }
        });
    }

    get profile(): User {
        return this.$store.getters["profile/profile"];
    }

    subscribe() {
        updateUser(
            this.profile.username,
            this.profile.name,
            this.profile.email || undefined,
            true,
            this.profile.accessLevel,
            this.profile.organization ? this.profile.organization.id : undefined
        ).then((res) => {
            if (res.success) {
                this.$bvToast.toast("Successfully subscribed", {
                    variant: "success",
                    title: "Subscribed"
                });
                this.$store.dispatch("profile/setProfile", res.data);
            } else {
                this.$bvToast.toast(res.message, {
                    variant: "danger",
                    title: "Error subscribing"
                });
            }
        });
    }

    unsubscribe() {
        updateUser(
            this.profile.username,
            this.profile.name,
            this.profile.email || undefined,
            false,
            this.profile.accessLevel,
            this.profile.organization ? this.profile.organization.id : undefined
        ).then((res) => {
            if (res.success) {
                this.$bvToast.toast("Successfully unsubscribed", {
                    variant: "success",
                    title: "Unsubscribed"
                });
                this.$store.dispatch("profile/setProfile", res.data);
            } else {
                this.$bvToast.toast(res.message, {
                    variant: "danger",
                    title: "Error unsubscribing"
                });
            }
        });
    }
}
</script>

<style lang="less">
h1 {
    padding-top: 50px;
}
</style>
