<template>
  <b-row>
    <b-col>
      <template v-for="field in fields">
        <b-form-group
          label-size="sm"
          v-if="!field.hideFromPropertyWindow"
          :key="field.property"
          :id="'input-group-' + field.property"
          :label-for="'input-' + field.property"
          label-cols="12"
          @blur="onCommitInternal"
          :disabled="isDisabled(field)"
          :description="field.description"
        >
          <div :class="missingRequired(field) ? 'pulse-orange' : ''" :ref="'field-' + field.property">
            <b-row :style="'margin-top: -10px; margin-bottom: -5px;'">
              <b-col>
                <template v-if="field.type !== FieldType.Title && field.type !== FieldType.Advert">
                  <table style="width: 100%">
                    <tbody>
                      <tr>
                        <td>
                          <label class="float-left" style="text-align: left; font-size: 15px">
                            {{ field.title }}
                          </label>
                        </td>
                        <td v-if="field.units">
                          <label class="float-right" style="text-align: left; font-size: 15px">
                            {{ displayValue(field) }} {{ convertUnits(field) }}
                          </label>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </template>
              </b-col>
              <b-col cols="2" v-if="field.hasDefault" v-b-tooltip.hover title="Override Default">
                <b-check
                  class="float-right"
                  :checked="isDefaultOverridden(field.property)"
                  :indeterminate="isDefaultIndeterminate(field.property)"
                  @input="setIsDefault(field.property, !$event, true)"
                  :disabled="readonly"
                />
              </b-col>
              <b-col cols="4" v-if="field.isCalculated" v-b-tooltip.hover title="Computed value">
                <b-button
                  class="computed-btn float-right"
                  v-if="isDisabled(field)"
                  @click="setIsComputed(field, false)"
                  size="sm"
                  variant="outline-secondary"
                  :disabled="readonly"
                >
                  Computed
                </b-button>
                <b-button
                  class="computed-btn float-right"
                  v-else
                  @click="setIsComputed(field, true, true)"
                  size="sm"
                  variant="outline-secondary"
                  :disabled="readonly"
                >
                  Overriden
                </b-button>
              </b-col>
            </b-row>

            <template v-if="!field.isCalculated || renderedData(field.property) != null">
              <slot v-if="field.slot" :name="field.property" v-bind:field="field"></slot>

              <b-form-textarea
                v-else-if="field.type === FieldType.TextArea"
                :value="renderedData(field.property)"
                @input="setRenderedData(field, $event)"
                :id="'input-' + field.property"
                rows="5"
                size="sm"
                :placeholder="'Enter ' + field.title"
                :disabled="isDisabled(field)"
                @blur="onCommitInternal"
              ></b-form-textarea>

              <b-row
                style="(missingRequired(field) ? 'background-color: red' : '')"
                v-else-if="field.type === FieldType.Number && field.params.min != null && field.params.max != null && field.params.step != null"
              >
                <b-col cols="12">
                  <b-form-input
                    :value="displayWithCorrectUnits(field) || field.params.max"
                    @input="setRenderedDataNumeric(field, $event)"
                    :id="'input-' + field.property"
                    :min="convertValueToUnits(field.units, field.params.max * field.params.step / 100)"
                    :max="convertValueToUnits(field.units, field.params.max)"
                    :step="field.params.max * field.params.step / 100"
                    size="sm"
                    type="range"
                    :disabled="isDisabled(field)"
                    @change="onCommitInternal"
                  />
                </b-col>
              </b-row>

              <b-row
                style="(missingRequired(field) ? 'background-color: red' : '')"
                v-else-if="field.type === FieldType.Number && field.params.min != null && field.params.max != null"
              >
                <b-col cols="7">
                  <b-form-input
                    :value="displayWithCorrectUnits(field)"
                    @input="setRenderedDataNumeric(field, $event)"
                    :id="'input-' + field.property"
                    :min="convertValueToUnits(field.units, field.params.min)"
                    :max="convertValueToUnits(field.units, field.params.max)"
                    size="sm"
                    type="range"
                    :disabled="isDisabled(field)"
                    @blur="onCommitInternal"
                  />
                </b-col>
                <b-col cols="5">
                  <b-form-input
                    :value="displayWithCorrectUnits(field)"
                    @input="setRenderedDataNumeric(field, $event)"
                    :id="'input-' + field.property"
                    :min="convertValueToUnits(field.units, field.params.min)"
                    :max="convertValueToUnits(field.units, field.params.max)"
                    size="sm"
                    type="number"
                    :placeholder="'Enter ' + field.title"
                    :disabled="isDisabled(field)"
                    @blur="onCommitInternal"
                  />
                </b-col>
              </b-row>

              <b-row v-else-if="field.type === FieldType.Number">
                <b-col cols="12">
                  <b-form-input
                    :value="displayWithCorrectUnits(field)"
                    @input="setRenderedDataNumeric(field, $event)"
                    :id="'input-' + field.property"
                    size="sm"
                    :min="field.params.min == null ? undefined : convertValueToUnits(field.units, field.params.min)"
                    :max="field.params.max == null ? undefined : convertValueToUnits(field.units, field.params.max)"
                    type="number"
                    :placeholder="'Enter ' + field.title"
                    :disabled="isDisabled(field)"
                    @blur="onCommitInternal"
                  />
                </b-col>
              </b-row>

              <b-dropdown
                v-else-if="field.type === FieldType.Choice"
                class="float-left"
                size="sm"
                id="dropdown-1"
                :text="choiceName(renderedData(field.property), field.params.choices)"
                variant="outline-secondary"
                :disabled="isDisabled(field)"
              >
                <b-dropdown-item
                  v-for="(choice, index) in field.params.choices"
                  @click="setRenderedData(field, choice.key, true)"
                  :key="index"
                  size="sm"
                >
                  {{ choice.name }}
                </b-dropdown-item>
              </b-dropdown>

              <a
                v-else-if="field.type === FieldType.Advert"
                :href="field.params.url"
                target="_blank"
                class="row border text-center rounded-lg text-dark bg-light m-0"
              >
                <div>
                  <img :src="field.params.imagePath" class="w-100" :alt="field.title" />
                  <div v-html="field.params.titleHtml"></div>
                  <div v-html="field.params.subtitleHtml"></div>
                </div>
              </a>

              <PopoutColourPicker
                v-else-if="field.type === FieldType.Color"
                size="sm"
                :value="renderedData(field.property)"
                @input="setRenderedData(field, $event, true)"
                :disabled="isDisabled(field)"
              />

              <flow-system-picker
                v-else-if="field.type === FieldType.FlowSystemChoice"
                :flow-systems="field.params.systems"
                :disabled-flow-systems="field.params.disabledSystems"
                :selected-system-uid="renderedData(field.property)"
                @selectSystem="setRenderedData(field, field.params.systems[$event].uid, true)"
              />

              <rotation-picker
                v-else-if="field.type === FieldType.Rotation"
                :value="renderedData(field.property)"
                @input="setRenderedData(field, $event, true)"
                :disabled="isDisabled(field)"
              />

              <boolean-picker
                v-else-if="field.type === FieldType.Boolean"
                :value="renderedData(field.property)"
                @input="setRenderedData(field, $event, true)"
                :disabled="isDisabled(field)"
              />

              <h5 v-else-if="field.type === FieldType.Title">
                {{ field.title }}
              </h5>

              <b-form-input
                v-else
                :value="renderedData(field.property)"
                @input="setRenderedData(field, $event)"
                :id="'input-' + field.property"
                :type="field.type"
                :placeholder="'Enter ' + field.title"
                size="sm"
                :disabled="isDisabled(field)"
                @blur="onCommitInternal"
              />
            </template>
          </div>
        </b-form-group>
      </template>
    </b-col>
  </b-row>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";
import { DocumentState } from "../../../../src/store/document/types";
import { Compact } from "vue-color";
import FlowSystemPicker from "../../../../src/components/editor/FlowSystemPicker.vue";
import PopoutColourPicker from "../../../../src/components/editor/lib/PopoutColourPicker.vue";
import { FieldParams, PropertyField, FieldType, NumberParams } from "../../../../../common/src/api/document/entities/property-field";
import RotationPicker from "../../../../src/components/editor/lib/RotationPicker.vue";
import BooleanPicker from "../../../../src/components/editor/lib/BooleanPicker.vue";
import { getPropertyByString, setPropertyByString } from "../../../../src/lib/utils";
import { Choice } from "../../../../../common/src/lib/utils";
import { DrawingMode } from "../../../htmlcanvas/types";
import {
  convertMeasurementSystem,
  convertMeasurementToMetric,
  Units
} from "../../../../../common/src/lib/measurements";
import { StandardFlowSystemUids } from "../../../../../common/src/api/config";

@Component({
  components: {
    BooleanPicker,
    RotationPicker,
    PopoutColourPicker,
    FlowSystemPicker,
    compactPicker: Compact
  }
})
export default class PropertiesFieldBuilder extends Vue {
  @Prop({ type: Array })
  fields: any[];

  @Prop({ type: Object })
  defaultData: any;

  @Prop({ type: Object })
  reactiveData: any;

  @Prop({ type: String })
  target: string;

  @Prop({ type: Function })
  onChange: () => void;

  @Prop({ type: Function })
  onCommit: () => void;

  // Typing into number text boxes is a bit sad unfortunately :(
  numberProxy = {} as any;

  get FieldType() {
    return FieldType;
  }

  mounted() {
    if (this.$props.target) {
      // scroll to it
      const target = this.$refs["field-" + this.$props.target] as any;
      if (target) target[0].scrollIntoView();
    }
  }

  get document(): DocumentState {
    return this.$store.getters["document/document"];
  }

  get readonly() {
    return this.document.uiState.viewOnly || this.document.uiState.drawingMode === DrawingMode.History;
  }

  displayWithCorrectUnits(field: PropertyField): number | null {
    let result;
    if (field.units) {
      const val = convertMeasurementSystem(
        this.document.drawing.metadata.units,
        field.units,
        this.renderedData(field.property)
      );
      result = val[1];
    } else {
      result = this.renderedData(field.property);
    }

    if (!isNaN(result)) {
      if (field.type === FieldType.Number) {
        const params = field.params;
        if (params?.step && params?.max && params?.min) {
          result = ((result - params.min) / ((params.max - params.min) / (100 - params.step)) + params.step) * params.max / 100;
          if (result < params.max * params.step / 100) {
            result = params.max;
          }
        }
      }
      return Number(Number(result).toFixed(5));
    } else {
      return result;
    }
  }

  convertValueToUnits(curr: Units | undefined, value: number) {
    if (!curr) {
      return value;
    }

    const val = convertMeasurementSystem(this.document.drawing.metadata.units, curr, value);
    return val[1];
  }

  displayValue(field: PropertyField): string | number | null {
    if (field.type === FieldType.Number) {
      if (field.params.step) {
        const params = field.params;
        const value = this.displayWithCorrectUnits(field);
        if (value) {
          return params.max ? Math.ceil(value * 100 / params.max) : 0;
        } else {
          return params.max ? 100 : 0;
        }
      }
    }
    return null;
  }

  convertUnits(field: PropertyField): Units {
    if (field.units) {
      const val = convertMeasurementSystem(
        this.document.drawing.metadata.units,
        field.units,
        this.renderedData(field.property)
      );
      return val[0];
    } else {
      throw new Error("No units to convert");
    }
  }

  onCommitInternal() {
    this.numberProxy = {} as any;
    this.$props.onCommit();
  }

  renderedData(property: string): any {
    if (getPropertyByString(this.numberProxy, property, true) != null) {
      return getPropertyByString(this.numberProxy, property);
    }
    if (getPropertyByString(this.$props.reactiveData, property) == null) {
      return getPropertyByString(this.$props.defaultData, property);
    } else {
      return getPropertyByString(this.$props.reactiveData, property);
    }
  }

  setRenderedData(field: PropertyField, val: any, commit: boolean = false) {
    if (this.isDisabled(field) && field.requiresInput !== true) {
      // don't do it, unless it's a required input, which allows inputs.
    } else {
      setPropertyByString(this.$props.reactiveData, field.property, val);
      if (this.$props.onChange) {
        this.$props.onChange();
      }
    }

    if (commit && this.$props.onCommit) {
      this.$props.onCommit();
    }
  }

  setRenderedDataNumeric(field: PropertyField, value: any) {
    if (!isNaN(value) && value !== "") {
      if (field.type === FieldType.Number) {
        const params = field.params;
        if (params?.step && params?.max && params?.min) {
          value = (value * 100 / params.max - params.step) * ((params.max - params.min) / (100 - params.step)) + params.min;
        }
      }
      if (field.units) {
        // get display units
        const du = this.convertUnits(field);
        value = convertMeasurementToMetric(du, Number(value))[1];
      }
      this.setRenderedData(field, Number(value));
    }
    setPropertyByString(this.numberProxy, field.property, value, true);
  }

  setIsDefault(property: string, val: boolean, commit: boolean = false) {
    if (val) {
      setPropertyByString(this.$props.reactiveData, property, null);
    } else {
      setPropertyByString(this.$props.reactiveData, property, this.renderedData(property));
    }
    this.$props.onChange();
    if (commit) {
      this.$props.onCommit();
    }
  }

  missingRequired(field: PropertyField) {
    return (
      field.requiresInput &&
      (getPropertyByString(this.$props.reactiveData, field.property) === null ||
        getPropertyByString(this.$props.reactiveData, field.property) === "")
    );
  }

  setIsComputed(field: PropertyField, val: boolean, commit: boolean = false) {
    const property = field.property;
    if (val) {
      setPropertyByString(this.$props.reactiveData, property, null);
    } else {
      if (this.renderedData(property) != null) {
        setPropertyByString(this.$props.reactiveData, property, this.renderedData(property));
      } else {
        setPropertyByString(this.$props.reactiveData, property, (field.params as FieldParams).initialValue);
      }
    }
    this.$props.onChange();
    if (commit) {
      this.$props.onCommit();
    }
  }

  isDefaultOverridden(prop: string) {
    return getPropertyByString(this.$props.reactiveData, prop) != null;
  }

  isDefaultIndeterminate(prop: string) {
    return getPropertyByString(this.$props.reactiveData, prop) === undefined;
  }

  choiceName(key: string, choices: Choice[]): string {
    const result = choices.find((c) => c.key === key);
    if (result) {
      return result.name;
    }
    return key + " (not found...)";
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
      getPropertyByString(this.$props.reactiveData, field.property, true) == null &&
      (field.isCalculated || field.hasDefault)
    );
  }

  isDefined(val: any) {
    return val !== null && val !== undefined;
  }
}
</script>

<style lang="less">
.computed-btn {
  font-size: 12px;
  padding: 2px 4px 2px 4px;
}

.pulse-orange {
  background-color: #ffeeaa;
  animation-name: orange-pulse;
  animation-duration: 0.5s;
  animation-iteration-count: 3;
}

@keyframes orange-pulse {
  0% {
    background-color: #ffeeaa;
  }
  50% {
    background-color: orange;
  }
  100% {
    background-color: #ffeeaa;
  }
}

.form-row {
  text-align: left;
}
</style>
