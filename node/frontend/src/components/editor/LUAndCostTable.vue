<template>
    <div  class="lu-cost-table"
          :style="document.uiState.costAndLUTableOpen ? '' : 'margin-bottom: 35px'"
          @mouseenter="onMouseEnter"
          @mouseleave="onMouseLeave"
    >
        <table>
            <tbody>
                <tr>
                    <template v-if="document.uiState.costAndLUTableOpen">

                        <td  valign="top">
                            <b-table :fields="luFields" :items="luItems" small class="result-table"
                                     v-b-tooltip.hover title="Inc. Continuous Flow and Reticulation Spare Capacity">
                            </b-table>
                        </td>
                        <td style="width: 10px"/>
                        <td  valign="top">
                            <b-table :fields="costFields" :items="costItems" small class="result-table"
                                     v-b-tooltip.hover title="Est. Since last calculation. Level est. excludes risers.">
                            </b-table>
                            <b-badge
                                    v-if="!hasCalculated()"
                                    variant="warning"
                                    v-b-tooltip.hover title='Click "Results" to Calculate. Cost estimates will show here.'
                            >Calculate to show</b-badge>
                            <b-badge
                                    v-else-if="!calculationsUpToDate()"
                                    variant="warning"
                                    v-b-tooltip.hover title="Calculate to update"
                            >Outdated</b-badge>
                            <div style="bottom: 0; border-style: solid; border-width: 1px; border-radius: 5px; border-color: #aaa">
                                <i class="small-label"><v-icon name="info-circle" style="margin-top:-5px"/>{{psdMethodName}}</i>
                            </div>
                        </td>
                        <td>
                            <b-button @click="onCollapseClicked" variant="outline-dark" size="sm">
                                <v-icon name="chevron-left"></v-icon>
                            </b-button>
                        </td>
                    </template>
                    <template v-else>
                        <td>
                            <b-button @click="onUncollapseClicked" variant="outline-dark">
                                <v-icon name="chevron-right"></v-icon><v-icon name="chevron-right"></v-icon>
                            </b-button>
                        </td>
                    </template>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import {DocumentState} from "../../store/document/types";
    import {
        addFinalPsdCounts,
        Cost,
        countPsdUnits,
        getDrainageUnitName,
        lookupFlowRate,
        PsdUnitsByFlowSystem,
        roundNumber,
        zeroFinalPsdCounts
    } from "../../calculations/utils";
    import {Catalog} from "../../../../common/src/api/catalog/types";
    import {NetworkType} from "../../../../common/src/api/document/drawing";
    import {ALL_DRAINAGE_SYSTEM_UIDS, StandardFlowSystemUids} from "../../../../common/src/api/config";
    import {convertMeasurementSystem, Units} from "../../../../common/src/lib/measurements";
    import { I18N } from "@../../../common/src/api/locale/values";

    @Component({
        props: {
            selectedEntities: Array,
            globalStore: Map,
            projectLUs: Object,
            focusLUs: Object,

            projectCost: Object,
            focusCost: Object,

            focusName: String,
        }
    })
    export default class LUAndCostTable extends Vue {
        mouseEntered = false;

        get luFields() {
            return ["PSD", this.$props.focusName, "Project"];
        }

        get costFields() {
            return ["Cost", this.$props.focusName, "Project"];
        }

        get document(): DocumentState {
            return this.$store.getters['document/document'];
        }

        get catalog(): Catalog {
            return this.$store.getters["catalog/default"];
        }

        get nodes() {
            return this.$store.getters["customEntity/nodes"];
        }

        get psdUnits() {
            return countPsdUnits(this.$props.selectedEntities, this.document, this.catalog, this.$props.globalStore, this.nodes);
        }

        cost2str(cost: Cost) {
            return Number(cost.value).toLocaleString(undefined, {style: 'currency', currency: I18N.currency[this.document.locale]}) + (cost.exact ? '' : '+')
        }

        get costItems() {
            if (!this.hasCalculated()) {
                return [];
            }
            return [{
                "Cost": "Est.",
                [this.$props.focusName]: this.cost2str(this.$props.focusCost),
                "Project": this.cost2str(this.$props.projectCost),
            }]
        }

        get luItems() {
            let focusedUnits: PsdUnitsByFlowSystem = this.$props.focusLUs;
            let projectUnits: PsdUnitsByFlowSystem | null = this.$props.projectLUs;
            if (focusedUnits == null) {
                focusedUnits = {
                    /**/
                };
            }
            if (projectUnits == null) {
                projectUnits = {

                };
            }

            for (const sys of [
                StandardFlowSystemUids.ColdWater,
                StandardFlowSystemUids.WarmWater,
                StandardFlowSystemUids.HotWater,
                StandardFlowSystemUids.Gas,
                ...ALL_DRAINAGE_SYSTEM_UIDS,
            ]) {
                for (const units of [focusedUnits, projectUnits]) {
                    if (!units.hasOwnProperty(sys)) {
                        units[sys] = zeroFinalPsdCounts();
                    }
                }
            }

            let x = 80;
            const drainageUnits = getDrainageUnitName(this.document.drawing.metadata.calculationParams.drainageMethod);
            const res: any[] = [{"PSD": "Cold"}, {"PSD": "Hot"}, {"PSD": "Gas"}, {'PSD': drainageUnits.abbreviation}];
            for (const [units, fieldName] of [[focusedUnits, this.$props.focusName], [projectUnits, "Project"]]) {
                let coldFR: number | null | undefined;
                let hotFR: number | null | undefined;
                let gasMJH: number | null | undefined;
                try {
                    const res = lookupFlowRate(
                        units[StandardFlowSystemUids.ColdWater],
                        this.document,
                        this.catalog,
                        StandardFlowSystemUids.ColdWater,
                        true
                    );
                    coldFR = res ? res.flowRateLS : null;
                } catch (e) {
                    // Exception here
                    console.warn('Cold water results flow rate exception', e)
                }
                try {
                    const res = lookupFlowRate(
                        addFinalPsdCounts(units[StandardFlowSystemUids.HotWater], units[StandardFlowSystemUids.WarmWater]),
                        this.document,
                        this.catalog,
                        StandardFlowSystemUids.HotWater,
                        true
                    );
                    hotFR = res ? res.flowRateLS : null;
                } catch (e) {
                    console.warn('Hot water results flow rate exception', e)
                }
                gasMJH = units[StandardFlowSystemUids.Gas].gasMJH;

                let coldSpareText: string = "error";
                let hotSpareText: string = "error";
                let coldText: string = "error";
                let hotText: string = "error";
                let drainageText: string = 'error';
                let coldUnits: Units | string = '';
                let hotUnits: Units | string = '';
                let gasUnits: Units | string = '';
                if (coldFR != null) {
                    let coldFRSpare: number | string | null =
                        coldFR *
                        (1 +
                            0.01 *
                            this.document.drawing.metadata.flowSystems.find((s) => s.uid === StandardFlowSystemUids.ColdWater)!
                                .networks[NetworkType.RETICULATIONS].spareCapacityPCT);

                    [coldUnits, coldFRSpare] =
                        convertMeasurementSystem(this.document.drawing.metadata.units, Units.LitersPerSecond, coldFRSpare);
                    coldSpareText = Number(coldFRSpare).toPrecision(3);
                    coldText = coldFR.toPrecision(3);
                }
                if (hotFR != null) {
                    let hotFRSpare: number | string | null =
                        hotFR *
                        (1 +
                            0.01 *
                            this.document.drawing.metadata.flowSystems.find((s) => s.uid === StandardFlowSystemUids.WarmWater)!
                                .networks[NetworkType.RETICULATIONS].spareCapacityPCT);
                    [hotUnits, hotFRSpare] =
                        convertMeasurementSystem(this.document.drawing.metadata.units, Units.LitersPerSecond, hotFRSpare);
                    hotSpareText = Number(hotFRSpare).toPrecision(3);
                    hotText = hotFR.toPrecision(3);
                }

                let gasMJHSpare: string | number | null = '';
                let gasMJHText: string = 'error';
                if (gasMJH != null) {
                    [gasUnits, gasMJHSpare] = convertMeasurementSystem(this.document.drawing.metadata.units, Units.MegajoulesPerHour, gasMJH);
                    gasMJHText = Number(gasMJHSpare).toFixed(1);
                }
                let drainageUnits = 0;
                for (const suid of ALL_DRAINAGE_SYSTEM_UIDS) {
                    drainageUnits += units[suid].drainageUnits;
                }
                if (!isNaN(drainageUnits)) {
                    drainageText = '' + roundNumber(drainageUnits,2)
                }

                res[0][fieldName] = coldSpareText + " " + coldUnits;
                res[1][fieldName] = hotSpareText + " " + hotUnits;
                res[2][fieldName] = gasMJHText + " " + gasUnits;
                res[3][fieldName] = drainageText;
            }



            return res;
        }

        get psdMethodName() {
            let psdMethodName = this.catalog.psdStandards[this.document.drawing.metadata.calculationParams.psdMethod].name;
            if (this.document.drawing.metadata.calculationParams.dwellingMethod) {
                psdMethodName = this.catalog.dwellingStandards[this.document.drawing.metadata.calculationParams.dwellingMethod].name;
            }
            return psdMethodName;
        }

        calculationsUpToDate() {
            return this.$store.getters["document/calculationsUpToDate"];
        }

        hasCalculated() {
            return this.document.uiState.lastCalculationId > 0;
        }

        onCollapseClicked() {
            this.document.uiState.costAndLUTableOpen = false;
        }

        onUncollapseClicked() {
            this.document.uiState.costAndLUTableOpen = true;
        }

        onMouseEnter() {
            this.mouseEntered = true;
        }

        onMouseLeave() {
            this.mouseEntered = false;
        }
    }
</script>

<style lang="less">
    .lu-cost-table {
        position: fixed;
        bottom: 75px;
        border: black 1px solid;
        background-color: white;

        border-left: none;
        border-radius: 0px 5px 5px 0px;
        margin: auto;
    }
    .result-table td {
        font-size: 14px;
        padding: 0 5px 0 5px;
    }
    .result-table th {
        font-size: 14px;
    }
    .result-table {
        margin-bottom: 5px;
    }
    .small-label {
        font-size: 13px;
    }
</style>
