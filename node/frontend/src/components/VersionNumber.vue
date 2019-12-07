<template>
    <label id="version-label">Version: {{appVersion}}</label>
</template>
<script lang="ts">
    import Vue from 'vue';
    import Component from 'vue-class-component';

    @Component
    export default class VersionNumber extends Vue {
        get appVersion() {
            return this.$store.getters.appVersion;
        }
    }
</script>
<style lang="less">
    #version-label {
        position: absolute;
        bottom: 10px;
        left: 20px;
    }
</style>
