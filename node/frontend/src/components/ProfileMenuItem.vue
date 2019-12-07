<template>
    <b-navbar-nav class="ml-auto">
        <b-nav-item-dropdown :text=" profile.name  + ' '" right>

            <b-dropdown-item :to="'/users/username/' + profile.username">Profile</b-dropdown-item>
            <b-dropdown-item @click="changePassword">Change Password</b-dropdown-item>
            <template v-if="profile.accessLevel <= AccessLevel.MANAGER">
                <b-dropdown-divider></b-dropdown-divider>
                <!--Admin Panel controls-->
                <b-dropdown-item
                        v-if="profile.accessLevel <= AccessLevel.ADMIN"
                        to="/organizations"
                >
                    Organizations
                </b-dropdown-item>
                <b-dropdown-item to="/users">Users</b-dropdown-item>
            </template>


            <b-dropdown-divider></b-dropdown-divider>
            <b-dropdown-item @click="logout">Logout</b-dropdown-item>
        </b-nav-item-dropdown>
    </b-navbar-nav>
</template>

<script lang="ts">
    import Component from 'vue-class-component';
    import {mapGetters} from 'vuex';
    import Vue from 'vue';
    import axios from 'axios';
    import router from '../../src/router';
    import {logout} from "../../src/api/logins";
    import {Profile} from "../store/profile/types";
    import {AccessLevel} from "../../../backend/src/entity/User";

    @Component
    export default class ProfileMenuItem extends Vue {
        get profile(): Profile {
            return this.$store.getters['profile/profile'];
        }

        logout() {
            logout().then((res) => {
                if (res.success) {
                    (this as any).$cookies.remove('session-id');
                    this.$store.dispatch('profile/setProfile', null).then(() =>
                        router.push({name: 'login'}),
                    );
                } else {
                    this.$bvToast.toast(res.message, {
                        title: 'Could not log out',
                        variant: 'danger',
                    })
                }
            });
        }

        get AccessLevel() {
            return AccessLevel;
        }

        changePassword() {
            router.push({
                name: 'changePassword',
                query: {
                    next: this.$router.currentRoute.fullPath,
                },
            });
        }
    }
</script>
