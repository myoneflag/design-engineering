<template>
    <b-dropdown
        size="md"
        id="dropdown-1"
        :text="selectedSystem.name"
        variant="outline-dark"
        class="float-left"
        :style="'border-radius: 5px; background-color: ' + lighten(selectedSystem.color.hex, 50, 0.5)"
        :disabled="disabled"
    >
        <b-dropdown-item
            v-for="(system, index) in flowSystems"
            @click="selectSystem(index)"
            :key="system.uid"
            style="padding-right: 25px"
        >
            <span
                :style="
                    'float: left; width:20px; height:20px; margin-right:10px; background-color: ' + system.color.hex
                "
            >
            </span>
            {{ system.name }}
        </b-dropdown-item>
    </b-dropdown>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import { lighten } from "../../../src/lib/utils";
    import { FlowSystemParameters } from "../../../../common/src/api/document/drawing";
    import { InsulationJackets, InsulationMaterials } from "../../../../common/src/api/config";

    @Component({
    props: {
        disabled: Boolean,
        flowSystems: Array,
        selectedSystemUid: String
    }
})
export default class FlowSystemPicker extends Vue {
    selectSystem(index: number) {
        this.$emit("selectSystem", index);
    }

    lighten(col: string, amt: number, alpha: number) {
        return lighten(col, amt, alpha);
    }

    get selectedSystem(): FlowSystemParameters {
        const result = this.$props.flowSystems.find(
            (s: FlowSystemParameters) => s.uid === this.$props.selectedSystemUid
        );
        if (result) {
            return result;
        }
        return {
            color: { hex: "#eeeeee" },
            fluid: "",
            name: this.$props.selectedSystemUid,
            temperature: 0,
            uid: this.$props.selectedSystemUid,
            hasReturnSystem: false,
            returnIsInsulated: false,
            insulationMaterial: InsulationMaterials.calciumSilicate,
            insulationJacket: InsulationJackets.allServiceJacket,
            insulationThicknessMM: 0,
            returnMaxVelocityMS: 0,
            networks: {
                RISERS: {
                    velocityMS: 0,
                    spareCapacityPCT: 0,
                    material: "",
                    minimumPipeSize: 0,
                },
                RETICULATIONS: {
                    velocityMS: 0,
                    spareCapacityPCT: 0,
                    material: "",
                    minimumPipeSize: 0,
                },
                CONNECTIONS: {
                    velocityMS: 0,
                    spareCapacityPCT: 0,
                    material: "",
                    minimumPipeSize: 0,
                }
            }
        };
    }
}
</script>

<style></style>
