<template>
    <div id="wrapper">
        <LoadingScreen v-if="isLoading" />
        <template v-else>
            <b-alert show variant="danger" :class="'text-left'">
                <h4 class="alert-heading">Email Verification Failed!</h4>
                <p>{{ message }}</p>
                <hr>
                <p class="mb-0">
                    <b-form-input type="text" class="mb-2" v-model="username" placeholder="Username"></b-form-input>
                    <b-form-input type="email" class="mb-3" v-model="email" placeholder="Email"></b-form-input>

                    <b-button block variant="primary" @click="handleClickSendVerificationEmailLink">Send email verification link.</b-button>
                </p>
            </b-alert>
        </template>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { APIResult } from "../../../common/src/api/document/types";
import { confirmEmail, login } from "../../src/api/logins";
import { sendEmailVerification } from "../../src/api/users";
import LoadingScreen from "../../src/views/LoadingScreen.vue";

@Component({
    components: { LoadingScreen }
})
export default class ConfirmEmail extends Vue {
    email: any          = "";
    token: any          = "";
    username: string    = "";
    message: string     = "";
    isLoading: boolean  = true;
   
    created() {
        this.email = this.$route.query.email;
        this.token = this.$route.query.token;

        confirmEmail(this.email, this.token).then((res: APIResult<string>) => {
            if (res.success) {
                this.$store.dispatch("profile/setProfile", null);
                (this as any).$cookies.set("session-id", res.data);

                return this.$router.push("/");
                
            } else if(!res.success) {
                if (res.redirect) {
                    return this.$router.push("/login");
                }

                this.isLoading = false;
                this.message = res.message;
            }
        });
    }

    handleClickSendVerificationEmailLink() {
        this.isLoading = true;

        sendEmailVerification(this.email, this.username).then((res: APIResult<string>) => {
            if (res.success) {
                return this.$router.push("/login");
            }

            this.$bvToast.toast(res.message || "", {
                title: "Send email verification link error!",
                variant: "danger"
            });

            this.isLoading = false;
        });
    }
}
</script>

<style lang="less" scoped>
    #wrapper {
        max-width: 600px;
        position: absolute;
        transform: translate(-50%, -50%);
        left: 50%;
        top: 50%;
        padding: 20px;
    }
</style>
