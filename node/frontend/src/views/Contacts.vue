<template>
    <div>
        <MainNavBar></MainNavBar>
        <div class="home" style="overflow-y: auto; overflow-x: hidden; height: calc(100vh - 70px)">
            <b-container>
                <b-row>
                    <b-col>
                        <h1 class="title">
                            Contact Us Messages
                        </h1>
                    </b-col>
                </b-row>
                <b-row>
                    <b-col>
                        <p>These are from the <router-link to="/contact">Contact Us</router-link> page</p>
                        <b-button
                            variant="warning"
                            v-if="profile.email == null"
                            :to="'/users/username/' + profile.username"
                            >Set your email to subscribe</b-button
                        >
                        <b-button variant="info" v-else-if="!profile.subscribed" @click="subscribe">Subscribe</b-button>
                        <b-button variant="danger" v-else @click="unsubscribe">Unsubscribe</b-button>
                    </b-col>
                </b-row>
                <b-row>
                    <b-col>
                        <b-alert variant="success" v-if="contacts.length === 0 && isLoaded" show
                            >There are no contact messages right now</b-alert
                        >
                    </b-col>
                </b-row>
                <b-row v-for="contact in contacts" :key="contact.id">
                    <b-col>
                        <b-card>
                            <b-card-title>{{ contact.name }}</b-card-title>
                            <b-card-text style="text-align: left">
                                <b>Email:</b> {{ contact.email }}<br />
                                <b>Date:</b> {{ new Date(contact.sentOn).toLocaleString() }}<br />
                                <b>IP:</b> {{ contact.ip }}<br />
                                <b>Message:</b> {{ contact.message }}
                            </b-card-text>
                        </b-card>
                    </b-col>
                </b-row>
            </b-container>
        </div>
    </div>
</template>

<script lang="ts">
import { Component } from "vue-property-decorator";
import Vue from "vue";
import { User } from "../../../common/src/models/User";
import { getUsers, updateUser } from "../api/users";
import MainNavBar from "../../src/components/MainNavBar.vue";
import DrawingNavBar from "../components/DrawingNavBar.vue";
import { ContactMessage } from "../../../common/src/models/ContactMessage";
import { getContactMessages } from "../api/contact-message";

@Component({
    components: {
        MainNavBar
    }
})
export default class Contacts extends Vue {
    contacts: ContactMessage[] = [];
    isLoaded: boolean = false;

    mounted() {
        // fill documents
        getContactMessages().then((res) => {
            if (res.success) {
                this.contacts.splice(0, this.contacts.length, ...res.data);
                this.isLoaded = true;
            } else {
                this.$bvToast.toast(res.message, {
                    variant: "danger",
                    title: "Error retrieving contact list"
                });
            }
        });
    }

    get profile(): User {
        return this.$store.getters["profile/profile"];
    }

    subscribe() {
        updateUser(
            this.profile.username,
            this.profile.name,
            this.profile.email || undefined,
            true,
            this.profile.accessLevel,
            this.profile.organization ? this.profile.organization.id : undefined
        ).then((res) => {
            if (res.success) {
                this.$bvToast.toast("Successfully subscribed", {
                    variant: "success",
                    title: "Subscribed"
                });
                this.$store.dispatch("profile/setProfile", res.data);
            } else {
                this.$bvToast.toast(res.message, {
                    variant: "danger",
                    title: "Error subscribing"
                });
            }
        });
    }

    unsubscribe() {
        updateUser(
            this.profile.username,
            this.profile.name,
            this.profile.email || undefined,
            false,
            this.profile.accessLevel,
            this.profile.organization ? this.profile.organization.id : undefined
        ).then((res) => {
            if (res.success) {
                this.$bvToast.toast("Successfully unsubscribed", {
                    variant: "success",
                    title: "Unsubscribed"
                });
                this.$store.dispatch("profile/setProfile", res.data);
            } else {
                this.$bvToast.toast(res.message, {
                    variant: "danger",
                    title: "Error unsubscribing"
                });
            }
        });
    }
}
</script>

<style lang="less">
h1 {
    padding-top: 50px;
}
</style>
