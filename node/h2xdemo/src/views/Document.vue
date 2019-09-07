<template>
    <div>
        <DrawingNavBar></DrawingNavBar>
        <DrawingCanvas/>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue';
    import Component from 'vue-class-component';
    import DrawingNavBar from '../components/DrawingNavBar.vue';
    import DrawingCanvas from '@/components/editor/DrawingCanvas.vue';

    @Component({
        components: {DrawingCanvas, DrawingNavBar},
    })
    export default class Document extends Vue {

        get document() {
            return this.$store.getters['document/document'];
        }
    }
/*

 */
</script>

