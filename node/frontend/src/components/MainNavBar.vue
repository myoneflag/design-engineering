<template>
    <b-navbar type="light">
        <b-navbar-nav>
            <b-navbar-brand href="https://h2xengineering.com" v-b-tooltip.hover="{title: 'Public Site'}">
                <img src="@/assets/h2x.png" class="d-inline-block align-top" height="30">
            </b-navbar-brand>

        </b-navbar-nav>
        <b-navbar-nav>
            <b-nav-item :to="{ name: 'home' }" active-class="active" exact>Your Drawings</b-nav-item>
        </b-navbar-nav>

        <b-navbar-nav class="ml-auto">

            <ProfileMenuItem />
        </b-navbar-nav>
    </b-navbar>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import ProfileMenuItem from "../../src/components/ProfileMenuItem.vue";
@Component({
    components: { ProfileMenuItem }
})
export default class MainNavBar extends Vue {}
</script>

<style lang="less">
.navbar {
    padding: 10px;
    background-color: #ffffff;
    border-bottom: 1px solid lightgray;
}
</style>
