<template>
    <b-nav-item-dropdown right :disabled="disabled">
        <template slot="button-content">
            <v-icon name="user" style="margin-top: -3px"></v-icon>
            {{ profile.name + " " }}
        </template>
        <b-dropdown-item :to="'/users/username/' + profile.username">Profile</b-dropdown-item>
        <b-dropdown-item @click="changePassword">Change Password</b-dropdown-item>
        <b-dropdown-item @click="renderGuide">Guide</b-dropdown-item>
        <b-dropdown-item @click="renderFeedback">Feedback</b-dropdown-item>
        <b-modal id="modal-2" scrollable title="Give us some feedback!" okTitle="Save" @ok="onSubmitFeedback" @cancel="onCloseFeedback" @close="onCloseFeedback">
            <b-form-textarea
                id="t" v-model="message" placeholder="Anything you want to talk about." rows="8">
            </b-form-textarea>
            <b-form-select v-model="selected" :options="options"></b-form-select>
            <b-alert variant="danger" :show="showAlert">
                {{ errorMessage }}
            </b-alert>
        </b-modal>
        <template v-if="profile.accessLevel <= AccessLevel.MANAGER">
            <b-dropdown-divider></b-dropdown-divider>
            <!--Admin Panel controls-->
            <b-dropdown-item v-if="profile.accessLevel <= AccessLevel.ADMIN" to="/organizations">
                Organizations
            </b-dropdown-item>
            <b-dropdown-item to="/users">Users</b-dropdown-item>
        </template>

        <template v-if="profile.accessLevel <= AccessLevel.SUPERUSER">
            <b-dropdown-divider></b-dropdown-divider>
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
import {submitFeedback} from "../api/feedback-message"

@Component(
    {
        props: {
            disabled: Boolean,
        }
    }
)
export default class ProfileMenuItem extends Vue {
    showAlert: boolean = false;
    selected: string = '';
    errorMessage: string = "";
    options = [
        {value: '', text: 'Please select a category'},
        {value: 'feature', text: 'feature request'},
        {value: 'bug', text: 'bug'},
        {value: 'suggestion', text: 'suggestion'},
        {value: 'other', text: 'other'}
    ];
    message: string = "";
    get profile(): User {
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

    renderGuide() {
        router.push("guide");
    }

    renderFeedback() {
        this.$bvModal.show('modal-2');

    }

    onSubmitFeedback(bvModalEvt: any) {
        bvModalEvt.preventDefault()
        if (this.selected === ""){
            this.showAlert = true;
            this.errorMessage = "Please select a category for the feedback."
        }
        else if (this.message === ""){
            this.showAlert = true;
            this.errorMessage = "Please write a feedback."
        }
        else{
            submitFeedback(this.selected, this.message)
            .then((res)=>{
                this.$bvModal.hide('modal-2');
            })
        }
    }

    onCloseFeedback(bvModalEvt: any) {
        this.selected = "";
        this.message = "";
        this.errorMessage = "";
        this.showAlert = false;
    }
}
</script>
