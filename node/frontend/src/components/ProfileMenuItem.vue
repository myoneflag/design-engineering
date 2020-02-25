<template>
    <b-nav-item-dropdown right>
        <template slot="button-content">
            <v-icon name="user" style="margin-top: -3px"></v-icon>
            {{ profile.name + " " }}
        </template>
        <b-dropdown-item :to="'/users/username/' + profile.username">Profile</b-dropdown-item>
        <b-dropdown-item @click="changePassword">Change Password</b-dropdown-item>
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
            <b-dropdown-item to="/contacts">Contact Messages</b-dropdown-item>
            <b-dropdown-item to="/errors">Auto Error Reports</b-dropdown-item>
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

@Component
export default class ProfileMenuItem extends Vue {
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
                lastActivityOn: null
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
}
</script>
