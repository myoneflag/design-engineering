<template>
        <b-row style="margin-top: 10px">
            <b-col cols="4">
                <b-button class="rotateBtn" variant="primary" @click="rotateLeft" size="sm" :disabled="disabled">
                    <v-icon name="undo" scale="1.0"/>
                </b-button>
            </b-col>
            <b-col cols="4" class="p-0">
                <b-form-input
                    :value="value" @input="$emit('input', $event)"
                    size="sm"
                    :min="0"
                    :max="360"
                    type="number"
                    placeholder="Enter Angle (Degrees)"
                    :disabled="disabled"
                />
            </b-col>
            <b-col cols="4">
                <b-button class="rotateBtn" variant="primary" @click="rotateRight" size="sm" :disabled="disabled">
                    <v-icon name="redo" scale="1.0"/>
                </b-button>
            </b-col>
        </b-row>
</template>

<script lang="ts">
    import Vue from 'vue';
    import Component from 'vue-class-component';

    @Component({
        props: {
            value: Number,
            disabled: Boolean,
        },
    })
    export default class RotationPicker extends Vue {
        rotateLeft() {
            this.$emit('input', (this.$props.value - 45 + 360) % 360);
        }

        rotateRight() {
            this.$emit('input', (this.$props.value + 45) % 360);
        }
    }
</script>

<style lang="less">

</style>
