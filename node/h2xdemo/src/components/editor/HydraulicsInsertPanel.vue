<template>
    <b-row style="position:fixed; left:300px; top:80px;">
        <b-col>
            <b-button-group>
                <FlowSystemPicker
                        :selected-system-uid="selectedSystem.uid"
                        :flow-systems="flowSystems"
                        @selectSystem="selectSystem"
                />
                <b-button variant="outline-dark" class="insertBtn source btn-sm"
                          @click="$emit('insert', {entityName: entityNames.FLOW_SOURCE, system: selectedSystem})"
                          v-b-tooltip.hover title="Flow Source"
                ><v-icon  name="arrow-up" scale="1.2"/></b-button>
                <b-button variant="outline-dark" class="insertBtn sink btn-sm"
                          @click="$emit('insert', {entityName: entityNames.FLOW_SINK, system: selectedSystem})"
                          v-b-tooltip.hover title="Flow Sink"
                ><v-icon  name="arrow-down" scale="1.2"/></b-button>
                <b-button variant="outline-dark" class="insertBtn pipes btn-sm"
                          @click="$emit('insert', {entityName: entityNames.PIPE, system: selectedSystem})"
                          v-b-tooltip.hover title="Pipes"
                ><v-icon  name="wave-square" scale="1.2"/></b-button>
                <b-button variant="outline-dark" class="insertBtn pipes btn-sm"
                          @click="$emit('insert', {entityName: entityNames.VALVE, system: selectedSystem})"
                          v-b-tooltip.hover title="Valve"
                ><v-icon  name="cross" scale="1.2"/></b-button>
            </b-button-group>
        </b-col>
    </b-row>
</template>

<script lang="ts">
    import Vue from 'vue';
    import Component from 'vue-class-component';
    import {ENTITY_NAMES} from '@/store/document/entities';
    import FlowSystemPicker from '@/components/editor/FlowSystemPicker.vue';

    @Component({
        components: {FlowSystemPicker},
        props: {
            flowSystems: Array,
        },
    })
    export default class HydraulicsInsertPanel extends Vue {
        get entityNames() {
            return ENTITY_NAMES;
        }

        selectedSystemId: number = 0;

        get selectedSystem() {
            return this.$props.flowSystems[this.selectedSystemId];
        }

        selectSystem(value: number) {
            this.selectedSystemId = value;
        }
    }
</script>

<style lang="less">
    .insertBtn {
        height: 45px;
        width: 50px;
        font-size: 12px;
        background-color:white;
    }
</style>
