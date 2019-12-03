<template>
    <b-container>
        <b-row class="text-center">
            <b-col>
                <h1>
                    H2X - Exponential Engineering
                </h1>
            </b-col>
        </b-row>
        <b-row class="text-center">
            <b-col>
                <h5 class="text-center">
                    Hydraulics Designer Software - Login
                </h5>
            </b-col>
        </b-row>
        <b-row class="text-center">
            <b-col>
                <b-button to="contact" size="sm" variant="info">Request Demo</b-button>
            </b-col>
        </b-row>
        <b-row style="margin-top: 50px;">
            <b-col>

            </b-col>
            <b-col cols="6">

                <b-form>
                    <b-form-group
                            :label-cols="2"
                            label="Username"
                    >
                        <b-form-input v-model="username" @keyup.enter="login"></b-form-input>
                    </b-form-group>

                    <b-form-group
                            :label-cols="2"
                            label="Password"
                    >
                        <b-form-input type="password" @keyup.enter="login" v-model="password"></b-form-input>
                    </b-form-group>

                    <b-form-group>
                        <b-button variant="success" @click="login">Login</b-button>
                    </b-form-group>
                </b-form>
            </b-col>
            <b-col>

            </b-col>
        </b-row>
    </b-container>
</template>

<script lang='ts'>
    import Component from 'vue-class-component';
    import Vue from 'vue';
    import axios from 'axios';
    import router from '@/router';

    @Component
    export default class Login extends Vue {
        username: string = '';
        password: string = '';

        login() {
            axios.post('/api/login', {username: this.username, password: this.password})
                .then(({data: {success, accessToken, message, username}}) => {
                    if (success === true) {
                        this.$store.dispatch('profile/setUsername', username);
                        (this as any).$cookies.set('session-id', accessToken);
                        if (this.$route.query.next) {
                            router.push(this.$route.query.next as string);
                        } else {
                            router.push({name: 'home'});
                        }
                    } else {
                        (this as any).$bvToast.toast(message, {
                            title: 'Login Error',
                            variant: 'danger',
                            solid: true,
                        });
                    }
            }).catch((err) => {
                (this as any).$bvToast.toast(err, {
                    title: 'Login Error',
                    variant: 'danger',
                    solid: true,
                });});
        }
    }
</script>
