<template>
    <b-row style="position:fixed; left:300px; top:80px; max-width: 400px;">
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
                <table>
                    <tbody>
                    <tr>
                        <td>
                            <v-icon name="check" scale="2" color="green"></v-icon>
                        </td>
                        <td>
                            <label class="calculation-setting-string">{{&nbsp;calculationSettingsString}}</label>
                        </td>
                    </tr>
                    </tbody>
                </table>
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
import {DocumentState} from "../store/document/types";
import CatalogState from "../store/catalog/types";
import {getPsdMethods} from "../../../common/src/api/config";
import {Catalog} from "../../../common/src/api/catalog/types";

@Component({
    components: { FlowSystemPicker },
    props: {
        isCalculating: Boolean,
        onReCalculate: Function
    }
})
export default class CalculationTopBar extends Vue {
    get document(): DocumentState {
        return this.$store.getters['document/document'];
    }

    get catalog(): Catalog {
        return this.$store.getters['catalog/default'];
    }

    get peakFlowRateMethodName() {
        return this.catalog.psdStandards[this.document.drawing.metadata.calculationParams.psdMethod].name;
    }

    get peakDwellingMethodName() {
        if (this.document.drawing.metadata.calculationParams.dwellingMethod) {
            return this.catalog.dwellingStandards[this.document.drawing.metadata.calculationParams.dwellingMethod].name;
        }
        return null;
    }

    get calculationSettingsString() {
        if (this.peakDwellingMethodName) {
            return `Using "${this.peakFlowRateMethodName}" and "${this.peakDwellingMethodName}"`;
        } else {
            return `Using "${this.peakFlowRateMethodName}"`;
        }
    }

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
    .calculation-setting-string {
        font-size: 12px;
    }
</style>
