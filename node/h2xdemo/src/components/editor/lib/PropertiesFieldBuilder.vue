<template>
    <b-container>
        <b-row>
            <b-col>

                <b-form-group
                        label-size="sm"
                        v-for="field in fields"
                        :key="field.property"
                        :id="'input-group-' + field.property"
                        :label-for="'input-' + field.property"
                        label-cols="12"
                        @blur="onCommit"
                        :disabled="isDisabled(field)"
                >
                    <div
                            :class="(missingRequired(field) ? 'pulse-orange' : '')"
                            :ref="'field-' + field.property"
                    >
                    <b-row :style="'margin-top: -10px; margin-bottom: -5px;'">
                        <b-col>
                            <label class="float-left" style="text-align: left; font-size: 15px;">{{field.title}}</label>
                        </b-col>
                        <b-col cols="2" v-if="field.hasDefault"
                               v-b-tooltip.hover title="Override Default">
                            <b-check
                                    class="float-right"
                                    :checked="isDefined(reactiveData[field.property])"
                                    :indeterminate="reactiveData[field.property] === undefined"
                                    @input="setIsDefault(field.property, !$event, true)"
                            />
                        </b-col>
                        <b-col cols="4" v-if="field.isCalculated"
                               v-b-tooltip.hover title="Computed value">
                            <b-button
                                    class="computed-btn float-right"
                                    v-if="isDisabled(field)"
                                    @click="setIsComputed(field, false)"
                                    size="sm"
                                    variant="outline-secondary"
                            >
                                Computed
                            </b-button>
                            <b-button
                                    class="computed-btn float-right"
                                    v-else
                                    @click="setIsComputed(field, true, true)"
                                    size="sm"
                                    variant="outline-secondary"
                            >
                                Overriden
                            </b-button>
                        </b-col>
                    </b-row>

                    <template v-if="!field.isCalculated || renderedData(field.property) != null">

                        <b-form-textarea
                                v-if="field.type === 'textarea'"
                                :value="renderedData(field.property)" @input="setRenderedData(field, $event)"
                                :id="'input-' + field.property"
                                rows="5"
                                size="sm"
                                :placeholder="'Enter ' + field.title"
                                :disabled="isDisabled(field)"
                                @blur="onCommit"
                        ></b-form-textarea>

                        <b-row style="(missingRequired(field) ? 'background-color: red' : '')"
                                v-else-if="field.type === 'number' && field.params.min != null && field.params.max != null">
                            <b-col cols="7">
                                <b-form-input
                                        :value="renderedData(field.property)" @input="setRenderedData(field, Number($event))"
                                        :id="'input-' + field.property"
                                        :min="field.params.min"
                                        :max="field.params.max"
                                        size="sm"
                                        type="range"
                                        :disabled="isDisabled(field)"
                                        @blur="onCommit"
                                />
                            </b-col>
                            <b-col cols="5">
                                <b-form-input
                                        :value="renderedData(field.property)" @input="setRenderedData(field, Number($event))"
                                        :id="'input-' + field.property"
                                        :min="field.params.min"
                                        :max="field.params.max"
                                        size="sm"
                                        type="number"
                                        :placeholder="'Enter ' + field.title"
                                        :disabled="isDisabled(field)"
                                        @blur="onCommit"
                                />
                            </b-col>
                        </b-row>

                        <b-row v-else-if="field.type === 'number'">
                            <b-col cols="12">
                                <b-form-input
                                        :value="renderedData(field.property)" @input="setRenderedData(field, Number($event))"
                                        :id="'input-' + field.property"
                                        size="sm"
                                        :min="field.params.min == null ? undefined : field.params.min"
                                        :max="field.params.max == null ? undefined : field.params.max"
                                        type="number"
                                        :placeholder="'Enter ' + field.title"
                                        :disabled="isDisabled(field)"
                                        @blur="onCommit"
                                />
                            </b-col>
                        </b-row>

                        <b-dropdown
                                v-else-if="field.type === 'choice'"
                                class="float-left"
                                size="sm" id="dropdown-1"
                                :text="choiceName(renderedData(field.property), field.params.choices)"
                                variant="outline-secondary"
                                :disabled="isDisabled(field)"
                        >
                            <b-dropdown-item v-for="(choice, index) in field.params.choices"
                                             @click="setRenderedData(field, choice.key, true)" :key="index"
                                             size="sm"
                            >
                                {{ choice.name }}
                            </b-dropdown-item>
                        </b-dropdown>

                        <PopoutColourPicker
                                v-else-if="field.type === 'color'"
                                size="sm"
                                :value="renderedData(field.property)" @input="setRenderedData(field, $event, true)"
                                :disabled="isDisabled(field)"
                        />

                        <flow-system-picker
                                v-else-if="field.type === 'flow-system-choice'"
                                :flow-systems="field.params.systems"
                                :selected-system-uid="renderedData(field.property)"
                                @selectSystem="setRenderedData(field, field.params.systems[$event].uid, true)"
                        />

                        <rotation-picker
                                v-else-if="field.type === 'rotation'"
                                :value="renderedData(field.property)" @input="setRenderedData(field, $event, true)"
                                :disabled="isDisabled(field)"
                        />

                        <boolean-picker
                                v-else-if="field.type === 'boolean'"
                                :value="renderedData(field.property)" @input="setRenderedData(field, $event, true)"
                                :disabled="isDisabled(field)"
                        />

                        <b-form-input
                                v-else
                                :value="renderedData(field.property)" @input="setRenderedData(field, $event)"
                                :id="'input-' + field.property"
                                :type="field.type"
                                :placeholder="'Enter ' + field[1]"
                                size="sm"
                                :disabled="isDisabled(field)"
                                @blur="onCommit"
                        />
                    </template>
                    </div>
                </b-form-group>
            </b-col>
        </b-row>
    </b-container>
</template>

<script lang="ts">

    import Vue from 'vue';
    import Component from 'vue-class-component';
    import {DocumentState} from '@/store/document/types';
    import {Compact} from 'vue-color';
    import FlowSystemPicker from '@/components/editor/FlowSystemPicker.vue';
    import PopoutColourPicker from '@/components/editor/lib/PopoutColourPicker.vue';
    import {FieldParams, PropertyField} from '@/store/document/entities/property-field';
    import RotationPicker from '@/components/editor/lib/RotationPicker.vue';
    import {Choice} from '@/lib/types';
    import BooleanPicker from '@/components/editor/lib/BooleanPicker.vue';
    import {getPropertyByString, setPropertyByString} from "@/lib/utils";

    @Component({
        props: {
            fields: Array,
            reactiveData: Object,
            defaultData: Object,
            onChange: Function,
            onCommit: Function,
            target: String,
        },
        components: {
            BooleanPicker,
            RotationPicker,
            PopoutColourPicker,
            FlowSystemPicker,
            compactPicker: Compact,
        },
    })
    export default class PropertiesFieldBuilder extends Vue {
        mounted() {
            if (this.$props.target) {
                // scroll to it

                (this.$refs['field-' + this.$props.target] as any)[0].scrollIntoView();
            }
        }

        get document(): DocumentState {
            return this.$store.getters['document/document'];
        }

        renderedData(property: string): any {
            if (this.$props.reactiveData[property] === null || this.$props.reactiveData[property] === undefined) {
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

        setIsDefault(property: string, val: boolean, commit: boolean = false) {
            if (val) {
                this.$props.reactiveData[property] = null;
            } else {
                this.$props.reactiveData[property] = this.renderedData(property);
            }
            this.$props.onChange();
            if (commit) {
                this.$props.onCommit();
            }
        }

        missingRequired(field: PropertyField) {
            return field.requiresInput &&
                (this.$props.reactiveData[field.property] === null ||
                    this.$props.reactiveData[field.property] === ''
                );
        }

        setIsComputed(field: PropertyField, val: boolean, commit: boolean = false) {
            const property = field.property;
            if (val) {
                this.$props.reactiveData[property] = null;
            } else {
                if (this.renderedData(property) != null) {
                    this.$props.reactiveData[property] = this.renderedData(property);
                } else {
                    this.$props.reactiveData[property] = (field.params as FieldParams).initialValue;
                }
            }
            this.$props.onChange();
            if (commit) {
                this.$props.onCommit();
            }
        }

        choiceName(key: string, choices: Choice[]): string {
            const result = choices.find((c) => c.key === key);
            if (result) {
                return result.name;
            }
            return key + ' (not found...)';
        }

        isDisabled(field: PropertyField) {
            if (field.requiresInput) {
                return false;
            }
            return (this.$props.reactiveData[field.property] === null ||
                this.$props.reactiveData[field.property] === undefined)
                && (field.isCalculated || field.hasDefault);
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
</style>
