<template>
    <b-container>
        <b-row>
            <b-col>
                <h3>Floor Plan</h3>
            </b-col>
        </b-row>

        <b-row style="margin-top: 10px">
            <b-col>
                Scale: {{ selectedObject.scale }}
            </b-col>
        </b-row>


        <b-row style="margin-top: 10px">
            <b-col>
                Paper: {{ selectedObject.paperSize.name }}
            </b-col>
        </b-row>

        <b-row style="margin-top: 10px">
            <b-col>
                Rotation: {{ selectedObject.rotation }}
            </b-col>
        </b-row>

        <b-row>
            <b-col>
                <h5 class="sidebar-title">
                    &nbsp;Rotate&nbsp;
                </h5>
            </b-col>
        </b-row>

        <b-row style="margin-top: 10px">
            <b-col cols="6">
                <b-button class="rotateBtn" variant="primary" @click="rotateLeft" size="large"><v-icon name="undo" scale="1.5"/></b-button>
            </b-col>
            <b-col cols="6">
                <b-button class="rotateBtn" variant="primary" @click="rotateRight" size="large"><v-icon name="redo" scale="1.5"/></b-button>
            </b-col>
        </b-row>

        <b-row style="margin-top: 20px;">
            <b-col>
                <h5 class="sidebar-title">
                    &nbsp;Scale&nbsp;
                </h5>
            </b-col>
        </b-row>

        <b-row>
            <b-col cols="4">
                {{ pointA }}
            </b-col>
            <b-col cols="2" style="padding-right: 5px; padding-left: 0px;">
                <b-button class="rotateBtn" variant="primary" @click="pointAClick" pill>A</b-button>
            </b-col>
            <b-col cols="2" style="padding-left: 5px; padding-right: 0px;">
                <b-button class="rotateBtn" variant="primary" @click="pointBClick" pill>B</b-button>
            </b-col>
            <b-col cols="4">
                {{ pointB }}
            </b-col>
        </b-row>

        <b-row style="padding-top:10px;">
            <b-col cols="12">

                <b-form-group
                        label="Distance m"
                        label-cols="6"
                >
                    <b-input @update="distanceChanged" :value="ABDistanceMeters? ABDistanceMeters.toFixed(2) : undefined" :disabled="ABDistanceMeters === undefined">

                    </b-input>
                </b-form-group>

            </b-col>
        </b-row>

        <b-row>
            <b-col>
                <b-button variant="primary" :disabled="ABDistanceMeters === undefined || !changeIsValid" @click="calibrate">Calibrate &nbsp;</b-button>
            </b-col>
        </b-row>

        <b-row style="margin-top: 20px;">
            <b-col>
                <h5 class="sidebar-title">
                    &nbsp;PDF&nbsp;
                </h5>
            </b-col>
        </b-row>

        <b-row style="margin-top: 10px">
            <b-col>
                <b-form-file
                        v-model="file"
                        :state="Boolean(file)"
                        browse-text="Click to replace current PDF"
                        size="sm"
                        @input="onReplacePdf"
                ></b-form-file>
            </b-col>
        </b-row>

        <b-row style="margin-top: 10px">
            <b-col>
                <b-button variant="danger" @click="onDeleteClick" size="sm">Delete</b-button>
            </b-col>
        </b-row>
    </b-container>
</template>

<script lang="ts">
    import Vue from 'vue';
    import Component from "vue-class-component";
    import {MainEventBus} from "@/store/main-event-bus";
    import PointTool from "@/htmlcanvas/tools/point-tool";
    import {DEFAULT_TOOL, POINT_TOOL} from "@/htmlcanvas/tools/tool";
    import {Background, Coord} from "@/store/document/types";
    import DrawableObject from "@/htmlcanvas/components/drawable-object";
    import store from '@/store/store';
    import {BackgroundImage} from "@/htmlcanvas/components/background-image";
    import {PDFRenderResult, renderPdf} from "@/api/pdf";

    @Component({
        props: {
            selectedObject: Object,
            selectedDrawable: Object,
            onPointAChange: Function,
            onPointBChange: Function
        },
    })
    export default class FloorPlanProperties extends Vue {
        EPS = 0.0001;

        file: File | null = null;

        onDeleteClick() {
            this.$store.dispatch('document/deleteBackground', this.$props.selectedObject);
        }

        mounted() {
            if (this.ABDistanceMeters) {
                this.enteredDistance = this.ABDistanceMeters.toString();
            }
        }

        get pointA() {
            const background: Background = this.$props.selectedObject;
            const backgroundImage: BackgroundImage = this.$props.selectedDrawable;

            if (background.pointA) {

                const wa: Coord = backgroundImage.toWorldCoord(background.pointA);

                return (wa.x / 1000).toFixed(2) + ", " + (wa.y / 1000).toFixed(2) + "m";
            } else {
                return "Choose";
            }
        }

        get changeIsValid() {
            try {
                if (parseFloat(this.enteredDistance) < this.EPS) return false;
                if (!this.ABDistanceMeters) return false;
                return Math.abs(this.ABDistanceMeters - parseFloat(this.enteredDistance)) > this.EPS;
            } catch {
                return false;
            }
        }

        get pointB() {
            const background: Background = this.$props.selectedObject;
            const backgroundImage: BackgroundImage = this.$props.selectedDrawable;

            if (background.pointB) {

                const wb: Coord = backgroundImage.toWorldCoord(background.pointB);

                return (wb.x / 1000).toFixed(2) + ", " + (wb.y / 1000).toFixed(2) + "m";
            } else {
                return "Choose";
            }
        }

        onReplacePdf(event: Event) {
            console.log("PDF upload: " + this.file);
            const backgroundObject: BackgroundImage = this.$props.selectedDrawable;
            const background: Background = this.$props.selectedObject;
            if (this.file) {
                renderPdf(this.file, (data: PDFRenderResult) => {
                    this.$store.dispatch("document/updateBackgroundInPlace", {background, update: (background: Background) => ({
                        uri: data.uri,
                        })
                    });
                });
            }
        }

        enteredDistance: string = "";
        distanceChanged(value: string) {
            this.enteredDistance = value;
        }

        calibrate() {
            const background: Background = this.$props.selectedObject;
            const backgroundImage: BackgroundImage = this.$props.selectedDrawable;

            if (this.ABDistanceMeters) {
                const factor = parseFloat(this.enteredDistance)/ this.ABDistanceMeters;

                console.log("Scaling background by " + factor);
                this.$store.dispatch('document/scaleBackground', {background, factor});
            }

        }

        get ABDistanceMeters() {
            const background: Background = this.$props.selectedObject;
            const backgroundImage: BackgroundImage = this.$props.selectedDrawable;

            if (background.pointA && background.pointB) {
                const wa: Coord = backgroundImage.toWorldCoord(background.pointA);
                const wb: Coord = backgroundImage.toWorldCoord(background.pointB);

                return Math.sqrt((wa.x - wb.x) ** 2 + (wa.y - wb.y) ** 2) / 1000;
            }
        }

        rotateLeft() {
            this.$store.dispatch('document/updateBackgroundInPlace',
                {background: this.$props.selectedObject,
                    update: (background: Background) => ({rotation: ((background.rotation -45) % 360 + 360) % 360 })
                });
        }

        rotateRight() {
            this.$store.dispatch('document/updateBackgroundInPlace',
                {background: this.$props.selectedObject,
                    update: (background: Background) => ({ rotation: ((background.rotation +45) % 360 + 360) % 360 })
                });
        }

        deployPointTool(onPoint: (worldCoord: Coord) => void) {
            // Very verbose :( But this is to keep tool configs reactive in the vue state, while
            // still having a tool handler object.
            this.$store.dispatch('tools/setCurrentTool', POINT_TOOL).then(() => {
                MainEventBus.$emit('set-tool-handler', new PointTool(
                    () => {
                        this.$store.dispatch('tools/setCurrentTool', POINT_TOOL);
                        MainEventBus.$emit('set-tool-handler', null);
                    },
                    (worldCoord: Coord) => {

                        store.dispatch('tools/setCurrentTool', DEFAULT_TOOL);
                        store.dispatch('tools/setToolHelper', null);

                        onPoint(worldCoord);
                    },
                ))
            });
        }

        pointAClick() {
            this.deployPointTool((worldCoord: Coord) => {
                let d: DrawableObject = this.$props.selectedDrawable;
                this.$store.dispatch('document/updateBackgroundInPlace',
                    {background: this.$props.selectedObject,
                        update: (background: Background) => ({ pointA: d.toObjectCoord(worldCoord)}),
                    });
            });
        }

        pointBClick() {
            this.deployPointTool((worldCoord: Coord) => {
                let d: DrawableObject = this.$props.selectedDrawable;
                this.$store.dispatch('document/updateBackgroundInPlace',
                    {background: this.$props.selectedObject,
                        update: (background: Background) => ({ pointB: d.toObjectCoord(worldCoord)}),
                    });
            });
        }
    }



</script>

<style lang="less">
    .rotateBtn {
        width: 100%;
    }

    .sidebar-title {

        position: relative;
        font-size: 30px;
        z-index: 1;
        overflow: hidden;
        text-align: center;

        &:before, &:after {
            position: absolute;
            top: 51%;
            overflow: hidden;
            width: 50%;
            height: 1px;
            content: '\a0';
            background-color: lightgray;
        }

        &:before {
            margin-left: -50%;
            text-align: right;
        }
    }
</style>

