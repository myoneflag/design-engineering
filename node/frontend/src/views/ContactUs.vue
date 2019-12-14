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
            <b-col></b-col>
            <b-col cols="8">
                <h5 class="text-center">
                    Thank you for your interest in H2X. If you are interested in having early access to our software, please contact us by completing the below form and we will be in touch shortly.
                </h5>
                <b-button variant="info" size="sm" to="login">Login (For Existing Users)</b-button>
            </b-col>
            <b-col></b-col>
        </b-row>
        <b-row style="margin-top: 50px;">
            <b-col cols="6">
                <h3>Contact Us</h3>
                <b-form v-if="!sent">
                    <b-form-input v-model="name" placeholder="Name*"></b-form-input>
                    <b-form-input type="email" v-model="email" placeholder="Email*"></b-form-input>
                    <b-form-textarea v-model="message" rows="10" placeholder="Message" ></b-form-textarea>

                    <b-form-group>
                        <b-button variant="success" @click="submit" align="right">Submit</b-button>
                    </b-form-group>
                </b-form>
                <b-alert show variant="success" v-else>
                    Thank you for your interest! We will get in touch shortly.
                </b-alert>
            </b-col>
            <b-col cols="6">
                <iframe src="https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:6606844300288499712" height="616" width="504" frameborder="0" allowfullscreen="" title="Embedded post"></iframe>
            </b-col>
        </b-row>
        <b-row style="margin-top: 20px">
            <b-col>
                <b-button-group>
                    <b-button href="https://www.linkedin.com/company/h2x-exponential-engineering/?viewAsMember=true" variant="primary"><v-icon  name="brands/linkedin" scale="2"/></b-button>
                    <b-button href="mailto:jonathanmousdell@gmail.com" variant="danger"><v-icon  name="envelope" scale="2"/></b-button>
                </b-button-group>
            </b-col>
        </b-row>
    </b-container>
</template>

<script lang="ts">
    import Component from 'vue-class-component';
    import Vue from 'vue';
    import axios from 'axios';
    import router from '../../src/router';
    import {sendContactMessage} from "../api/contact-message";

    @Component
    export default class ContactUs extends Vue {
        name: string = '';
        email: string = '';
        message: string = '';

        sent = false;

        submit() {
            sendContactMessage(this.name, this.email, this.message).then((res) => {
                if (res.success) {
                    this.sent = true;
                    (this as any).$bvToast.toast('Thank you for your interest! We will get in contact with you shortly', {
                        title: 'Message Sent',
                        variant: 'success',
                        solid: true,
                    });
                } else {
                    this.$bvToast.toast('Hmm... we were unable to receive your message. Please contact jonathanmousdell@gmail.com directly, thanks!', {
                        title: res.message,
                        variant: 'danger',
                        solid: true,
                    });
                }
            });
        }
    }
</script>
