<template>
    <b-modal id="project-setup-modal" size="xl" title="Project Setup" @ok="handleAccept">
        <b-container>
            <b-row>
                <b-col cols="12">
                    <b-input size="lg" v-model="titleStaged"/>
                </b-col>
            </b-row>
            <PaperSettings title="Our Paper:"
                           :on-paper-size-change="setOurPaperSize"
                           :on-scale-change="setOurPaperScale"
                           :paper-size="this.initialPaperSize"
                           :scale="this.initialPaperScale"
            />
            <PaperSettings title="Imported PDF:" :disabled='renderedPdf === ""'
                           :on-paper-size-change="setImportedPaperSize"
                           :on-scale-change="setImportedPaperScale"
                           :paper-size="this.initialPdfSize"
                           :scale="this.initialPdfScale"
            />

            <b-row style="margin-top: 20px;">
                <b-col>
                    <PreviewCanvas ref="previewCanvas"
                                   :paper-size="ourPaperSize"
                                   :paper-scale="ourPaperScaleL + ':' + ourPaperScaleR"
                                   :background-uri="renderedPdf"
                                   :pdf-scale="importedPaperScaleL + ':' + importedPaperScaleR"
                                   :pdf-size="importedPaperSize"
                                   :on-background-update="onBackgroundUpdate"

                                   :initial-background-center-x="initialBackgroundCenterX"
                                   :initial-background-center-y="initialBackgroundCenterY"
                                   :initial-crop="initialCrop"
                    />
                </b-col>
            </b-row>

            <b-row style="margin-top: 20px;">
                <b-col>

                </b-col>
                <b-col cols="3">
                    <b-button variant="primary" @click="uploadPdfClick">
                        Upload PDF Background
                    </b-button>
                </b-col>
                <b-col>

                </b-col>
            </b-row>
        </b-container>

    </b-modal>
</template>

<script lang="ts">
    import Component from 'vue-class-component';
    import Vue from 'vue';
    import store from "@/store/store";
    import {OTEventBus} from "@/store/document/operationTransforms";
    import PaperSizeSelector from '@/components/PaperSizePicker.vue';
    import {DEFAULT_PAPER_SIZE, PAPER_SIZES, PaperSize} from "@/config";
    import PreviewCanvas, { BackgroundState } from "@/components/PreviewCanvas.vue";
    import PaperSettings from '@/components/PaperSettings.vue';
    @Component({
        components: { PaperSettings, PreviewCanvas, PaperSizeSelector},
        props: {
            initialPdfSize: String,
            initialPaperSize: String,
            initialPdfScale: String,
            initialPaperScale: String,

            initialBackgroundCenterX: Number,
            initialBackgroundCenterY: Number,
            initialBackgroundUri: String,
            initialCrop: Object,
        }
    })
    export default class DrawingSetup extends Vue {
        titleStaged: string = "a";

        renderedPdf: string = "";

        internalImportedPaperSize: PaperSize = DEFAULT_PAPER_SIZE;

        internalOurPaperSize: PaperSize = DEFAULT_PAPER_SIZE;
        updateTitle() {
            this.titleStaged = this.$store.getters["document/title"];
        }


        get importedPaperSize () {
            return this.internalImportedPaperSize || DEFAULT_PAPER_SIZE;
        }
        set importedPaperSize(size: PaperSize) {
            this.internalImportedPaperSize = size;
            //this.renderCanvas();
        }
        setImportedPaperSize(size: PaperSize) {
            this.importedPaperSize = size;
        }

        importedPaperScaleL = 1;
        importedPaperScaleR = 100;
        setImportedPaperScale(l: number, r: number) {
            this.importedPaperScaleL = l;
            this.importedPaperScaleR = r;
        }

        get ourPaperSize() {
            console.log("Getting. our paper size internal: " + this.internalOurPaperSize);
            return this.internalOurPaperSize || DEFAULT_PAPER_SIZE;
        }
        set ourPaperSize(size: PaperSize) {
            console.log("Setting. our paper size internal: " + this.internalOurPaperSize);
            this.internalOurPaperSize = size;
        }

        ourPaperScaleL:number = 1;
        ourPaperScaleR:number = 100;
        setOurPaperScale(l:number, r:number) {
            this.ourPaperScaleL = l;
            this.ourPaperScaleR = r;
        }

        setOurPaperSize(size: PaperSize) {
            console.log("Setting our paper size to " + size.width + " " + size.height);
            this.ourPaperSize = size;
        }

        mounted() {
            console.log("Mounted. tiltleStaged: " + this.titleStaged + " internal paper size: " + this.internalOurPaperSize);
            this.updateTitle();
            this.renderedPdf = this.$props.initialBackgroundUri;
            OTEventBus.$on("ot-applied", this.updateTitle);
        }

        /**
         * TODO: actually upload PDF. right now, it just pretends.
         */
        uploadPdfClick(event: Event) {
            console.log("Rendered PDF done");
            this.renderedPdf = "https://conversionxl.com/wp-content/uploads/2013/03/blueprint-architecture.png";
        }

        backgroundState: BackgroundState = {
            centerX: 0,
            centerY: 0,
            crop: {h: 0, w: 0, x: 0, y: 0},
            paper: "",
            paperScale: "",
            scale: 0,
            uri: ""
        };
        onBackgroundUpdate(payload: BackgroundState) {
            this.backgroundState = payload;
        }

        handleAccept(event: Event) {
            // WE ACCEPTED THE FORM!
            // FINALLY! FIRE THE OPERATIONS!
            this.$store.dispatch('document/setTitle', this.titleStaged);

            this.$store.dispatch('document/setBackground', this.backgroundState);

            this.$store.dispatch('document/setPaper', {name: this.ourPaperSize.name, scale: this.ourPaperScaleL + ':' + this.ourPaperScaleR });
        }
    }
</script>

<style lang="less">

</style>
