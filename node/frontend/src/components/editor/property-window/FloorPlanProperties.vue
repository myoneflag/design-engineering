<template>
    <b-container>
        <b-row>
            <b-col>
                <h3>{{ selectedEntity.filename }}</h3>
            </b-col>
        </b-row>

        <b-row style="margin-top: 10px">
            <b-col> Scale: {{ selectedEntity.scale }} </b-col>
        </b-row>

        <b-row style="margin-top: 10px">
            <b-col> Paper: {{ selectedEntity.paperSize.name }} </b-col>
        </b-row>

        <b-row style="margin-top: 10px">
            <b-col> Rotation: {{ selectedEntity.rotation }} </b-col>
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
                <b-button class="rotateBtn" variant="primary" @click="rotateLeft" size="large"
                    ><v-icon name="undo" scale="1.5"
                /></b-button>
            </b-col>
            <b-col cols="6">
                <b-button class="rotateBtn" variant="primary" @click="rotateRight" size="large"
                    ><v-icon name="redo" scale="1.5"
                /></b-button>
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
                <b-form-group label="Distance m" label-cols="6">
                    <b-input
                        @update="distanceChanged"
                        :value="ABDistanceMeters ? ABDistanceMeters.toFixed(2) : undefined"
                        :disabled="ABDistanceMeters === undefined"
                    >
                    </b-input>
                </b-form-group>
            </b-col>
        </b-row>

        <b-row>
            <b-col>
                <b-button
                    variant="primary"
                    :disabled="ABDistanceMeters === undefined || !changeIsValid"
                    @click="calibrate"
                    >Calibrate &nbsp;</b-button
                >
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
                    accept=".pdf"
                ></b-form-file>
            </b-col>
        </b-row>

        <b-row style="margin-top: 10px">
            <b-col>
                <b-button variant="danger" @click="onDelete" size="sm">Delete</b-button>
            </b-col>
        </b-row>
    </b-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { MainEventBus } from "../../../../src/store/main-event-bus";
import PointTool from "../../../../src/htmlcanvas/tools/point-tool";
import { DEFAULT_TOOL, POINT_TOOL } from "../../../../src/htmlcanvas/lib/tool";
import { Coord } from "../../../../src/store/document/types";
import DrawableObject from "../../../../src/htmlcanvas/lib/drawable-object";
import { BackgroundImage } from "../../../../src/htmlcanvas/objects/background-image";
import { PDFRenderResult, renderPdf } from "../../../../src/api/pdf";
import { BackgroundEntity } from "../../../../src/store/document/entities/background-entity";

@Component({
    props: {
        selectedEntity: Object,
        selectedObject: Object,
        onPointAChange: Function,
        onPointBChange: Function,
        onChange: Function,
        onDelete: Function
    }
})
export default class FloorPlanProperties extends Vue {
    EPS = 0.0001;

    file: File | null = null;
    enteredDistance: string = "";

    mounted() {
        if (this.ABDistanceMeters) {
            this.enteredDistance = this.ABDistanceMeters.toString();
        }
    }

    get pointA() {
        const background: BackgroundEntity = this.$props.selectedEntity;
        const backgroundImage: BackgroundImage = this.$props.selectedObject;

        if (background.pointA) {
            const wa: Coord = backgroundImage.toWorldCoord(background.pointA);

            return (wa.x / 1000).toFixed(2) + ", " + (wa.y / 1000).toFixed(2) + "m";
        } else {
            return "Choose";
        }
    }

    get changeIsValid() {
        try {
            if (parseFloat(this.enteredDistance) < this.EPS) {
                return false;
            }
            if (!this.ABDistanceMeters) {
                return false;
            }
            return Math.abs(this.ABDistanceMeters - parseFloat(this.enteredDistance)) > this.EPS;
        } catch {
            return false;
        }
    }

    get pointB() {
        const background: BackgroundEntity = this.$props.selectedEntity;
        const backgroundImage: BackgroundImage = this.$props.selectedObject;

        if (background.pointB) {
            const wb: Coord = backgroundImage.toWorldCoord(background.pointB);

            return (wb.x / 1000).toFixed(2) + ", " + (wb.y / 1000).toFixed(2) + "m";
        } else {
            return "Choose";
        }
    }

    onReplacePdf() {
        const background: BackgroundEntity = this.$props.selectedEntity;
        if (this.file) {
            renderPdf(this.file).then((res) => {
                if (res.success) {
                    background.uri = res.data.uri;
                    background.filename = this.file!.name;
                    this.$props.onChange();
                    this.$store.dispatch("document/commit");
                } else {
                    this.$bvToast.toast(res.message, {
                        title: "Error Replacing Background",
                        variant: "danger"
                    });
                }
            });
        }
    }

    distanceChanged(value: string) {
        this.enteredDistance = value;
    }

    calibrate() {
        const background: BackgroundEntity = this.$props.selectedEntity;

        if (this.ABDistanceMeters) {
            const factor = parseFloat(this.enteredDistance) / this.ABDistanceMeters;

            this.background.scaleFactor *= factor;

            this.$props.onChange();
            this.$store.dispatch("document/commit");
        }
    }

    get ABDistanceMeters() {
        const background: BackgroundEntity = this.$props.selectedEntity;
        const backgroundImage: BackgroundImage = this.$props.selectedObject;

        if (background.pointA && background.pointB) {
            const wa: Coord = backgroundImage.toWorldCoord(background.pointA);
            const wb: Coord = backgroundImage.toWorldCoord(background.pointB);

            return Math.sqrt((wa.x - wb.x) ** 2 + (wa.y - wb.y) ** 2) / 1000;
        }
    }

    get background(): BackgroundEntity {
        return this.$props.selectedEntity;
    }

    rotateLeft() {
        this.background.rotation = (((this.background.rotation - 45) % 360) + 360) % 360;
        this.$props.onChange();
        this.$store.dispatch("document/commit");
    }

    rotateRight() {
        this.background.rotation = (((this.background.rotation + 45) % 360) + 360) % 360;
        this.$props.onChange();
        this.$store.dispatch("document/commit");
    }

    deployPointTool(onPoint: (worldCoord: Coord) => void) {
        // Very verbose :( But this is to keep tool configs reactive in the vue state, while
        // still having a tool handler object.
        MainEventBus.$emit(
            "set-tool-handler",
            new PointTool(
                () => {
                    MainEventBus.$emit("set-tool-handler", null);
                },
                () => {
                    /* asdf */
                },
                (worldCoord: Coord) => {
                    onPoint(worldCoord);
                },
                "Set Point"
            )
        );
    }

    pointAClick() {
        this.deployPointTool((worldCoord: Coord) => {
            const d: DrawableObject = this.$props.selectedObject;
            this.background.pointA = d.toObjectCoord(worldCoord);

            this.$props.onChange();
            this.$store.dispatch("document/commit");
        });
    }

    pointBClick() {
        this.deployPointTool((worldCoord: Coord) => {
            const d: DrawableObject = this.$props.selectedObject;
            this.background.pointB = d.toObjectCoord(worldCoord);

            this.$props.onChange();
            this.$store.dispatch("document/commit");
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

    &:before,
    &:after {
        position: absolute;
        top: 51%;
        overflow: hidden;
        width: 50%;
        height: 1px;
        content: "\a0";
        background-color: lightgray;
    }

    &:before {
        margin-left: -50%;
        text-align: right;
    }
}
</style>
