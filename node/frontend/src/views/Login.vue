<template>
    <div style="height: 100%">
        <PublicNavBar></PublicNavBar>
        <b-container style="height: 100%" fluid>
            <b-row class="text-center" style="height: calc(125vh - 110px);">
                <b-col cols="12" style="height: 100%; background-color: aliceblue">
                    <b-card class="login-card">
                        <b-card bg-variant="primary" text-variant="light" class="welcome-back">
                            <h2>Welcome Back</h2>
                        </b-card>
                        <h5 style="margin-bottom: 20px">Sign In to H2X - Plumbing Design Software</h5>
                        <b-form style="text-align: left" @keyup.enter="login">
                            <b-form-group :label-cols="3" label="Username">
                                <b-form-input :disabled="isLoading" type="text" v-model="username"></b-form-input>
                            </b-form-group>

                            <b-form-group :label-cols="3" label="Password">
                                <b-form-input :disabled="isLoading" type="password" v-model="password"></b-form-input>
                                <router-link :to="{ name: 'forgotPassword'}" style="padding-top: 4px;display: block;">Forgot password?</router-link>
                            </b-form-group>

                            <b-form-group>
                                <b-button :disabled="isLoading" variant="success" @click="login" style="width: 100%" size="lg">
                                    Login <b-spinner v-if="isLoading" style="width: 1.0rem; height: 1.0rem;"></b-spinner>
                                </b-button>
                            </b-form-group>

                            <b-form-group>
                                <b-button variant="primary" @click="signUp" style="width: 100%" size="lg">
                                    Signup
                                </b-button>
                            </b-form-group>
                        </b-form>
                    </b-card>
                </b-col>
            </b-row>
        </b-container>
    </div>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import router from "../../src/router";
import { login } from "../../src/api/logins";
import MainNavBar from "../components/MainNavBar.vue";
import PublicNavBar from "../components/PublicNavBar.vue";

@Component({
    components: { PublicNavBar, MainNavBar }
})
export default class Login extends Vue {
    username: string = "";
    password: string = "";
    isLoading: boolean = false;

    login() {
        this.isLoading = true;

        login(this.username, this.password).then((res) => {
            if (res.success === true) {
                this.$store.dispatch("profile/setProfile", null);
                (this as any).$cookies.set("session-id", res.data);
                if (this.$route.query.next) {
                    router.push(this.$route.query.next as string);
                } else {
                    router.push("/");
                }
            } else {
                this.$bvToast.toast(res.message, {
                    title: "Login Error",
                    variant: "danger"
                });

                this.isLoading = false;
            }
        });
    }

    signUp() {
        this.$router.push('/signup');
    }
}
</script>

<style lang="less">
.login-card {
    -webkit-box-shadow: 5px 5px 5px 1px rgba(0, 0, 0, 0.26);
    -moz-box-shadow: 5px 5px 5px 1px rgba(0, 0, 0, 0.26);
    box-shadow: 5px 5px 5px 1px rgba(0, 0, 0, 0.26);
    margin-top: calc(50vh - 70px - 220px);
    max-width: 500px;
    padding: 20px;
    margin-left: auto;
    margin-right: auto;
}

.welcome-back {
    -webkit-box-shadow: 5px 5px 26px 1px rgba(0, 0, 0, 0.26);
    -moz-box-shadow: 5px 5px 26px 1px rgba(0, 0, 0, 0.26);
    box-shadow: 5px 5px 26px 1px rgba(0, 0, 0, 0.26);

    height: 100px;
    width: 80%;
    margin-left: auto;
    margin-right: auto;
    margin-top: -80px;
    margin-bottom: 40px;
    padding-top: 10px;
}

.login-left-side {
    -webkit-box-shadow: 5px 0px 5px 1px rgba(0, 0, 0, 0.26);
    -moz-box-shadow: 5px 0px 5px 1px rgba(0, 0, 0, 0.26);
    box-shadow: 5px 0px 5px 1px rgba(0, 0, 0, 0.26);

    background-color: white;
    text-align: right;
    z-index: -1;
    padding-right: 50px;
}
</style>
