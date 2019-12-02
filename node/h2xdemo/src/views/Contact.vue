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
            </b-col>
            <b-col></b-col>
        </b-row>
        <b-row style="margin-top: 50px;">
            <b-col>

            </b-col>
            <b-col cols="6">

                <b-form>
                    <b-form-input v-model="name" @keyup.enter="login" placeholder="Name*"></b-form-input>
                    <b-form-input type="email" @keyup.enter="login" v-model="email" placeholder="Email*"></b-form-input>
                    <b-form-textarea @keyup.enter="login" v-model="message" rows="10" placeholder="Message" ></b-form-textarea>

                    <b-form-group>
                        <b-button variant="success" @click="submit" align="right">Submit</b-button>
                    </b-form-group>
                </b-form>
            </b-col>
            <b-col>

            </b-col>
        </b-row>
        <b-row style="margin-top: 100px">
            Are you tired of the tedious and time consuming design process?
            H2X is a revolutionary hydraulic engineering software that increases the quality, efficiency, and consistency of designs.
            Watch the video below to find out how.
        </b-row>
    </b-container>
</template>

<script lang="ts">
    import Component from 'vue-class-component';
    import Vue from 'vue';
    import axios from 'axios';
    import router from '@/router';

    @Component
    export default class Contact extends Vue {
        name: string = '';
        email: string = '';
        message: string = '';

        submit() {

            axios.post('/api/contact', {name: this.name, password: this.email, message: this.message})

                .then(({data: {success, accessToken, message, username}}) => {
                    if (success === true) {

                        (this as any).$bvToast.toast('Thank you for your interest! We will get in contact with you shortly', {
                            title: 'Message Sent',
                            variant: 'success',
                            solid: true,
                        });

                        setTimeout(() => this.$router.push({name: 'login'}), 5000);
                    } else {
                        (this as any).$bvToast.toast('Hmm... we were unable to receive your message. Please contact jonathanmousdell@gmail.com directly, thanks!', {
                            title: message,
                            variant: 'danger',
                            solid: true,
                        });
                    }
                }).catch((err) => {

                (this as any).$bvToast.toast('Hmm... we were unable to receive your message. Please contact jonathanmousdell@gmail.com directly, thanks!', {
                    title: 'Network Error',
                    variant: 'danger',
                    solid: true,
                })
            });
        }
    }
</script>
