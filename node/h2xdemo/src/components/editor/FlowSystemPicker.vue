<template>
    <b-dropdown size="md" id="dropdown-1" :text="selectedSystem.name" variant="outline-dark" class="float-left" :style="'border-radius: 5px; background-color: ' + lighten(selectedSystem.color.hex, 30)">
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
    import Component from "vue-class-component";
    import {lightenA} from '@/lib/utils';

    @Component({
        props: {
            flowSystems: Array,
            selectedSystem: Object,
        }
    })
    export default class FlowSystemPicker extends Vue {
        selectSystem(index: number) {
            this.$emit('selectSystem', index);
        }

        lighten(col: string, amt: number) {
            return lightenA(col, amt);
        }
    }

</script>

<style>

</style>
