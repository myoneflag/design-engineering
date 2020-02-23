<template>
    <b-dropdown
            size="md"
            id="dropdown-1"
            :text="value"
            variant="outline-dark"
            style="background-color: white"
    >
        <b-dropdown-item
                v-for="(scale, index) in scales"
                @click="selectScale(index)"
                :key="index"
                style="padding-right: 25px"
        >
            {{ index }}
        </b-dropdown-item>
    </b-dropdown>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import { PAPER_SIZES, PaperSize, PaperSizeName, SENSIBLE_SCALES } from "../../../../common/src/api/paper-config";

    @Component({
        props: {
            disabled: Boolean,
            value: String,
        }
    })
    export default class PaperSizePicker extends Vue {
        scales = SENSIBLE_SCALES;

        selectScale(scale: string) {
            this.$emit('input', scale);
            this.$emit('scale-selected');
        }
    }
</script>

<style>

</style>
