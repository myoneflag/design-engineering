<template>
    <div>
        <b-container style="padding-top: 50px; width: 800px">
            <b-row>
                <b-col>
                    <h2>Password Reset</h2>
                </b-col>
            </b-row>
            <br>
            <b-row>
                <b-col>
                    <b-form>
                        <b-form-group :label-cols="3" label-align="left" label="New Password">
                            <b-form-input :required="false" type="password" v-model="password" :disabled="isLoading"></b-form-input>
                        </b-form-group>

                        <b-form-group :label-cols="3" label-align="left" label="Retype New Password">
                            <b-form-input :required="false" type="password" v-model="confirmPassword" :disabled="isLoading"></b-form-input>
                        </b-form-group>
                    </b-form>
                    <b-button variant="success" style="margin-top:50px" @click="handleClickSubmit" :disabled="isLoading">
                        {{ isRedirecting && 'This page is redirecting...' || 'Submit' }} <span v-if="isLoading"><b-spinner style="width: 1.0rem; height: 1.0rem;"></b-spinner></span>
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
import { resetPassword } from "../../src/api/users";

@Component({})
export default class PasswordReset extends Vue {
    token: any = "";
    email: any = "";
    password: string = "";
    confirmPassword: string = "";
    message: string = "";
    isLoading: boolean = false;
    isRedirecting: boolean    = false;

    created() {
        this.email = this.$route.query.email;
        this.token = this.$route.query.token;
    }

    handleClickSubmit() {
        this.isLoading = true;

        resetPassword(this.password, this.confirmPassword, this.email, this.token).then((res: APIResult<string>) => {
            if (res.success) {
                this.$bvToast.toast(res.message || "", {
                    title: "Password reset success!",
                    variant: "success",
                });

                this.isRedirecting = true;

                setTimeout(() => this.$router.push("/login"), 3000);

                return;
            }

            this.$bvToast.toast(res.message, {  
                title: "Password reset failed!",
                variant: "danger"
            });

            if (res.redirect) {
                setTimeout(() => this.$router.push("/forgot-password"), 3000);
                
                this.isRedirecting = true;
                
                return;
            }

            this.isLoading = false;
        });
    }
}
</script>
