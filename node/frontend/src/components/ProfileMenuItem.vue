<template>
    <b-nav-item-dropdown right :disabled="disabled">

        <template slot="button-content">
            <v-icon name="user" style="margin-top: -3px"></v-icon>
            {{ profile.name + " " }}
        </template>

        <b-dropdown-item :to="'/users/username/' + profile.username">Profile</b-dropdown-item>
        <b-dropdown-item @click="changePassword">Change Password</b-dropdown-item>
        <b-dropdown-item :to="'/tutorials'">Tutorials</b-dropdown-item>
        <b-dropdown-item @click="renderFeedback">Feedback</b-dropdown-item>
        <FeedbackModal v-model="showFeedbackModal"/>
        <template v-if="profile.accessLevel <= AccessLevel.MANAGER">
            <b-dropdown-divider></b-dropdown-divider>
            <!--Admin Panel controls-->
            <b-badge style="font-size: 12px; margin-left: 10px">MANAGER</b-badge>
            <b-dropdown-item to="/users">Users</b-dropdown-item>
        </template>
        <template v-if="profile.accessLevel <= AccessLevel.ADMIN">
            <b-dropdown-divider></b-dropdown-divider>
            <b-badge style="font-size: 12px; margin-left: 10px">H2X ADMIN</b-badge>            
            <b-dropdown-item to="/organizations">
                All Organizations
            </b-dropdown-item>
        </template>
        <template v-if="profile.accessLevel <= AccessLevel.SUPERUSER">
            <b-dropdown-divider></b-dropdown-divider>            
            <b-badge style="font-size: 12px; margin-left: 10px">H2X SUPERUSER</b-badge>
            <b-dropdown-item to="/contacts">Feedback Messages</b-dropdown-item>
            <b-dropdown-item to="/errors">Auto Error Reports</b-dropdown-item>
            <b-dropdown-item to="/changeLogs">Change Logs</b-dropdown-item>
            <b-dropdown-item to="/addVideo">Add a Video</b-dropdown-item>
        </template>

        <b-dropdown-divider></b-dropdown-divider>
        <b-dropdown-item :to="{ name: 'eula' }">License Agreement</b-dropdown-item>
        <b-dropdown-item @click="logout">Logout</b-dropdown-item>
    </b-nav-item-dropdown>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import router from "../../src/router";
import { logout } from "../../src/api/logins";
import { AccessLevel, User } from "../../../common/src/models/User";
import {submitFeedback} from "../api/feedback-message";
import FeedbackModal from "./FeedbackModal.vue";

@Component(
    {
        components: { FeedbackModal },
        props: {
            disabled: Boolean,
        }
    }
)
export default class ProfileMenuItem extends Vue {
    showFeedbackModal = false;

    get profile() {
        const profile = this.$store.getters["profile/profile"];
        if (!profile) {
            return {
                username: "",
                accessLevel: AccessLevel.USER,
                organization: {
                    id: "",
                    name: ""
                },
                email: "",
                subscribed: false,
                name: "",
                passwordHash: "",
                eulaAccepted: false,
                eulaAcceptedOn: null,
                lastActivityOn: null,
                lastNoticeSeenOn: null,
                temporaryOrganizationName: null,
                temporaryUser: false,
            };
        } else {
            return profile;
        }
    }

    logout() {
        logout().then((res) => {
            if (res.success) {
                (this as any).$cookies.remove("session-id");
                this.$store.dispatch("profile/setProfile", null).then(() => router.push({ name: "login" }));
            } else {
                this.$bvToast.toast(res.message, {
                    title: "Could not log out",
                    variant: "danger"
                });
            }
        });
    }

    get AccessLevel() {
        return AccessLevel;
    }

    changePassword() {
        router.push({
            name: "changePassword",
            query: {
                next: this.$router.currentRoute.fullPath
            }
        });
    }

    renderFeedback() {
        this.showFeedbackModal = true;
    }
}
</script>
