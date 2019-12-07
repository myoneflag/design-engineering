<template>
    <drawing-canvas/>
</template>
<script lang="ts">
    import Vue from 'vue';
    import Component from 'vue-class-component';
    import DrawingCanvas from '../../src/components/editor/DrawingCanvas.vue';
    @Component({
        components: {DrawingCanvas},
    })
    export default class Canvas extends Vue {
    }
</script>
