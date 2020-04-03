<template>
    <b-row style="position:fixed; left:300px; top:80px;">
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
            <template v-else-if="upToDate()">
                <v-icon name="check" scale="2" color="green"></v-icon>
                <label>&nbsp; Calculations up to date</label>
            </template>
            <template v-else>
                <b-button variant="warning" @click="reCalculate">Recalculate</b-button>
            </template>
        </b-col>
    </b-row>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import FlowSystemPicker from "../../src/components/editor/FlowSystemPicker.vue";

@Component({
    components: { FlowSystemPicker },
    props: {
        isCalculating: Boolean,
        onReCalculate: Function
    }
})
export default class CalculationTopBar extends Vue {
    settings() {
        this.$router.push({ name: "settings/calculations" });
    }

    upToDate() {
        return this.$store.getters["document/calculationsUpToDate"];
    }

    reCalculate() {
        this.$props.onReCalculate();
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
