<template>
    <div style="height: 100%;">
        <PublicNavBar></PublicNavBar>
        <div style="overflow: auto; max-height: calc(100% - 101px);">
            <b-container style="padding-top: 50px; padding-bottom: 50px; width: 800px;">
                <b-row>
                    <b-col>
                        <h2>Sign Up</h2>
                    </b-col>
                </b-row>
                <br>
                <b-row>
                    <b-col>
                        <b-form>
                            <b-form-group :label-cols="3" label-align="left" label="First Name">
                                <b-form-input :required="false" type="text" v-model="user.firstname" :disabled="isLoading"></b-form-input>
                            </b-form-group>

                            <b-form-group :label-cols="3" label-align="left" label="Last Name">
                                <b-form-input :required="false" type="text" v-model="user.lastname" :disabled="isLoading"></b-form-input>
                            </b-form-group>

                            <b-form-group :label-cols="3" label-align="left" label="Username">
                                <b-form-input :required="false" type="text" v-model="user.username" :disabled="isLoading"></b-form-input>
                            </b-form-group>

                            <b-form-group :label-cols="3" label-align="left" label="Email">
                                <b-form-input :required="false" type="email" v-model="user.email" :disabled="isLoading"></b-form-input>
                            </b-form-group>

                            <b-form-group :label-cols="3" label-align="left" label="Password">
                                <b-form-input :required="false" type="password" v-model="user.password" :disabled="isLoading"></b-form-input>
                            </b-form-group>

                            <b-form-group :label-cols="3" label-align="left" label="Confirm Password">
                                <b-form-input :required="false" type="password" v-model="user.confirmPassword" :disabled="isLoading"></b-form-input>
                            </b-form-group>
                        </b-form>
                        <b-button variant="success" style="margin-top:50px" @click="handleClickCreateAccount" :disabled="isLoading">
                            {{isRedirecting && 'Logging in...' || 'Create Account'}} <span v-if="isLoading"><b-spinner style="width: 1.0rem; height: 1.0rem;"></b-spinner></span>
                        </b-button>
                    </b-col>
                </b-row>
            </b-container>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Create } from "../../../common/src/models/User";
import { signUp } from "../api/users";
import { login } from "../api/logins";
import PublicNavBar from "../components/PublicNavBar.vue";

@Component({
    components: { PublicNavBar }
})
export default class CreateUser extends Vue {
    user: Create = {
        firstname: "",
        lastname: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    };
    isLoading: boolean = false;
    isRedirecting: boolean = false;

    handleClickCreateAccount() {
        this.isLoading = true;

        signUp(this.user).then((res) => {
            if (res.success) {
                this.isRedirecting = true;

                login(this.user.username, this.user.password).then((logres) => {
                    if (logres.success === true) {
                        this.$store.dispatch("profile/setProfile", null);
                        (this as any).$cookies.set("session-id", logres.data);
                        if (this.$route.query.next) {
                            this.$router.push(this.$route.query.to as string);
                        } else {
                            this.$router.push("/");
                        }
                    } else {
                        this.$bvToast.toast(logres.message, {
                            title: "Login Error",
                            variant: "danger"
                        });

                        setTimeout(() => this.$router.push('/login'), 3000);
                    }
                });
            } else {
                this.$bvToast.toast(res.message, {
                    title: "Unable to register!",
                    variant: "danger"
                });

                this.isLoading = false;
            }
        });
    }
}
</script>
