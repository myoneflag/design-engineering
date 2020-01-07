<template>
    <b-row style="position:fixed; left:300px; top:80px;">
        <b-col class="col-auto">
            <b-button-group>
                <b-button
                    variant="outline-dark"
                    class="calculationBtn source btn-sm"
                    :pressed="demandType === DemandType.PSD"
                    @click="$emit('update:demandType', DemandType.PSD)"
                    v-b-tooltip.hover="{ title: 'Demand Type' }"
                >
                    Peak
                </b-button>
                <b-button
                    variant="outline-dark"
                    class="calculationBtn source btn-sm"
                    :disabled="true"
                    :pressed="demandType === DemandType.Typical"
                    @click="$emit('update:demandType', DemandType.Typical)"
                    v-b-tooltip.hover="{ title: 'Demand Type' }"
                    >Typical</b-button
                >
                <b-button
                    variant="outline-dark"
                    class="calculationBtn source btn-sm"
                    :disabled="true"
                    :pressed="demandType === DemandType.Static"
                    @click="$emit('update:demandType', DemandType.Static)"
                    v-b-tooltip.hover="{ title: 'Demand Type' }"
                    >Static</b-button
                >
            </b-button-group>
        </b-col>
        <b-col class="col-auto">
            <b-button-group>
                <b-button variant="outline-dark" class="calculationBtn source btn-sm" @click="settings"
                    >Calculation Settings</b-button
                >
            </b-button-group>
        </b-col>
        <b-col>
            <template v-if="isCalculating">
                <b-spinner style="width: 1.8rem; height: 1.8rem;"></b-spinner>
                <label>&nbsp; Calculating</label>
            </template>
            <template v-else>
                <v-icon name="check" scale="2" color="green"></v-icon>
                <label>&nbsp; Calculations up to date</label>
            </template>
        </b-col>
    </b-row>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import FlowSystemPicker from "../../src/components/editor/FlowSystemPicker.vue";
import { EntityType } from "../../src/store/document/entities/types";
import { DemandType } from "../../src/calculations/types";

@Component({
    components: { FlowSystemPicker },
    props: {
        demandType: Number,
        isCalculating: Boolean
    }
})
export default class CalculationBar extends Vue {
    DemandType = DemandType;

    settings() {
        this.$router.push({ name: "settings/calculations" });
    }
}
</script>

<style lang="less">
.calculationBtn {
    height: 45px;
    min-width: 60px;
    font-size: 12px;
    background-color: white;
}
</style>
