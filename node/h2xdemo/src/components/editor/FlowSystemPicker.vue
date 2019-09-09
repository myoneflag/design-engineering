<template>
    <b-dropdown size="md" id="dropdown-1" :text="selectedSystem.name" variant="outline-dark" class="float-left" :style="'border-radius: 5px; background-color: ' + lighten(selectedSystem.color.hex, 50, 0.5)">
        <b-dropdown-item
                v-for="(system, index) in flowSystems"
                @click="selectSystem(index)"
                :key="system.uid"
                style="padding-right: 25px"
        >
                        <span :style="'float: left; width:20px; height:20px; margin-right:10px; background-color: ' + system.color.hex">
                        </span>
            {{system.name}}
        </b-dropdown-item>
    </b-dropdown>
</template>

<script lang="ts">
    import Vue from 'vue';
    import Component from 'vue-class-component';
    import {lighten} from '@/lib/utils';
    import {FlowSystemParameters} from '@/store/document/types';

    @Component({
        props: {
            flowSystems: Array,
            selectedSystemUid: String,
        },
    })
    export default class FlowSystemPicker extends Vue {
        selectSystem(index: number) {
            this.$emit('selectSystem', index);
        }

        lighten(col: string, amt: number, alpha: number) {
            return lighten(col, amt, alpha);
        }

        get selectedSystem() {
            return this.$props.flowSystems.find((s: FlowSystemParameters) => s.uid === this.$props.selectedSystemUid);
        }
    }

</script>

<style>

</style>
