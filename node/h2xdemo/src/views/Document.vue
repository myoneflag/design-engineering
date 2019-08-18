<template>
    <div>
        <DrawingNavBar></DrawingNavBar>
        <DrawingSetup>

        </DrawingSetup>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import DrawingNavBar from "../components/DrawingNavBar.vue";
    import DrawingSetup from '@/components/DrawingSetup.vue';

    @Component({
        components: {DrawingSetup, DrawingNavBar}
    })
    export default class Document extends Vue {
    }
</script>
