<template>
    <b-container class="calculationSidePanel">
        <b-row>
            <b-col>
                <b-button-group
                        style="margin-left: -250px"
                >
                    <b-button
                            variant="outline-dark"
                            class="calculationBtn"
                            @click="togglePopup('warning')"
                            :pressed="popupShown === 'warning'"
                    >
                        Warnings
                        <v-icon name="caret-down" scale="1" />
                    </b-button>

                    <b-button
                            variant="outline-dark"
                            class="calculationBtn"
                            @click="togglePopup('filter')"
                            :pressed="popupShown === 'filter'"
                    >
                        Filters
                        <v-icon name="caret-down" scale="1" />
                    </b-button>
                </b-button-group>
            </b-col>
        </b-row>
        <b-row v-if="popupShown === 'filter'">
            <b-col>
                <div class="filterPanel">
                    <div v-for="(objectFilters, type) in filterSettings" :key="type">
                        <template>
                            <h4>{{ objectFilters.name }}</h4>
                            <b-check
                                :disabled="!objectFilters.enabled"
                                v-for="(filter, prop) in objectFilters.filters"
                                :checked="filter.enabled"
                                @change="onSettingCheck(type, prop, $event)"
                                :key="prop"
                            >
                                {{ filter.name }}
                            </b-check>
                            <hr />
                        </template>
                    </div>
                    <div v-for="(objectFilters, type) in combinedfilters" :key="type">
                        <template v-if="Object.keys(objectFilters.filters).length">
                            <b-check
                                :disabled="!isCustomfilter"
                                :checked="objectFilters.enabled"
                                @input="onObjectCheck(type, $event)"
                            >
                                <h4>{{ objectFilters.name }}</h4>
                            </b-check>
                            <b-check
                                :disabled="!objectFilters.enabled || !isCustomfilter"
                                v-for="(filter, prop) in objectFilters.filters"
                                :checked="filter.enabled"
                                @input="filter.targets? onMultiCheck(type, filter.targets, $event) : onCheck(type, filter.name, $event)"
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
        <warnings
            v-if="popupShown === 'warning'"
            :on-change="$props.onChange"
        />
        <b-modal id="bv-modal-example" hide-footer>
            <template v-slot:modal-title>
                Get link
            </template>
            <div class="d-flex" v-if="document.shareToken">
                <div class="flex-fill">
                    <b-form-input
                        ref="shareLinkInput"
                        onClick="this.setSelectionRange(0, this.value.length)"
                        :value="shareLink + document.shareToken"
                        readonly
                    ></b-form-input>
                </div>
                <b-button @click="handleCopyLink" id="copyLink" class="ml-2" variant="light">Copy link</b-button>
            </div>
            <div v-else>
                <b-button @click="handleGenerateShareLink" variant="success" block>
                    Generate shareable link
                    <b-spinner v-if="generate.isLoading" style="width: 1.0rem; height: 1.0rem;"></b-spinner>
                </b-button>
            </div>
        </b-modal>
    </b-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { cloneSimple } from "../../../../common/src/lib/utils";
import { generateShareLink } from "../../api/share-document";
import PdfSnapshotTool from "../../htmlcanvas/tools/pdf-snapshot-tool";
import { GlobalStore } from "../../htmlcanvas/lib/global-store";
import { exportBudgetReport } from "../../htmlcanvas/lib/budget-report/budget-report";
import { globalStore } from "../../store/document/mutations";
import {
    CalculationFilters,
    CalculationFilterSettings,
    DocumentState,
    CalculationFilterSettingType,
    FilterSettingViewKeyValues,
} from "../../store/document/types";
import { MainEventBus } from "../../store/main-event-bus";
import { getEffectiveFilter, getFilterSettings, getCombinedFilter } from "../../lib/filters/results";
import { User } from "../../../../common/src/models/User";
import { Catalog } from "../../../../common/src/api/catalog/types";
import { jsonExport } from "../../htmlcanvas/lib/json-export/export-json"
import Warnings from "./Warnings.vue";
import { isCalculated } from "../../store/document/calculations";

@Component({
    components: {
        Warnings
    },
    props: {
        objects: Array,
        onChange: Function,
        canvasContext: Object
    }
})
export default class CalculationsSidebar extends Vue {
    popupShown = '';
    shareLink: string = window.location.origin + "/";
    generate: { isLoading: boolean } = {
        isLoading: false
    };
    $bvToast: any;
    $bvModal: any;
    entity: any;

    mounted() {
        this.$watch(
            () => this.document.uiState.warningFilter.activeEntityUid,
            () => {
                this.popupShown = 'warning';
                this.$props.onChange();
            }
        );
        this.$watch(
            () => this.document.uiState.lastCalculationId,
            () => {
                this.popupShown = this.hasWarning() ? 'warning' : 'filter';
            }
        );
        /** have any warnings, please show the Warnings panel expanded */
        this.popupShown = this.hasWarning() ? 'warning' : 'filter';
        this.stageNewFilters();
    }

    get globalStore(): GlobalStore {
        return globalStore;
    }

    get filters(): CalculationFilters {
        return getEffectiveFilter(
            this.$props.objects,
            this.document.uiState.calculationFilters,
            this.filterSettings,
            this.document,
            this.catalog
        );
    }

    get filterSettings(): CalculationFilterSettings {
        return getFilterSettings(
            this.document.uiState.calculationFilterSettings,
            this.document,
        );
    }

    get combinedfilters(): CalculationFilters {
        return getCombinedFilter(this.filters);
    }

    get isCustomfilter(): boolean {
        return this.filterSettings.view.filters['custom'].enabled;
    }

    get catalog(): Catalog {
        return this.$store.getters["catalog/default"];
    }

    get profile(): User {
        return this.$store.getters["profile/profile"];
    }

    get document(): DocumentState {
        return this.$store.getters["document/document"];
    }

    hasWarning(): boolean {
        for (const o of this.globalStore.values()) {
            if (isCalculated(o.entity)) {
                const calculation = this.globalStore.getOrCreateCalculation(o.entity);
                if (calculation.warnings?.length) return true;
            }
        }
        return false;
    }
    
    /* toggle Warnings and Filters */
    togglePopup(target: string) {
        if (this.popupShown === target) this.popupShown = '';
        else this.popupShown = target;
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

    pdfSnapshot() {
        this.$store.dispatch("document/setPreviewMode", true);
        MainEventBus.$emit("redraw");
        MainEventBus.$emit("set-tool-handler", new PdfSnapshotTool());
    }

    budgetReport() {
        exportBudgetReport(this.$props.canvasContext);
    }

    onSettingCheck(eName: string, prop: string, value: boolean, shouldChange: boolean = true) {
        switch (eName) {
            case CalculationFilterSettingType.Systems:
                this.document.uiState.calculationFilterSettings[CalculationFilterSettingType.Systems].filters[prop].enabled = value;
                if (prop === "all") {
                    for (const cName in this.document.uiState.calculationFilterSettings.systems.filters) {
                        Vue.set(
                            this.document.uiState.calculationFilterSettings.systems.filters[cName],
                            "enabled",
                            value
                        );
                    }
                }
                break;
            case CalculationFilterSettingType.View:
                this.document.uiState.calculationFilterSettings[CalculationFilterSettingType.View].filters[prop as FilterSettingViewKeyValues].enabled = value;
                switch (prop) {
                    case "all":
                        for (const cName in this.document.uiState.calculationFilterSettings.view.filters) {
                            if (cName == "custom") {
                                if (value) {
                                    Vue.set(
                                        this.document.uiState.calculationFilterSettings.view.filters[cName],
                                        "enabled",
                                        false
                                    );
                                }
                            } else {
                                Vue.set(
                                    this.document.uiState.calculationFilterSettings.view.filters[cName as FilterSettingViewKeyValues],
                                    "enabled",
                                    value
                                );
                            }
                        }
                        break;
                    case "custom":
                        if (value) {
                            for (const cName in this.document.uiState.calculationFilterSettings.view.filters) {
                                if (cName !== "custom") {
                                    Vue.set(
                                        this.document.uiState.calculationFilterSettings.view.filters[cName as FilterSettingViewKeyValues],
                                        "enabled",
                                        false
                                    );
                                }
                            }
                        }
                        break;
                    default:
                        if (value) {
                            Vue.set(
                                this.document.uiState.calculationFilterSettings.view.filters["custom"],
                                "enabled",
                                false
                            );
                        }
                        break;
                }
            default:
                break;
        }
        if (shouldChange) {
            this.$props.onChange();
        }
    }

    onMultiCheck(eName: string, props: string[], value: boolean, shouldChange: boolean = true) {
        for (const prop of props) {
            this.onCheck(eName, prop, value, shouldChange);
        }
    }

    onCheck(eName: string, prop: string, value: boolean, shouldChange: boolean = true) {
        if (!(eName in this.document.uiState.calculationFilters)) {
            Vue.set(this.document.uiState.calculationFilters, eName, {
                name: this.filters[eName].name,
                enabled: false,
                filters: {}
            });
        }

        if (!(prop in this.document.uiState.calculationFilters[eName].filters)) {
            Vue.set(this.document.uiState.calculationFilters[eName].filters, prop, {
                name: this.filters[eName].filters[prop].name,
                enabled: value
            });
        }
        this.document.uiState.calculationFilters[eName].filters[prop].enabled = value;
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

    handleShareClick() {
        this.$bvModal.show("bv-modal-example");
    }

    handleCopyLink() {
        const shareLinkText = <HTMLInputElement>this.$refs.shareLinkInput;

        shareLinkText.select();
        shareLinkText.setSelectionRange(0, 99999);

        document.execCommand("copy");

        this.$bvToast.toast("Link copied", {
            variant: "primary",
            headerClass: "d-none"
        });
    }

    handleGenerateShareLink() {
        this.generate.isLoading = true;

        generateShareLink(this.document.documentId).then((res) => {
            if (res.success) {
                this.$store.dispatch("document/setShareToken", res.data);
            } else {
                this.$bvToast.toast("Generate shareable link failed! Please try again.", {
                    variant: "danger",
                    title: "Error!"
                });
            }

            this.generate.isLoading = false;
        });
    }

    handleJsonExport() {

        const result = jsonExport(this.document, this.globalStore)

        const data = JSON.stringify(result, null, 4);
        const blob = new Blob([data], { type: "text/plain" });
        const e = document.createEvent("MouseEvents"),
            a = document.createElement("a");
        a.download = this.document.drawing.metadata.generalInfo.title + ".json";
        a.href = window.URL.createObjectURL(blob);
        a.dataset.downloadurl = ["text/json", a.download, a.href].join(":");
        e.initEvent("click", true, false);
        a.dispatchEvent(e);
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
    width: 400px;
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

    max-height: -webkit-calc(125vh - 30px);
    overflow-y: auto;
    overflow-x: hidden;
    text-align: left;
}

#copyLink {
    color: #1a73e8;

    &:hover {
        color: #174ea6;
    }
}
</style>
