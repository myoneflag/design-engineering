<template>
    <b-dropdown size="sm" id="dropdown-1" :text="this.size" variant="secondary" :disabled="disabled">
        <b-dropdown-item v-for="dims in paperSizes" @click="changeSize(dims)" :key="dims.name">
            {{ dims.name }}
        </b-dropdown-item>
    </b-dropdown>
</template>

<script lang="ts">

    import Component from "vue-class-component";
    import Vue from 'vue';
    import {PaperSize, PAPER_SIZES} from "@/config";

    @Component({
        props: {
            initialSize: String,
            onchange: Function,
            disabled: Boolean,
        }
    })
    export default class PaperSizeSelector extends Vue {
        size = (this as any).initialSize;

        get paperSizes() {
            return PAPER_SIZES;
        }

        changeSize(newSize: PaperSize) {
            this.size = newSize.name;
            if (this.$props.onchange) {
                this.$props.onchange(newSize);
            }
        }
    };
</script>
