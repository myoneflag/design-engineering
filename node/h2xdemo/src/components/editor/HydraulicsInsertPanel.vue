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
                <b-button variant="outline-dark" class="insertBtn return btn-sm"
                          @click="$emit('insert', {entityName: entityNames.FLOW_RETURN, system: selectedSystem})"
                          v-b-tooltip.hover title="Flow Return"
                ><v-icon  name="arrow-down" scale="1.2"/></b-button>
                <b-button variant="outline-dark" class="insertBtn pipes btn-sm"
                          @click="$emit('insert', {entityName: entityNames.PIPE, system: selectedSystem})"
                          v-b-tooltip.hover title="Pipes"
                ><v-icon  name="wave-square" scale="1.2"/></b-button>
                <b-button variant="outline-dark" class="insertBtn valve btn-sm"
                          @click="$emit('insert', {entityName: entityNames.VALVE, system: selectedSystem})"
                          v-b-tooltip.hover title="Valve"
                ><v-icon  name="cross" scale="1.2"/></b-button>

            </b-button-group>
        </b-col>
        <b-col>
            <b-button-group>
                <b-button variant="outline-dark" class="insertBtn tmv btn-sm"
                          @click="$emit('insert', {entityName: entityNames.TMV, system: selectedSystem})"
                          v-b-tooltip.hover title="TMV"
                ></b-button>
                <b-button variant="outline-dark" class="insertBtn tmv btn-sm"
                          @click="$emit('insert', {entityName: entityNames.TMV, system: selectedSystem, tmvHasCold: true})"
                          v-b-tooltip.hover title="TMV with cold water out"
                ></b-button>
                <b-button variant="outline-dark" class="insertBtn shower btn-sm"
                          @click="$emit('insert', {entityName: entityNames.FIXTURE, system: selectedSystem, fixtureName: 'shower'})"
                          v-b-tooltip.hover title="Shower"
                >Shr</b-button>
                <b-button variant="outline-dark" class="insertBtn basin btn-sm"
                          @click="$emit('insert', {entityName: entityNames.FIXTURE, system: selectedSystem, fixtureName: 'basin'})"
                          v-b-tooltip.hover title="Basin"
                >B</b-button>
                <b-button variant="outline-dark" class="insertBtn waterCloset btn-sm"
                          @click="$emit('insert', {entityName: entityNames.FIXTURE, system: selectedSystem, fixtureName: 'wc'})"
                          v-b-tooltip.hover title="Flush Toilet"
                >WC</b-button>
            </b-button-group>
        </b-col>
    </b-row>
</template>

<script lang="ts">
    import Vue from 'vue';
    import Component from 'vue-class-component';
    import FlowSystemPicker from '@/components/editor/FlowSystemPicker.vue';
    import {EntityType} from '@/store/document/entities/types';

    @Component({
        components: {FlowSystemPicker},
        props: {
            flowSystems: Array,
        },
    })
    export default class HydraulicsInsertPanel extends Vue {
        get entityNames() {
            return EntityType;
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

    .insertBtn.tmv {
        background-image: url('~@/assets/object-icons/mixer-valves/tmv/tmv.png');
        background-size: 35px;
        background-repeat: no-repeat;
        background-position: center;
    }
</style>
