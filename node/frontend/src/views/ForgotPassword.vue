<template>
    <div id="wrapper">
        <PublicNavBar></PublicNavBar>
        <b-container style="padding-top: 50px; width: 800px">
            <b-row>
                <b-col>
                    <h2>Forgot Password</h2>
                </b-col>
            </b-row>
            <br>
            <b-row>
                <b-col>
                    <b-form>
                        <b-form-group :label-cols="2" label-align="left" label="Username">
                            <b-form-input :required="false" type="text" v-model="username" :disabled="isLoading"></b-form-input>
                        </b-form-group>

                        <b-form-group :label-cols="2" label-align="left" label="Email">
                            <b-form-input :required="false" type="email" v-model="email" :disabled="isLoading"></b-form-input>
                        </b-form-group>
                    </b-form>
                    <b-button variant="success" style="margin-top:50px" @click="handleClickSubmit" :disabled="isLoading">
                        {{ isRedirecting && 'This page is redirecting to login page.' || 'Submit' }} <span v-if="isLoading"><b-spinner style="width: 1.0rem; height: 1.0rem;"></b-spinner></span>
                    </b-button>
                </b-col>
            </b-row>
        </b-container>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { APIResult } from "../../../common/src/api/document/types";
import { forgotPassword } from "../../src/api/users";
import PublicNavBar from "../components/PublicNavBar.vue";

@Component({
    components: { PublicNavBar }
})
export default class ForgotPassword extends Vue {
    email: string = "";
    username: string = "";
    message: string = "";
    isLoading: boolean = false;
    isRedirecting: boolean = false;

    handleClickSubmit() {
        this.isLoading = true;

        forgotPassword(this.email, this.username).then((res: APIResult<string>) => {
            if (res.success) {
                this.$bvToast.toast(res.message || "", {
                    title: "Request password reset success!",
                    variant: "success",
                });

                this.isRedirecting = true;

                setTimeout(() => this.$router.push("/login"), 3000);

                return;
            }

            this.$bvToast.toast(res.message, {
                title: "Request password reset failed!",
                variant: "danger"
            });

            this.isLoading = false;
        });
    }
}
</script>
