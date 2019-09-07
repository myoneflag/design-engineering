<template>
    <div>
        <DrawingNavBar></DrawingNavBar>
        <DrawingCanvas :document="document"/>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue';
    import Component from 'vue-class-component';
    import DrawingNavBar from '../components/DrawingNavBar.vue';
    import DrawingCanvas from '@/components/editor/DrawingCanvas.vue';
    import {State} from 'vuex-class';
    import {DocumentState} from '@/store/document/types';

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

