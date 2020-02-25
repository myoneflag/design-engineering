<template>
    <b-dropdown size="md" id="dropdown-1" :text="value.name" variant="outline-dark" style="background-color: white">
        <b-dropdown-item
            v-for="(size, index) in paperSizes"
            @click="selectSize(index)"
            :key="index"
            style="padding-right: 25px"
        >
            {{ size.name }}
        </b-dropdown-item>
    </b-dropdown>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { PAPER_SIZES, PaperSize, PaperSizeName } from "../../../../common/src/api/paper-config";

@Component({
    props: {
        disabled: Boolean,
        value: Object
    }
})
export default class PaperSizePicker extends Vue {
    paperSizes = PAPER_SIZES;

    selectSize(size: PaperSizeName) {
        this.$emit("input", this.getPaperSize(size));
        this.$emit("paper-selected");
    }

    getPaperSize(name: string): PaperSize {
        if (name in this.paperSizes) {
            return this.paperSizes[name as PaperSizeName];
        }
        throw new Error("Invalid paper size");
    }
}
</script>

<style></style>
