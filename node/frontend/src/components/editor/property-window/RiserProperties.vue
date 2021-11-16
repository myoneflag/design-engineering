<template>
    <b-container>
        <b-row>
            <b-col>
                <h3>{{name}}</h3>
            </b-col>
        </b-row>
        <PropertiesFieldBuilder
            :fields="fields"
            :reactive-data="reactiveData"
            :default-data="defaultData"
            :on-commit="onCommit"
            :on-change="onChange"
            :target="targetProperty"
        >
            <template v-for="slot in ['topHeightM', 'bottomHeightM']" v-slot:[slot]="{field}">
                <b-input-group size="sm" :key="slot">
                    <b-form-input
                        :value="getHeightBySelectedFloor(field)"
                        @input="setRealHeight(field, $event)"
                        :id="'input-' + field.property"
                        :min="field.params.min == null ? undefined : convertValueToUnits(field.units, field.params.min)"
                        :max="field.params.max == null ? undefined : convertValueToUnits(field.units, field.params.max)"
                        type="number"
                        :placeholder="'Enter ' + field.title"
                        :disabled="isDisabled(field)"
                        @blur="onCommitInternal"
                    ></b-form-input>
                    <b-input-group-append>
                        <b-dropdown :text="selectedLevel[slot].name" size="sm" variant="info" class="riserLevelDropdown">
                            <b-dropdown-item 
                                v-for="level in levelsToOptions" :key="level.text"
                                :active="level.value === selectedLevelUidByProp[slot]"
                                @click="selectedLevelUidByProp[slot] = level.value"
                            >
                                {{ level.text }}
                            </b-dropdown-item>
                        </b-dropdown>
                    </b-input-group-append>
                </b-input-group>
            </template>
        </PropertiesFieldBuilder>
        <b-row>
            <b-col>
                <b-button size="sm" variant="danger" @click="onDelete">
                    Delete
                </b-button>
            </b-col>
        </b-row>
    </b-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import PropertiesFieldBuilder from "../../../../src/components/editor/lib/PropertiesFieldBuilder.vue";
import { fillRiserDefaults, makeRiserFields } from "../../../../../common/src/api/document/entities/riser-entity";
import { DocumentState } from "../../../../src/store/document/types";
import {getEntityName} from "../../../../../common/src/api/document/entities/types";
import { PropertyField } from "../../../../../common/src/api/document/entities/property-field";
import { convertMeasurementSystem, convertMeasurementToMetric, Units } from "../../../../../common/src/lib/measurements";
import { getPropertyByString, setPropertyByString } from "../../../lib/utils";
import { DrawingMode } from "../../../htmlcanvas/types";
import { Level } from "../../../../../common/src/api/document/drawing";

@Component({
    components: { PropertiesFieldBuilder },
    props: {
        selectedEntity: Object,
        selectedObject: Object,
        targetProperty: String,
        onDelete: Function,
        onChange: Function
    }
})
export default class RiserProperties extends Vue {
    numberProxy = {} as any;

    selectedLevelUidByProp: { [key: string]: string } = {
        topHeightM: 'ground',
        bottomHeightM: 'ground'
    }

    created() {
        const levels = this.document.drawing.levels;
        const goal = this.reactiveData.topHeightM || this.defaultData.topHeightM;

        const topHeightClosestLevel = Object.values(levels).reduce((prev, curr) => {
            const currentValue = goal - curr.floorHeightM;
            return (currentValue < (goal - prev.floorHeightM) && currentValue >= 0 ? curr : prev);
        });

        this.selectedLevelUidByProp.topHeightM = topHeightClosestLevel.uid;
    }

    get levels(): Level[] {
        return this.$store.getters["document/sortedLevels"].slice().reverse();
    }

    get levelsToOptions() {
        return Object.values(this.levels)
            .map((level: Level) => ({
                value: level.uid,
                text: level.name,
            }));
    }

    get selectedLevel(): {[key: string]: Level} {
        const levels = this.document.drawing.levels;

        return {
            topHeightM: levels[this.selectedLevelUidByProp.topHeightM],
            bottomHeightM: levels[this.selectedLevelUidByProp.bottomHeightM],
        }
    }

    get fields() {
        return makeRiserFields(
            this.$props.selectedEntity,
            this.$store.getters["catalog/default"],
            this.document.drawing,
            this.defaultData,
        );
    }

    get name() {
        if (this.$props.selectedEntity.isVent) {
            return "Vertical Vent";
        }
        return getEntityName(this.$props.selectedEntity);
    }

    get reactiveData() {
        return this.$props.selectedEntity;
    }

    get document(): DocumentState {
        return this.$store.getters["document/document"];
    }

    get defaultData() {
        return fillRiserDefaults(this.document.drawing, this.reactiveData);
    }

    get readonly() {
        return this.document.uiState.viewOnly || this.document.uiState.drawingMode === DrawingMode.History;
    }

    onCommit() {
        this.$store.dispatch("document/validateAndCommit");
    }

    onCommitInternal() {
        this.numberProxy = {} as any;
        this.onCommit();
    }
    
    isDisabled(field: PropertyField) {
        if (this.readonly) {
            return true;
        }
        if (field.readonly) {
            return true;
        }
        if (field.requiresInput) {
            return false;
        }
        return (
            getPropertyByString(this.reactiveData, field.property, true) == null &&
            (field.isCalculated || field.hasDefault)
        );
    }

    convertUnits(field: PropertyField): Units {
        if (field.units) {
            const val = convertMeasurementSystem(
                this.document.drawing.metadata.units,
                field.units,
                this.renderedData(field.property),
            );
            return val[0];
        } else {
            throw new Error('No units to convert');
        }
    }

    convertValueToUnits(curr: Units | undefined, value: number) {
        if (!curr) {
            return value;
        }

        const val = convertMeasurementSystem(
            this.document.drawing.metadata.units,
            curr,
            value,
        );
        return val[1];
    }

    renderedData(property: string): any {
        if (getPropertyByString(this.numberProxy, property, true) != null) {
            return getPropertyByString(this.numberProxy, property);
        }
        if (getPropertyByString(this.reactiveData, property) == null) {
            return getPropertyByString(this.defaultData, property);
        } else {
            return getPropertyByString(this.reactiveData, property);
        }
    }

    setRenderedData(field: PropertyField, val: any, commit: boolean = false) {
        if (this.isDisabled(field) && field.requiresInput !== true) {
            // don't do it, unless it's a required input, which allows inputs.
        } else {
            setPropertyByString(this.reactiveData, field.property, val);
            if (this.$props.onChange) {
                this.$props.onChange();
            }
        }

        if (commit) {
            this.onCommit();
        }
    }

    setRenderedDataNumeric(field: PropertyField, value: any) {
        if (!isNaN(value) && value !== "") {
            if (field.units) {
                // get display units
                const du = this.convertUnits(field);
                value = convertMeasurementToMetric(du, Number(value))[1];
            }
            this.setRenderedData(field, Number(value));
        }
        setPropertyByString(this.numberProxy, field.property, value, true);
    }

    displayWithCorrectUnits(field: PropertyField): number | null {
        let result;
        if (field.units) {
            const val = convertMeasurementSystem(
                this.document.drawing.metadata.units,
                field.units,
                this.renderedData(field.property),
            );
            result =  val[1];
        } else {
            result = this.renderedData(field.property);
        }

        if (!isNaN(result)) {
            return Number(Number(result).toFixed(5));
        } else {
            return result;
        }
    }

    getHeightBySelectedFloor(field: PropertyField) {
        const value = this.displayWithCorrectUnits(field) || 0;
        return value - this.selectedLevel[field.property].floorHeightM;
    }

    setRealHeight(field: PropertyField, value: string) {
        const floorHeightM = this.selectedLevel[field.property].floorHeightM;
        const converted = +(value) + floorHeightM;
        this.setRenderedDataNumeric(field, converted);
    }
}
</script>

<style lang="less">

.riserLevelDropdown .dropdown-menu {
    max-height: 600px;
    overflow-y: auto;
    font-size: 12px;
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

.dropdown-toggle {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>
