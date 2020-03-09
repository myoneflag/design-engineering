<template>
    <b-container class="calculationSidePanel">
        <b-row>
            <b-col>
                <b-button-group>
                    <b-button
                        variant="outline-dark"
                        class="calculationBtn"
                        @click="filterShown = !filterShown"
                        :pressed="filterShown"
                    >
                        Filters
                        <v-icon name="caret-down" scale="1" />
                    </b-button>

                    <b-dropdown variant="outline-dark" size="sm" class="calculationBtn" text="Export">
                        <b-dropdown-item @click="pdfSnapshot" variant="outline-dark" size="sm"> PDF </b-dropdown-item>
                        <b-dropdown-item variant="outline-dark" size="sm" :disabled="true"
                            >DWG (Coming soon)
                        </b-dropdown-item>
                    </b-dropdown>
                </b-button-group>
            </b-col>
        </b-row>
        <b-row v-if="filterShown">
            <b-col>
                <div class="filterPanel">
                    <div v-for="(objectFilters, type) in filters" :key="type">
                        <template v-if="Object.keys(objectFilters.filters).length">
                            <b-check :checked="objectFilters.enabled" @input="onObjectCheck(type, $event)">
                                <h4>{{ objectFilters.name }}</h4>
                            </b-check>
                            <b-check
                                :disabled="!objectFilters.enabled"
                                v-for="(filter, prop) in objectFilters.filters"
                                :checked="filter.enabled"
                                @input="onCheck(type, filter.name, $event)"
                                :key="prop"
                            >
                                {{ filter.name }}
                            </b-check>
                            <hr />
                        </template>
                    </div>
                </div>
            </b-col>
        </b-row>
    </b-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { CalculationFilters, DocumentState } from "../../../src/store/document/types";
import { getEntityName } from "../../../../common/src/api/document/entities/types";
import BaseBackedObject from "../../../src/htmlcanvas/lib/base-backed-object";
import { getFields } from "../../../src/calculations/utils";
import { cloneSimple } from "../../../../common/src/lib/utils";
import { MainEventBus } from "../../store/main-event-bus";
import PdfSnapshotTool from "../../htmlcanvas/tools/pdf-snapshot-tool";
import { getEffectiveFilter } from "../../lib/utils";

@Component({
    components: {},
    props: {
        objects: Array,
        onChange: Function
    }
})
export default class CalculationsSidebar extends Vue {
    filterShown = true;

    mounted() {
        this.stageNewFilters();
    }

    get filters(): CalculationFilters {
        return getEffectiveFilter(this.$props.objects, this.document.uiState.calculationFilters, this.document);
    }

    stageNewFilters() {
        const filters = cloneSimple(this.filters);
        for (const eType in filters) {
            // noinspection JSUnfilteredForInLoop
            if (filters.hasOwnProperty(eType)) {
                for (const prop in filters[eType].filters) {
                    if (filters[eType].filters.hasOwnProperty(prop)) {
                        this.onCheck(eType, prop, filters[eType].filters[prop].enabled, false);
                    }
                }
                this.onObjectCheck(eType, filters[eType].enabled, false);
            }
        }
        this.$props.onChange();
    }

    get document(): DocumentState {
        return this.$store.getters["document/document"];
    }

    pdfSnapshot() {
        MainEventBus.$emit("set-tool-handler", new PdfSnapshotTool());
    }

    fullPdfExport() {}

    onCheck(eType: string, prop: string, value: boolean, shouldChange: boolean = true) {
        if (!(eType in this.document.uiState.calculationFilters)) {
            Vue.set(this.document.uiState.calculationFilters, eType, {
                name: this.filters[eType].name,
                enabled: false,
                filters: {}
            });
        }

        if (!(prop in this.document.uiState.calculationFilters[eType].filters)) {
            Vue.set(this.document.uiState.calculationFilters[eType].filters, prop, {
                name: this.filters[eType].filters[prop].name,
                enabled: value
            });
        }
        this.document.uiState.calculationFilters[eType].filters[prop].enabled = value;
        if (shouldChange) {
            this.$props.onChange();
        }
    }

    onObjectCheck(eType: string, value: boolean, shouldChange: boolean = true) {
        if (!(eType in this.document.uiState.calculationFilters)) {
            Vue.set(this.document.uiState.calculationFilters, eType, {
                name: this.filters[eType].name,
                enabled: false,
                filters: {}
            });
        }

        this.document.uiState.calculationFilters[eType].enabled = value;

        if (shouldChange) {
            this.$props.onChange();
        }
    }
}
</script>

<style lang="less">
.calculationBtn {
    background-color: white;
}

.calculationSidePanel {
    position: fixed;
    right: 20px;
    min-height: 100px;
    top: 80px;
    width: 300px;
}

.filterPanel {
    position: fixed;
    top: 15%;
    right: 20px;
    min-width: 300px;
    max-width: 300px;
    min-height: 100px;
    background: white;
    border: gray solid 1px;
    border-radius: 5px;
    padding: 20px;

    max-height: -webkit-calc(100vh - 30px);
    overflow-y: auto;
    overflow-x: hidden;
    text-align: left;
}
</style>
