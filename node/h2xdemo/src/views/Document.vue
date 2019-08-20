<template>
    <div>
        <DrawingNavBar></DrawingNavBar>
        <DrawingSetup
                :initial-paper-scale="this.$store.state.document.drawing.paper.scale"

                :initial-paper-size="this.$store.state.document.drawing.paper.name"
                :initial-pdf-scale="this.$store.state.document.drawing.background.paperScale"
                :initial-pdf-size="this.$store.state.document.drawing.background.paper"
                :initial-crop="crop"

                :initial-background-center-x="centerX"
                :initial-background-center-y="centerY"
        />
        <DrawingCanvas/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import DrawingNavBar from "../components/DrawingNavBar.vue";
    import DrawingSetup from '@/components/DrawingSetup.vue';
    import DrawingCanvas from '@/components/DrawingCanvas.vue';

    @Component({
        components: {DrawingCanvas, DrawingSetup, DrawingNavBar},
    })
    export default class Document extends Vue {
        getInitialCrop() {
            if (this.$store.state.document.drawing.background.uri != "") {
                return this.$store.state.document.drawing.background.crop;
            } else {
                return undefined;
            }
        }

        get centerX() {
            if (this.$store.state.document.drawing.background.uri != "") {
                return this.$store.state.document.drawing.background.centerX;
            }
        }

        get centerY() {
            if (this.$store.state.document.drawing.background.uri != "") {
                return this.$store.state.document.drawing.background.centerY;
            }
        }

        get crop() {
            if (this.$store.state.document.drawing.background.uri != "") {
                return this.$store.state.document.drawing.background.crop;
            }
        }
    }
/*

 */
</script>

