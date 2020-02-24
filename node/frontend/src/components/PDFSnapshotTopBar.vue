<template>
    <b-row style="position:fixed; left:300px; top:80px;">
        <b-col class="col-auto">
            <PaperSizePicker v-model="document.uiState.exportSettings.paperSize" @input="redraw"/>
        </b-col>
        <b-col class="col-auto">
            <b-form-group label-cols="4" label="Detail">
                <b-form-input
                    type="range"
                    @input="redraw"
                    v-model="document.uiState.exportSettings.detail"
                    min="-15"
                    max="15"
                >
                </b-form-input>
            </b-form-group>
        </b-col>
        <b-col class="col-auto">
            <ScalePicker v-model="document.uiState.exportSettings.scale" @input="redraw"/>
        </b-col>
        <b-col class="col-auto">
            <b-btn :disabled="true" variant="outline-dark" style="background-color: white; opacity: 100%" >
                <b-checkbox v-model="document.uiState.exportSettings.coverSheet" :disabled="!supportsCoverSheet">Inc. Cover Sheet</b-checkbox>
            </b-btn>
            <b-btn :disabled="true" variant="outline-dark" style="background-color: white; opacity: 100%" >
                <b-checkbox v-model="document.uiState.exportSettings.floorPlans">Inc. Floor Plans</b-checkbox>
            </b-btn>
        </b-col>
        <b-col class="col-auto">
            <b-button-group>
                <b-button variant="success" @click="exportPdfCurrent" id="export-pdf-btn" :disabled="exporting">
                    <b-spinner style="width: 1em; height: 1em;" v-if="exporting && !allLevels"></b-spinner> Export This Level
                </b-button>
                <b-tooltip target="export-pdf-btn" v-if="exporting" triggers="hover">Downloading full resolution assets</b-tooltip>
                <b-button variant="success" @click="exportPdfAll" id="export-all-pdf-btn" :disabled="exporting">
                    <b-spinner style="width: 1em; height: 1em;" v-if="exporting && allLevels"></b-spinner> Export All Levels
                </b-button>
                <b-tooltip target="export-pdf-btn" v-if="exporting" triggers="hover">Downloading full resolution assets</b-tooltip>
            </b-button-group>
        </b-col>
        <b-col>
            <b-button variant="secondary" @click="cancel">
                Cancel
            </b-button>
        </b-col>
    </b-row>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import PaperSizePicker from "./editor/PaperSizePicker.vue";
    import { COVER_SHEET_SUPPORTED, PAPER_SIZES } from "../../../common/src/api/paper-config";
    // @ts-ignore
    import * as C2S from '../../custom-modules/canvas2svg/canvas2svg';

    import CanvasContext from "../htmlcanvas/lib/canvas-context";
    import * as TM from 'transformation-matrix';
    import { MainEventBus } from "../store/main-event-bus";
    import { MatrixDescriptor } from "transformation-matrix/fromDefinition";
    import { DocumentState } from "../store/document/types";
    import ScalePicker from "./editor/ScalePicker.vue";
    import { exportPdf } from "../htmlcanvas/lib/pdf-export/export-pdf";
    import PdfSnapshotTool from "../htmlcanvas/tools/pdf-snapshot-tool";
    import { ViewPort } from "../htmlcanvas/viewport";

    @Component({
        components: { ScalePicker, PaperSizePicker },
        props: {
            canvasContext: Object,
            toolHandler: Object,
        }
    })
    export default class PDFSnapshotTopBar extends Vue {
        exporting = false;
        allLevels = false;

        async exportPdf(allLevels: boolean) {
            this.allLevels = allLevels;
            if (!(this.$props.toolHandler instanceof PdfSnapshotTool)) {
                throw new Error('No pdf snapshot tool present');
            }

            const canvasContext = this.$props.canvasContext as CanvasContext;

            const newVp = canvasContext.viewPort.copy();
            const sr = this.$props.toolHandler.lastScreenMarginRect;

            newVp.panAbs(sr.x, sr.y);
            const xdiff = newVp.width - sr.w;
            const ydiff = newVp.height - sr.h;
            newVp.width = sr.w;
            newVp.height = sr.h;

            // panning and adjusting width is about the center, so account for that.
            newVp.panAbs(-xdiff / 2, -ydiff / 2);

            this.exporting = true;

            try {
                await exportPdf(
                    this.$props.canvasContext,
                    newVp,
                    {
                        paperSize: this.document.uiState.exportSettings.paperSize,
                        scaleName: this.document.uiState.exportSettings.scale,
                        coverSheet: this.document.uiState.exportSettings.coverSheet && this.supportsCoverSheet,
                        floorPlans: this.document.uiState.exportSettings.floorPlans,
                        allLevels,
                    }
                );
            } catch (e) {
                this.exporting = false;
                throw (e);
            }

            this.exporting = false;
            MainEventBus.$emit('set-tool-handler', null);
        }

        async exportPdfCurrent() {
            await this.exportPdf(false);
        }

        async exportPdfAll() {
            await this.exportPdf(true);
        }

        get document(): DocumentState {
            return this.$store.getters['document/document'];
        }

        get supportsCoverSheet() {
            return COVER_SHEET_SUPPORTED.includes(this.document.uiState.exportSettings.paperSize.name);
        }

        cancel() {
            MainEventBus.$emit('set-tool-handler', null);
        }

        redraw() {
            if (!this.supportsCoverSheet) {
                this.document.uiState.exportSettings.coverSheet = false;
            }

            this.$props.canvasContext.scheduleDraw();
            setTimeout(() =>
                this.$props.canvasContext.scheduleDraw(), 100);
        }

    }
</script>

<style lang="less">
    .calculationBtn {
        height: 45px;
        min-width: 60px;
        font-size: 12px;
        background-color: white;
    }
</style>
