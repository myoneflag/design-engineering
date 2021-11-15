<template>
    <b-row style="position:fixed; left:350px; top:80px; max-width: 400px;">
        <b-col>
            <template v-if="$props.isCalculating">
                <b-spinner style="width: 1.8rem; height: 1.8rem;"></b-spinner>
                <label>&nbsp; Calculating</label>
            </template>
            <template v-else>
                <table role="button" @click="settings">
                    <tbody>
                        <tr>
                            <td>
                                <v-icon name="check" scale="2" color="green"></v-icon>
                            </td>
                            <td>
                                <label class="calculation-setting-string" role="button">&nbsp; {{calculationSettingsString}}</label>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </template>
        </b-col>
    </b-row>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import FlowSystemPicker from "../../src/components/editor/FlowSystemPicker.vue";
import {DocumentState} from "../store/document/types";
import {DRAINAGE_METHOD_CHOICES} from "../../../common/src/api/config";
import {Catalog} from "../../../common/src/api/catalog/types";

@Component({
    components: { FlowSystemPicker },
    props: {
        isCalculating: Boolean,
        onReCalculate: Function
    }
})
export default class CalculationTopBar extends Vue {
    mounted() {
        if (!this.upToDate() && !this.$props.isCalculating) this.$props.onReCalculate();
    }

    get document(): DocumentState {
        return this.$store.getters['document/document'];
    }

    get catalog(): Catalog {
        return this.$store.getters['catalog/default'];
    }

    get calculationParams() {
        return this.document.drawing.metadata.calculationParams;
    }

    get peakFlowRateMethodName() {
        return this.catalog.psdStandards[this.calculationParams.psdMethod].name;
    }
   
   get drainageMethodName() {
       const drainageMethodName = DRAINAGE_METHOD_CHOICES.find(d => d.key === this.calculationParams.drainageMethod)?.name;
       return drainageMethodName;
    }

    get peakDwellingMethodName() {
        if (this.calculationParams.dwellingMethod) {
            return this.catalog.dwellingStandards[this.calculationParams.dwellingMethod].name;
        }
        return null;
    }

    get calculationSettingsString() {
        if(this.document.uiState.pressureOrDrainage === 'drainage'){
            return `Using "${this.drainageMethodName}"`;
        }
        else{
            if (this.peakDwellingMethodName) {
                return `Using "${this.peakFlowRateMethodName}" and "${this.peakDwellingMethodName}"`;
            } else {
                return `Using "${this.peakFlowRateMethodName}"`;
            }
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
