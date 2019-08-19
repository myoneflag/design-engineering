<template>
    <b-modal id="project-setup-modal" size="xl" title="Project Setup" >
        <b-container>
            <b-row>
                <b-col cols="12">
                    <b-input size="lg" v-model="titleStaged"/>
                </b-col>
            </b-row>
            <b-row style="margin-top: 20px;">
                <b-col cols="3">
                    <label>Our Paper Size:</label>
                </b-col>
                <b-col cols="3">
                    <PaperSizeSelector initial-size="A1" :onchange="setOurPaperSize"/>
                </b-col>
            </b-row>
            <b-row style="margin-top: 20px;">
                <b-col>
                    <PreviewCanvas ref="previewCanvas" :paper-size="ourPaperSize"/>
                </b-col>
            </b-row>

            <b-row style="margin-top: 20px;">
                <b-col cols="3">
                    <label>Imported Paper Size:</label>
                </b-col>
                <b-col cols="3">
                    <PaperSizeSelector initial-size="A1" :onchange="setImportPaperSize"/>
                </b-col>
                <b-col cols="3">

                </b-col>
                <b-col cols="3">
                    <b-button variant="info" >Choose PDF</b-button>
                </b-col>
            </b-row>
            <b-row style="margin-top: 20px;">
                <b-col cols="3">
                    <label>Imported Scale:</label>
                </b-col>
                <b-col>
                    <b-form-input
                            id="input-1"
                            type="range"
                    />
                </b-col>
                <b-col cols="3">
                    <b-form-input type="text"/>
                </b-col>
            </b-row>
            <b-row>

            </b-row>
        </b-container>

    </b-modal>
</template>

<script lang="ts">
    import Component from 'vue-class-component';
    import Vue from 'vue';
    import store from "@/store/store";
    import {OTEventBus} from "@/store/document/operationTransforms";
    import PaperSizeSelector from '@/components/PaperSizeSelector.vue';
    import {DEFAULT_PAPER_SIZE, PAPER_SIZES, PaperSize} from "@/config";
    import PreviewCanvas from '@/components/PreviewCanvas.vue';
    @Component({
        components: {PreviewCanvas, PaperSizeSelector}
    })
    export default class DrawingSetup extends Vue {
        titleStaged: string = "a";

        renderedPdf: string = "";

        internalImportPaperSize: PaperSize = DEFAULT_PAPER_SIZE;

        internalOurPaperSize: PaperSize = DEFAULT_PAPER_SIZE;
        updateTitle() {
            this.titleStaged = this.$store.getters["document/title"];
        }


        get importPaperSize () {
            return this.internalImportPaperSize || DEFAULT_PAPER_SIZE;
        }
        set importPaperSize(size: PaperSize) {
            this.internalImportPaperSize = size;
            //this.renderCanvas();
        }
        setImportPaperSize(size: PaperSize) {
            this.importPaperSize = size;
        }

        get ourPaperSize() {
            console.log("Getting. our paper size internal: " + this.internalOurPaperSize);
            return this.internalOurPaperSize || DEFAULT_PAPER_SIZE;
        }
        set ourPaperSize(size: PaperSize) {
            console.log("Setting. our paper size internal: " + this.internalOurPaperSize);
            this.internalOurPaperSize = size;
            //this.renderCanvas();
        }

        setOurPaperSize(size: PaperSize) {
            console.log("Setting our paper size to " + size.width + " " + size.height);
            this.ourPaperSize = size;
        }

        mounted() {
            console.log("Mounted. tiltleStaged: " + this.titleStaged + " internal paper size: " + this.internalOurPaperSize);
            this.updateTitle();
            OTEventBus.$on("ot-applied", this.updateTitle);
        }

        renderCanvas() {
            (this.$refs["previewCanvas"] as any).draw();
        }
    }
</script>

<style lang="less">

</style>
