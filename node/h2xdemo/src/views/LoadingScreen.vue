<template>
    <div ref="overlaydiv" class="fullFrame" style="background-color: #f8f9fa; position: fixed; top: 63px; left: 0"

    >
            <div style="top: 50%; position: absolute; transform: translateY(-50%) translateX(-50%); left: 50%">
                <b-spinner style="width: 5rem; height: 5rem;"></b-spinner>
                <h2>Loading</h2>
            </div>
    </div>
</template>

<script lang="ts">
    // The purpose of this is to capture events above the UI and pass them to the canvas when necessary.
    import Vue from 'vue';
    import Component from 'vue-class-component';
    import FloorPlanProperties from '@/components/editor/property-window/FloorPlanProperties.vue';

    @Component
    export default class LoadingScreen extends Vue {

    }
</script>

<style lang="css">
</style>
