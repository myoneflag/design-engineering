<template>
    <b-navbar type="light">
        <b-container style="max-width: 950px">
            <b-navbar-nav>
                <b-navbar-brand href="https://h2xengineering.com">
                    <img src="@/assets/h2x.png" class="d-inline-block align-top" height="70" />
                </b-navbar-brand>
            </b-navbar-nav>

            <b-navbar-nav style="text-align: center; margin-left: auto; margin-right: auto;">
                <b-nav-item class="public-nav-item" href="https://h2xengineering.com">Home</b-nav-item>
                <b-nav-item class="public-nav-item" href="https://h2xengineering.com/questions">FAQ</b-nav-item>
                <b-nav-item class="public-nav-item" href="https://h2xengineering.com/copy-of-questions"
                    >Tutorials</b-nav-item
                >
                <b-nav-item class="public-nav-item" href="https://h2xengineering.com/get-in-touch"
                    >Get in Touch</b-nav-item
                >
            </b-navbar-nav>

            <b-navbar-nav class="ml-auto">
                <ProfileMenuItem v-if="loggedIn" style="padding: 20px"> </ProfileMenuItem>
            </b-navbar-nav>
        </b-container>
    </b-navbar>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import ProfileMenuItem from "./ProfileMenuItem.vue";
@Component({
    components: { ProfileMenuItem }
})
export default class PublicNavBar extends Vue {
    get loggedIn(): boolean {
        return !!this.$store.getters["profile/profile"];
    }
}
</script>

<style lang="less">
.navbar {
    background-color: #ffffff;
    border-bottom: 1px solid lightgray;
}

.public-nav-item {
    padding: 0 30px;
}
</style>
