<template>
    <b-navbar-nav class="ml-auto">
        <b-nav-item-dropdown :text=" username  + ' '" right >

            <b-dropdown-item @click="changePassword">Change Password</b-dropdown-item>
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
    import router from '@/router';

    @Component(
        mapGetters({
            username: 'profile/username',
        }),
    )
    export default class ProfileMenuItem extends Vue {
        get username() {
            return this.$store.getters['profile/username'];
        }

        logout() {
            axios.post('/api/logout')
                .then(() => {
                        (this as any).$cookies.remove('session-id');
                        this.$store.dispatch('profile/setUsername', '').then(() =>
                            router.push({name: 'login'}),
                        );
                    },
                );
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
