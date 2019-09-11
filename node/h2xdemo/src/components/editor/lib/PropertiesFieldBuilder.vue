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
                        :disabled="reactiveData[field.property] == null"
                >
                    <b-row style="margin-top: -10px; margin-bottom: -5px;">
                        <b-col>
                            <label class="float-left" style="text-align: left; font-size: 15px;">{{field.title}}</label>
                        </b-col>
                        <b-col cols="2" v-if="field.hasDefault"
                               v-b-tooltip.hover title="Override Default">
                            <b-check
                                    class="float-right"
                                    :checked="reactiveData[field.property] != null"
                                    @input="setIsDefault(field.property, !$event)"
                            />
                        </b-col>
                        <b-col cols="4" v-if="field.isCalculated"
                               v-b-tooltip.hover title="Computed value">
                            <b-button
                                    class="computed-btn float-right"
                                    v-if="reactiveData[field.property] == null"
                                    @click="setIsComputed(field, false)"
                                    size="sm"
                                    variant="outline-secondary"
                            >
                                Computed
                            </b-button>
                            <b-button
                                    class="computed-btn float-right"
                                    v-else
                                    @click="setIsComputed(field, true)"
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
                                :value="renderedData(field.property)" @input="setRenderedData(field.property, $event)"
                                :id="'input-' + field.property"
                                rows="5"
                                size="sm"
                                :placeholder="'Enter ' + field.title"
                                :disabled="reactiveData[field.property] == null"
                        ></b-form-textarea>

                        <b-row v-else-if="field.type === 'number' && field.params.min != null && field.params.max != null">
                            <b-col cols="7">
                                <b-form-input
                                        :value="renderedData(field.property)" @input="setRenderedData(field.property, $event)"
                                        :id="'input-' + field.property"
                                        :min="field.params.min"
                                        :max="field.params.max"
                                        size="sm"
                                        type="range"
                                        :disabled="reactiveData[field.property] == null"
                                />
                            </b-col>
                            <b-col cols="5">
                                <b-form-input
                                        :value="renderedData(field.property)" @input="setRenderedData(field.property, $event)"
                                        :id="'input-' + field.property"
                                        :min="field.params.min"
                                        :max="field.params.max"
                                        size="sm"
                                        type="number"
                                        :placeholder="'Enter ' + field.title"
                                        :disabled="reactiveData[field.property] == null"
                                />
                            </b-col>
                        </b-row>

                        <b-row v-else-if="field.type === 'number'">
                            <b-col cols="12">
                                <b-form-input
                                        :value="renderedData(field.property)" @input="setRenderedData(field.property, $event)"
                                        :id="'input-' + field.property"
                                        size="sm"
                                        :min="field.params.min == null ? undefined : field.params.min"
                                        :max="field.params.max == null ? undefined : field.params.max"
                                        type="number"
                                        :placeholder="'Enter ' + field.title"
                                        :disabled="reactiveData[field.property] == null"
                                />
                            </b-col>
                        </b-row>

                        <b-dropdown
                                v-else-if="field.type === 'choice'"
                                class="float-left"
                                size="sm" id="dropdown-1"
                                :text="renderedData(field.property)"
                                variant="outline-secondary"
                                :disabled="reactiveData[field.property] == null"
                        >
                            <b-dropdown-item v-for="(choice, index) in field.params.choices"
                                             @click="setRenderedData(field.property, choice)" :key="choice"
                                             size="sm"
                            >
                                {{choice}}
                            </b-dropdown-item>
                        </b-dropdown>

                        <PopoutColourPicker
                                v-else-if="field.type === 'color'"
                                size="sm"
                                :value="renderedData(field.property)" @input="setRenderedData(field.property, $event)"
                                :disabled="reactiveData[field.property] == null"
                        />

                        <flow-system-picker
                                v-else-if="field.type === 'flow-system-choice'"
                                :flow-systems="field.params.systems"
                                :selected-system-uid="renderedData(field.property)"
                                @selectSystem="setRenderedData(field.property, field.params.systems[$event].uid)"
                        />

                        <b-form-input
                                v-else
                                :value="renderedData(field.property)" @input="setRenderedData(field.property, $event)"
                                :id="'input-' + field.property"
                                :type="field.type"
                                :placeholder="'Enter ' + field[1]"
                                size="sm"
                                :disabled="reactiveData[field.property] == null"
                        />
                    </template>
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
    import {CalculationParams, PropertyField} from '@/store/document/entities/property-field';

    @Component({
        props: {
            fields: Array,
            reactiveData: Object,
            defaultData: Object,
            onChange: Function,
            onCommit: Function,
        },
        components: {
            PopoutColourPicker,
            FlowSystemPicker,
            compactPicker: Compact,
        },
    })
    export default class PropertiesFieldBuilder extends Vue {
        get document(): DocumentState {
            return this.$store.getters['document/document'];
        }

        renderedData(property: string): any {
            if (this.$props.reactiveData[property] == null) {
                return this.$props.defaultData[property];
            } else {
                return this.$props.reactiveData[property];
            }
        }

        setRenderedData(property: string, val: any) {
            if (this.$props.reactiveData[property] == null) {
                // don't do it
            } else {
                this.$props.reactiveData[property] = val;
                if (this.$props.onChange) {
                    this.$props.onChange();
                }
            }
        }

        setIsDefault(property: string, val: boolean) {
            if (val) {
                this.$props.reactiveData[property] = null;
            } else {
                this.$props.reactiveData[property] = this.renderedData(property);
            }
            this.$props.onChange();
        }

        setIsComputed(field: PropertyField, val: boolean) {
            const property = field.property;
            if (val) {
                this.$props.reactiveData[property] = null;
            } else {
                if (this.renderedData(property) != null) {
                    this.$props.reactiveData[property] = this.renderedData(property);
                } else {
                    this.$props.reactiveData[property] = (field.params as CalculationParams).initialValue;
                }
            }
            this.$props.onChange();
        }
    }
</script>

<style lang="less">
    .computed-btn {
        font-size: 12px;
        padding: 2px 4px 2px 4px;

    }
</style>
