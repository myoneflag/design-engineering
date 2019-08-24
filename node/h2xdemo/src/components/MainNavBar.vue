<template>
    <b-navbar type="light">
        <b-navbar-nav>
            <b-nav-item to="/" active-class="active" exact>Home</b-nav-item>
        </b-navbar-nav>

        <ProfileMenuItem/>
    </b-navbar>
</template>

<script lang="ts">
    import Component from 'vue-class-component';
    import Vue from 'vue';
    import ProfileMenuItem from '@/components/ProfileMenuItem.vue';
    @Component({
        components: {ProfileMenuItem}
    })
    export default class MainNavBar extends Vue {};
</script>

<style lang="less">
    .navbar {
        padding: 10px;
        background-color: #ffffff;
        border-bottom: 1px solid lightgray;
    }
</style>
