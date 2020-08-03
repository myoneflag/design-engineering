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
                        <b-dropdown-item @click="budgetReport" variant="outline-dark" size="sm"> Bill of Materials (.xlsx) </b-dropdown-item>
                        <b-dropdown-item variant="outline-dark" size="sm" :disabled="true"
                            >DWG (Coming soon)
                        </b-dropdown-item>
                    </b-dropdown>

                    <b-button
                        v-if="profile"
                        variant="outline-dark"
                        class="calculationBtn"
                        @click="handleShareClick"
                    >
                        Share
                        <v-icon name="share-alt" scale="1" />
                    </b-button>
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
        <b-modal id="bv-modal-example" hide-footer>
            <template v-slot:modal-title>
                Get link
            </template>
            <div class="d-flex" v-if="document.shareToken">
                <div class="flex-fill">
                    <b-form-input ref="shareLinkInput" onClick="this.setSelectionRange(0, this.value.length)" :value="shareLink + document.shareToken" readonly></b-form-input>
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
import { getEntityName } from "../../../../common/src/api/document/entities/types";
import { cloneSimple } from "../../../../common/src/lib/utils";
import { generateShareLink } from "../../api/share-document";
import BaseBackedObject from "../../../src/htmlcanvas/lib/base-backed-object";
import { getFields } from "../../../src/calculations/utils";
import { CalculationFilters, DocumentState } from "../../store/document/types";
import { MainEventBus } from "../../store/main-event-bus";
import PdfSnapshotTool from "../../htmlcanvas/tools/pdf-snapshot-tool";
import { getEffectiveFilter } from "../../lib/utils";
import { User } from "../../../../common/src/models/User";
import {exportBudgetReport} from "../../htmlcanvas/lib/budget-report/budget-report";

@Component({
    components: {},
    props: {
        objects: Array,
        onChange: Function,
        canvasContext: Object,
    }
})
export default class CalculationsSidebar extends Vue {
    filterShown = true;
    shareLink: string = window.location.origin + "/";
    generate: {isLoading: boolean} = {
        isLoading: false,
    };

    mounted() {
        this.stageNewFilters();
    }

    get filters(): CalculationFilters {
        return getEffectiveFilter(this.$props.objects, this.document.uiState.calculationFilters, this.document);
    }

    get profile(): User {
        return this.$store.getters["profile/profile"];
    }

    get document(): DocumentState {
        return this.$store.getters["document/document"];
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
        MainEventBus.$emit("set-tool-handler", new PdfSnapshotTool());
    }

    budgetReport() {
        exportBudgetReport(this.$props.canvasContext);
    }

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

    handleShareClick() {
        this.$bvModal.show('bv-modal-example');
    }

    handleCopyLink() {
        const shareLinkText = <HTMLInputElement>this.$refs.shareLinkInput;

        shareLinkText.select();
        shareLinkText.setSelectionRange(0, 99999);
        
        document.execCommand("copy");

        this.$bvToast.toast('Link copied', {
            variant: "primary",
            headerClass: 'd-none'
        });
    }

    handleGenerateShareLink() {
        this.generate.isLoading = true;
        
        generateShareLink(this.document.documentId).then(res => {
            if (res.success) {
                this.$store.dispatch("document/setShareToken", res.data);
            } else {
                this.$bvToast.toast('Generate shareable link failed! Please try again.', {
                    variant: "danger",
                    title: 'Error!'
                });
            }
           
            this.generate.isLoading = false;
        });
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

#copyLink {
    color: #1a73e8;
    
    &:hover {
        color: #174ea6;
    }
}
</style>
