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
                <b-form-group :label="`Distance ${lengthUnits}`" label-cols="6">
                    <b-input
                        @update="distanceChanged"
                        :value="ABDistance ? ABDistance.toFixed(2) : undefined"
                        :disabled="ABDistance === undefined"
                    >
                    </b-input>
                </b-form-group>
            </b-col>
        </b-row>

        <b-row>
            <b-col>
                <b-button
                    variant="primary"
                    :disabled="ABDistance === undefined || !changeIsValid"
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
import DrawableObject from "../../../../src/htmlcanvas/lib/drawable-object";
import { BackgroundImage } from "../../../../src/htmlcanvas/objects/background-image";
import { renderPdf } from "../../../../src/api/pdf";
import { BackgroundEntity } from "../../../../../common/src/api/document/entities/background-entity";
import { Coord } from "../../../../../common/src/api/document/drawing";
import { convertMeasurementSystem, Units } from "../../../../../common/src/lib/measurements";
import { DocumentState } from "../../../store/document/types";

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
        if (this.ABDistance) {
            this.enteredDistance = this.ABDistance.toString();
        }
    }

    get document(): DocumentState {
      return this.$store.getters["document/document"];
    }

    get lengthUnits() {
      const [units] = convertMeasurementSystem(this.document.drawing.metadata.units, Units.Meters, null);
      return units;
    }

    get pointA() {
        const background: BackgroundEntity = this.$props.selectedEntity;
        const backgroundImage: BackgroundImage = this.$props.selectedObject;

        if (background.pointA) {
            const wa: Coord = backgroundImage.toWorldCoord(background.pointA);

            const [units, xConverted] =
                convertMeasurementSystem(this.document.drawing.metadata.units, Units.Meters, wa.x / 1000);
            const [_, yConverted] =
                convertMeasurementSystem(this.document.drawing.metadata.units, Units.Meters, wa.y / 1000);

            return (xConverted as number).toFixed(2) + ", " + (yConverted as number).toFixed(2) + units;
        } else {
            return "Choose";
        }
    }

    get changeIsValid() {
        try {
            if (parseFloat(this.enteredDistance) < this.EPS) {
                return false;
            }
            if (!this.ABDistance) {
                return false;
            }
            return Math.abs(this.ABDistance - parseFloat(this.enteredDistance)) > this.EPS;
        } catch {
            return false;
        }
    }

    get pointB() {
        const background: BackgroundEntity = this.$props.selectedEntity;
        const backgroundImage: BackgroundImage = this.$props.selectedObject;

        if (background.pointB) {
            const wa: Coord = backgroundImage.toWorldCoord(background.pointB);

            const [units, xConverted] =
                convertMeasurementSystem(this.document.drawing.metadata.units, Units.Meters, wa.x / 1000);
            const [_, yConverted] =
                convertMeasurementSystem(this.document.drawing.metadata.units, Units.Meters, wa.y / 1000);

            return (xConverted as number).toFixed(2) + ", " + (yConverted as number).toFixed(2) + units;
        } else {
            return "Choose";
        }
    }

    onReplacePdf() {
        const background: BackgroundEntity = this.$props.selectedEntity;
        if (this.file) {
            renderPdf(this.file).then((res) => {
                if (res.success) {
                    background.key = res.data.key;
                    background.filename = this.file!.name;
                    this.$props.onChange();
                    this.$store.dispatch("document/validateAndCommit");
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

        if (this.ABDistance) {
            const factor = parseFloat(this.enteredDistance) / this.ABDistance;

            this.background.scaleFactor *= factor;

            this.$props.onChange();
            this.$store.dispatch("document/validateAndCommit");
        }
    }

    get ABDistance() {
        const background: BackgroundEntity = this.$props.selectedEntity;
        const backgroundImage: BackgroundImage = this.$props.selectedObject;

        if (background.pointA && background.pointB) {
            const wa: Coord = backgroundImage.toWorldCoord(background.pointA);
            const wb: Coord = backgroundImage.toWorldCoord(background.pointB);

            const distM = Math.sqrt((wa.x - wb.x) ** 2 + (wa.y - wb.y) ** 2) / 1000;

            const [units, converted] =
                convertMeasurementSystem(this.document.drawing.metadata.units, Units.Meters, distM);
            return converted as number;
        }
    }

    get background(): BackgroundEntity {
        return this.$props.selectedEntity;
    }

    rotateLeft() {
        this.background.rotation = (((this.background.rotation - 45) % 360) + 360) % 360;
        this.$props.onChange();
        this.$store.dispatch("document/validateAndCommit");
    }

    rotateRight() {
        this.background.rotation = (((this.background.rotation + 45) % 360) + 360) % 360;
        this.$props.onChange();
        this.$store.dispatch("document/validateAndCommit");
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
            this.$store.dispatch("document/validateAndCommit");
        });
    }

    pointBClick() {
        this.deployPointTool((worldCoord: Coord) => {
            const d: DrawableObject = this.$props.selectedObject;
            this.background.pointB = d.toObjectCoord(worldCoord);

            this.$props.onChange();
            this.$store.dispatch("document/validateAndCommit");
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
