<template>
    <div
            id="color-button"
            :size="size"
            :style="'background-color: ' + value.hex + '; width: 100%; height: 30px;'"
    >
        <b-popover v-if="!disabled" target="color-button" triggers="click blur" placement="top">
            <chrome-picker
                    :value="value.hex"
                    @input="$emit('input', $event)"
            />
        </b-popover>
        <b-tooltip v-if="disabled" target="color-button" triggers="hover">
            Using default value (locked)
        </b-tooltip>
        <b-tooltip v-if="!disabled" target="color-button" triggers="hover">
            Click to change
        </b-tooltip>
    </div>

</template>

<script lang="ts">
    import Vue from 'vue';
    import Component from 'vue-class-component';
    import { Chrome } from 'vue-color';

    @Component({
        props: {
            size: String,
            value: Object,
            disabled: Boolean,
        },
        components: {
            ChromePicker: Chrome,
        },
    })
    export default class PopoutColourPicker extends Vue {}
</script>
