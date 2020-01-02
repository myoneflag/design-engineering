<template>
    <b-container>
        <b-row class="text-center">
            <b-col>
                <h1 class="text-center">
                    Change password
                </h1>
            </b-col>
        </b-row>
        <b-row>
            <b-col>
                <h5 class="text-center">
                    For security reasons, please enter your current password
                </h5>
            </b-col>
        </b-row>
        <b-row style="margin-top: 50px;">
            <b-col> </b-col>
            <b-col cols="6">
                <b-form>
                    <b-form-group :label-cols="4" label="Current Password">
                        <b-form-input type="password" v-model="currentPassword" @keyup.enter="confirm"></b-form-input>
                    </b-form-group>

                    <b-form-group :label-cols="4" label="New Password" description="Must be at least 8 characters">
                        <b-form-input type="password" v-model="newPassword1" @keyup.enter="confirm"></b-form-input>
                    </b-form-group>

                    <b-form-group :label-cols="4" label="Repeat Password">
                        <b-form-input type="password" v-model="newPassword2" @keyup.enter="confirm"></b-form-input>
                    </b-form-group>

                    <b-form-group>
                        <b-button variant="info" @click="confirm">Confirm</b-button>
                    </b-form-group>
                </b-form>
            </b-col>
            <b-col> </b-col>
        </b-row>
    </b-container>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import axios from "axios";
import router from "../../src/router";
import { changePasswords } from "../../src/api/logins";

@Component
export default class ChangePassword extends Vue {
    currentPassword: string = "";
    newPassword1: string = "";
    newPassword2: string = "";

    confirm() {
        if (this.newPassword1 !== this.newPassword2) {
            (this as any).$bvToast.toast("Passwords didn't match", {
                title: "Please try again",
                variant: "info",
                solid: true
            });
        } else {
            changePasswords(this.currentPassword, this.newPassword1)
                .then((res) => {
                    if (res.success) {
                        this.$cookies.set("session-id", res.data);

                        if (this.$route.query.next) {
                            router.push(this.$route.query.next as string).then(() =>
                                (this as any).$bvToast.toast("Password change succeeded", {
                                    variant: "success"
                                })
                            );
                        } else {
                            router.push({ name: "home" }).then(() =>
                                (this as any).$bvToast.toast("Password change succeeded", {
                                    variant: "success"
                                })
                            );
                        }
                    } else {
                        (this as any).$bvToast.toast(res.message, {
                            title: "Password Change Error",
                            variant: "danger",
                            solid: true
                        });
                    }
                })
                .catch(() => {
                    (this as any).$bvToast.toast("Something went wrong...");
                });
        }
    }
}
</script>
