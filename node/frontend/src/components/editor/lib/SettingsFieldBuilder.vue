<template>
    <b-container>
        <div style="overflow-y: auto; overflow-x: hidden; height: calc(100vh - 270px); margin-bottom: 20px" id="settingsFieldTop">
            <slot> </slot>
            <b-row>
                <b-col>
                    <b-form-group
                        v-for="field in fields"
                        :key="field[0]"
                        :id="'input-group-' + field[0]"
                        :label="field[2].startsWith('title') ? '' : field[1]"
                        :label-for="'input-' + field[0]"
                        label-cols="4"
                    >
                        <b-form-textarea
                            v-if="field[2] === 'textarea'"
                            :value="getReactiveData(field[0])"
                            @input="setReactiveData(field[0], $event)"
                            :id="'input-' + field[0]"
                            rows="5"
                            :placeholder="'Enter ' + field[1]"
                        ></b-form-textarea>

                        <b-row v-else-if="field[2] === 'range'">
                            <b-col cols="8">
                                <b-form-input
                                    :value="displayWithCorrectUnits(field[6], field[0])"
                                    @input="setRenderedDataNumeric(field[6], field[0], Number($event))"
                                    :id="'input-' + field[0]"
                                    :min="convertValueToUnits(field[6], field[3])"
                                    :max="convertValueToUnits(field[6], field[4])"
                                    :type="field[2]"
                                    :step="field[5] ? field[5] : 1"
                                    :placeholder="'Enter ' + field[1]"
                                />
                            </b-col>
                            <b-col cols="4">
                                <b-input-group :prepend="field[6] ? convertUnits(field[6]) : undefined">
                                    <b-form-input
                                            :value="displayWithCorrectUnits(field[6], field[0])"
                                            @input="setRenderedDataNumeric(field[6], field[0], Number($event))"
                                            :id="'input-' + field[0]"
                                            type="number"
                                            :step="field[5] ? field[5] : 1"
                                            :placeholder="'Enter ' + field[1]"
                                    />
                                </b-input-group>
                            </b-col>
                        </b-row>

                        <b-input-group
                                v-else-if="field[2] === 'number'"
                                :prepend="field[3] ? convertUnits(field[3]) : undefined"
                        >
                            <b-form-input
                                :value="displayWithCorrectUnits(field[3], field[0])"
                                @input="setRenderedDataNumeric(field[3], field[0], Number($event))"
                                :id="'input-' + field[0]"
                                type="number"
                                :placeholder="'Enter ' + field[1]"
                            />
                        </b-input-group>

                        <b-input-group
                            v-else-if="field[2] === 'select'"
                            :prepend="field[3] ? convertUnits(field[3]) : undefined"
                        >
                            <b-form-select
                                :value="correctSelectedValue(field, displayWithCorrectUnits(field[3], field[0]))"
                                @input="setRenderedDataNumeric(field[3], field[0], Number($event))"
                                :options="field[4]"
                            ></b-form-select>
                        </b-input-group>

                        <b-dropdown
                            v-else-if="field[2] === 'choice'"
                            class="float-left"
                            size="md"
                            :text="choiceName(getReactiveData(field[0]), field[3])"
                            variant="outline-secondary"
                        >
                            <b-dropdown-item
                                v-for="(choice, index) in field[3]"
                                @click="setReactiveData(field[0], choice.key)"
                                :key="index"
                                :disabled="choice.disabled === undefined ? false : choice.disabled"
                            >
                                {{ choice.name }}
                            </b-dropdown-item>
                        </b-dropdown>

                        <compact-picker
                            v-else-if="field[2] === 'color'"
                            :value="getReactiveData(field[0])"
                            @input="setReactiveData(field[0], $event)"
                        />

                        <h2 v-else-if="field[2] === 'title2'">
                            {{ field[1] }}
                        </h2>
                        <h3 v-else-if="field[2] === 'title3'">
                            {{ field[1] }}
                        </h3>
                        <h4 v-else-if="field[2] === 'title4'">
                            {{ field[1] }}
                        </h4>

                        <h5 v-else-if="field[2] === 'title5'">
                            {{ field[1] }}
                        </h5>

                        <b-dropdown
                            v-else-if="field[2] === 'yesno'"
                            class="float-left"
                            size="md"
                            :text="getReactiveData(field[0]) ? 'Yes' : 'No'"
                            variant="outline-secondary"
                            style="padding-bottom: 20px"
                        >
                            <b-dropdown-item
                                    @click="setReactiveData(field[0], true)"
                            >
                                Yes
                            </b-dropdown-item>
                            <b-dropdown-item
                                    @click="setReactiveData(field[0], false)"
                            >
                                No
                            </b-dropdown-item>
                        </b-dropdown>

                        <b-table-simple
                            v-else-if="field[2] === 'array-table'"
                            small
                            fixed
                        >
                            <b-thead>
                                <b-tr>
                                    <b-th v-for="col in field[3]" :key="col.name">{{col.name}}</b-th>
                                </b-tr>
                            </b-thead>
                            <b-tbody>
                                <b-tr v-for="(rowVal, rowIndex) in getReactiveData(field[0])" :key="rowIndex">
                                    <b-td v-for="(col, colIndex) in field[3]" :key="rowIndex + '-' + colIndex">
                                        <b-input-group
                                            v-if="col.type === 'select'"
                                            :prepend="col.units ? convertUnits(col.units) : undefined"
                                            size="sm"
                                        >
                                            <b-form-select
                                                :options="col.options"
                                                :value="getReactiveData(`${field[0]}.${rowIndex}.${col.key}`)"
                                                @input="setReactiveData(`${field[0]}.${rowIndex}.${col.key}`, $event)"
                                                size="sm"
                                            ></b-form-select>
                                        </b-input-group>

                                        <b-input-group 
                                            v-else 
                                            :prepend="col.units ? convertUnits(col.units) : undefined" 
                                            size="sm"
                                        >
                                            <b-form-input
                                                size="sm"
                                                :value="displayWithCorrectUnits(col.units, `${field[0]}.${rowIndex}.${col.key}`)"
                                                @input="setRenderedDataNumeric(col.units, `${field[0]}.${rowIndex}.${col.key}`, Number($event))"
                                                :id="'input-' + `${field[0]}.${rowIndex}.${col.key}`"
                                                type="number"
                                            />
                                        </b-input-group>
                                    </b-td>
                                </b-tr>
                            </b-tbody>

                        </b-table-simple>

                        <b-table-simple
                                v-else-if="field[2] === 'optional-numeric-table'"
                                small
                        >
                            <b-thead>
                                <b-tr>
                                    <b-th>{{field[4]}}</b-th>
                                    <b-th>{{field[1]}}</b-th>
                                </b-tr>
                            </b-thead>
                            <b-tbody>
                                <b-tr v-for="(row, rowIndex) in field[3]" :key="rowIndex">
                                    <b-td>{{row}}</b-td>
                                    <b-td>
                                        <b-input-group :prepend="field[7] ? convertUnits(field[7]) : undefined" size="sm">
                                        <b-form-input
                                                size="sm"
                                                :value="displayWithCorrectUnits(field[7], `${field[0]}.${row}`)"
                                                @input="setRenderedDataNumeric(field[7], `${field[0]}.${row}`, Number($event))"
                                                :id="'input-' + `${field[0]}.${row}`"
                                                type="number"
                                                :disabled="getReactiveData(field[0])[row] === undefined"
                                        />
                                        </b-input-group>
                                    </b-td>
                                    <b-td>
                                        <b-form-checkbox
                                                @change="setOptionalTableRow(field[0], row, $event ? undefined : (getOriginalData(`${field[0]}.${row}`) || 0))"
                                                v-bind:checked="getReactiveData(field[0])[row] === undefined"
                                        >
                                            {{field[5]}}
                                        </b-form-checkbox>
                                    </b-td>
                                </b-tr>
                            </b-tbody>

                        </b-table-simple>

                        <b-form-input
                            v-else
                            :value="getReactiveData(field[0])"
                            @input="setReactiveData(field[0], $event)"
                            :id="'input-' + field[0]"
                            :type="field[2]"
                            :placeholder="'Enter ' + field[1]"
                        />
                    </b-form-group>
                    <slot name="more-fields"/>
                </b-col>
            </b-row>
        </div>
        <b-row>
            <b-col cols="8"> </b-col>
            <b-col>
                <b-button variant="success" style="margin-right: 20px" @click="save" v-if="!isUnchanged">
                    Save
                </b-button>
                <b-button variant="secondary" @click="cancel">
                    {{ isUnchanged ? "Back to Drawing" : "Revert" }}
                </b-button>
            </b-col>
        </b-row>
    </b-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { DocumentState } from "../../../../src/store/document/types";
import { Compact } from "vue-color";
import * as _ from "lodash";
import { isString } from "lodash";
import { getPropertyByString, setPropertyByString } from "../../../lib/utils";
import { Choice, cloneSimple, SelectField } from "../../../../../common/src/lib/utils";
import { PropertyField } from "../../../../../common/src/api/document/entities/property-field";
import {
    convertMeasurementSystem,
    convertMeasurementToMetric,
    Units
} from "../../../../../common/src/lib/measurements";

@Component({
    props: {
        fields: Array,
        reactiveData: Object,
        originalData: Object,
        onSave: Function,
        onBack: Function,
        onRevert: Function
    },
    components: {
        compactPicker: Compact
    }
})
export default class SettingsFieldBuilder extends Vue {
    get document(): DocumentState {
        return this.$store.getters["document/document"];
    }

    get isUnchanged() {
        return _.isEqual(this.$props.reactiveData, this.$props.originalData);
    }

    getReactiveData(prop: string) {
        return getPropertyByString(this.$props.reactiveData, prop);
    }

    getOriginalData(prop: string) {
        return getPropertyByString(this.$props.originalData, prop);
    }

    setReactiveData(prop: string, value: any) {
        return setPropertyByString(this.$props.reactiveData, prop, value);
    }

    setOptionalTableRow(field: string, row: any, value: any) {
        console.log("setting");
        console.log(row);
        console.log(value);
        Vue.set(this.getReactiveData(field), row, value);
    }

    save() {
        this.$props.onSave();
    }

    leave(): boolean {
        if (this.isUnchanged) {
            return true;
        } else {
            if (window.confirm("Leaving now will discard your changes. Are you sure?")) {
                this.cancel();
                return true;
            } else {
                return false;
            }
        }
    }


    displayWithCorrectUnits(units: Units | null, property: string): number | null {
        let result;
        if (units) {
            const val = convertMeasurementSystem(
                this.document.drawing.metadata.units,
                units,
                this.getReactiveData(property),
            );
            result =  val[1];
        } else {
            result = this.getReactiveData(property);
        }

        if (!isNaN(result)) {
            return Number(Number(result).toFixed(5));
        } else {
            return result;
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

    convertUnits(units: Units): Units {
        if (units) {
            const val = convertMeasurementSystem(
                this.document.drawing.metadata.units,
                units,
                1,
            );
            return val[0];
        } else {
            throw new Error('No units to convert');
        }
    }


    setRenderedDataNumeric(units: Units, property: string, value: any) {
        if (!isNaN(value) && value !== "") {
            if (units) {
                // get display units
                const du = this.convertUnits(units);
                value = convertMeasurementToMetric(du, Number(value))[1];
            }
            this.setReactiveData(property, Number(value));
        }
        this.setReactiveData(property, value);
    }

    cancel() {
        if (this.isUnchanged) {
            // go back to drawing
            this.$props.onBack();
        } else {
            // revert
            Object.assign(this.$props.reactiveData, cloneSimple(this.$props.originalData));
            if (this.$props.onRevert) {
                this.$props.onRevert();
            }
        }
    }

    choiceName(key: string, choices: Choice[]): string {
        const result = choices.find((c) => c.key === key);
        if (result) {
            return result.name;
        }
        return key + " (not found...)";
    }

    correctSelectedValue(field: any[], currValue: number | string) {
        let newVal: number | string = field[4].find((option: SelectField) => option.value == currValue)?.value || field[4][0].value;

        if (currValue != newVal) {
            this.setRenderedDataNumeric(field[3], field[0], newVal);
        }
        
        return this.displayWithCorrectUnits(field[3], field[0]);
    }
}
</script>

<style lang="less">
    .dropdown-menu {
        max-height: 400px;
        overflow-y:auto;
    }
</style>
