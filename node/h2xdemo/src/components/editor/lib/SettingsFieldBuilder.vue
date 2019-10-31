<template>
    <b-container>

        <b-row>
            <b-col>

                <b-form-group
                        v-for="field in fields"
                        :key="field[0]"
                        :id="'input-group-' + field[0]"
                        :label="field[1]"
                        :label-for="'input-' + field[0]"
                        label-cols="4"
                >
                    <b-form-textarea
                        v-if="field[2] === 'textarea'"
                        v-model="reactiveData[field[0]]"
                        :id="'input-' + field[0]"
                        rows="5"
                        :placeholder="'Enter ' + field[1]"
                    ></b-form-textarea>

                    <b-row v-else-if="field[2] === 'range'">
                        <b-col cols="8">

                            <b-form-input
                                    v-model="reactiveData[field[0]]"
                                    :id="'input-' + field[0]"
                                    :min="field[3]"
                                    :max="field[4]"
                                    :type="field[2]"
                                    :step="field[5] ? field[5] : 1"
                                    :placeholder="'Enter ' + field[1]"
                            />
                        </b-col>
                        <b-col cols="4">
                        <b-form-input
                                v-model="reactiveData[field[0]]"
                                :id="'input-' + field[0]"
                                type="number"
                                :step="field[5] ? field[5] : 1"
                                :placeholder="'Enter ' + field[1]"
                        />
                        </b-col>
                    </b-row>

                    <b-dropdown
                            v-else-if="field[2] === 'choice'" class="float-left"
                            size="md" id="dropdown-1" :text="choiceName(reactiveData[field[0]], field[3])" variant="outline-secondary" style="padding-bottom: 20px">
                        <b-dropdown-item
                                v-for="(choice, index) in field[3]"
                                @click="reactiveData[field[0]] = choice.key"
                                :key="index"
                                :disabled="choice.disabled === undefined ? false : choice.disabled"
                        >
                            {{choice.name}}
                        </b-dropdown-item>
                    </b-dropdown>

                    <compact-picker v-else-if="field[2] === 'color'" v-model="reactiveData[field[0]]"/>

                    <b-form-input
                        v-else
                        v-model="reactiveData[field[0]]"
                        :id="'input-' + field[0]"
                        :type="field[2]"
                        :placeholder="'Enter ' + field[1]"
                    />
                </b-form-group>
            </b-col>
        </b-row>
            <slot>

            </slot>
        <b-row>
            <b-col cols="8">

            </b-col>
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

    import Vue from 'vue';
    import Component from 'vue-class-component';
    import {DocumentState} from '@/store/document/types';
    import {Compact} from 'vue-color';
    import * as _ from 'lodash';
    import { isString } from 'lodash';
    import {Choice} from '@/lib/types';

    @Component({
        props: {
            fields: Array,
            reactiveData: Object,
            originalData: Object,
            onSave: Function,
            onBack: Function,
            onRevert: Function,
        },
        components: {
            compactPicker: Compact,
        },
    })
    export default class SettingsFieldBuilder extends Vue {
        get document(): DocumentState {
            return this.$store.getters['document/document'];
        }

        get isUnchanged() {
            return _.isEqual(this.$props.reactiveData, this.$props.originalData);
        }

        save() {
            this.$props.onSave();
        }

        leave(): boolean {
            if (this.isUnchanged) {
                return true;
            } else {
                if (window.confirm('Leaving now will discard your changes. Are you sure?')) {
                    this.cancel();
                    return true;
                } else {
                    return false;
                }
            }
        }

        cancel() {
            if (this.isUnchanged) {
                // go back to drawing
                this.$props.onBack();
            } else {
                // revert
                Object.assign(this.$props.reactiveData, this.$props.originalData);
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
            return key + ' (not found...)';
        }
    }

</script>

<style lang="less">

</style>
