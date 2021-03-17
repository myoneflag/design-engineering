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

                    <b-dropdown variant="outline-dark" size="sm" class="calculationBtn" text="Export (*)" >
                        <b-dropdown-item @click="pdfSnapshot" variant="outline-dark" size="sm"> 
                            PDF
                        </b-dropdown-item>
                        <b-dropdown-item @click="budgetReport" variant="outline-dark" size="sm"> 
                            Bill of Materials (.xlsx) <b-badge>New</b-badge> 
                        </b-dropdown-item>
                        <b-dropdown-item variant="outline-dark" size="sm" :disabled="true"
                            >DWG (Coming soon)
                        </b-dropdown-item>
                        <b-dropdown-item @click="jsonExport" variant="outline-dark" size="sm"
                            >JSON (Revit Plugin)
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
import { EntityType } from "../../../../common/src/api/document/entities/types";
import { cloneSimple } from "../../../../common/src/lib/utils";
import { generateShareLink } from "../../api/share-document";
import PdfSnapshotTool from "../../htmlcanvas/tools/pdf-snapshot-tool";
import { GlobalStore } from "../../htmlcanvas/lib/global-store";
import { exportBudgetReport } from "../../htmlcanvas/lib/budget-report/budget-report";
import { getFields } from "../../../src/calculations/utils";
import { globalStore } from "../../store/document/mutations";
import { CalculationFilters, DocumentState } from "../../store/document/types";
import { MainEventBus } from "../../store/main-event-bus";
import { getEffectiveFilter } from "../../lib/utils";
import { User } from "../../../../common/src/models/User";
import { Catalog } from "../../../../common/src/api/catalog/types";
import { Coord, Coord3D, NetworkType } from "../../../../common/src/api/document/drawing";
import { fillPipeDefaultFields } from "../../../../common/src/api/document/entities/pipe-entity";
import Pipe from "../../htmlcanvas/objects/pipe";
import { fillDirectedValveFields } from "../../store/document/entities/fillDirectedValveFields";
import { ValveType } from "../../../../common/src/api/document/entities/directed-valves/valve-types";
import Fitting from "../../htmlcanvas/objects/fitting";
import Riser from "../../htmlcanvas/objects/riser";
import { BaseBackedConnectable } from "../../htmlcanvas/lib/BackedConnectable";
import RiserEntity, { fillRiserDefaults } from "../../../../common/src/api/document/entities/riser-entity";

@Component({
    components: {},
    props: {
        objects: Array,
        onChange: Function,
        canvasContext: Object
    }
})
export default class CalculationsSidebar extends Vue {
    filterShown = true;
    shareLink: string = window.location.origin + "/";
    generate: { isLoading: boolean } = {
        isLoading: false
    };
  $bvToast: any;
  $bvModal: any;
  entity: any;

    mounted() {
        this.stageNewFilters();
    }

    get globalStore(): GlobalStore {
        return globalStore;
    }

    get filters(): CalculationFilters {
        return getEffectiveFilter(
            this.$props.objects,
            this.document.uiState.calculationFilters,
            this.document,
            this.catalog
        );
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

    jsonExport() {
        const result: {
            [key: string]: {
                [key: string]: {
                    [key: string]: {
                        [key: string]: Array<{
                            networkType: string | null;
                            fittingName: string | null;
                            pipeSystem: string | null;
                            pipeMaterial: string | null;
                            pipeSizeMM: number | null;
                            pipeStart: null | Coord;
                            pipeEnd: null | Coord;
                            z: null | number;
                            valveType: string | null;
                            valveSystem: string[] | null;
                            valveSizeMM: number | null;
                            center: Coord | null;
                            bottomHeightM: number | null;
                            topHeightM: number | null;
                        }>;
                    };
                };
            };
        } = {};

        for (const [luid, lprops] of Object.entries(this.document.drawing.levels)) {
            const entities = Array.from(this.globalStore.entitiesInLevel.get(luid) || new Set<string>()).map(
                (uid) => this.globalStore.get(uid)!.entity
            );

            entities.forEach((entity) => {
                if (entity.type === EntityType.PIPE) {
                    const o = this.globalStore.get(entity.uid) as Pipe;
                    const filled = fillPipeDefaultFields(this.document.drawing, o.computedLengthM, o.entity);
                    const system = this.document.drawing.metadata.flowSystems.find((s) => s.uid === filled.systemUid);
                    const calc = this.globalStore.getOrCreateCalculation(o.entity);

                    const pipeStartPoint = this.globalStore.get(filled.endpointUid[0]) as Fitting;
                    const pipeEnd = this.globalStore.get(filled.endpointUid[1]);
                    
                    let pipeEndPoint;
                    if (pipeEnd.entity.type === EntityType.SYSTEM_NODE ) {
                        console.log('node');
                        const bo = this.globalStore.get(filled.endpointUid[1]) as BaseBackedConnectable;
                        const b = bo.toWorldCoord({ x: 0, y: 0 });
                        const res: Coord3D[] = [];

                        res.push({ x: b.x, y: b.y, z: (bo.entity.calculationHeightM || 0) * 1000 });
                        pipeEndPoint = b;

                    } else {
                        console.log('normal')
                        const pipeEndAsFitting = pipeEnd as Fitting;
                        pipeEndPoint = pipeEndAsFitting.entity.center;
                    }
                    

                    let data: Array<any> = [];
                    if (
                        typeof result[lprops.abbreviation] !== "undefined" &&
                        typeof result[lprops.abbreviation][filled!.network] !== "undefined" &&
                        typeof result[lprops.abbreviation][filled!.network][system!.name] !== "undefined" &&
                        typeof result[lprops.abbreviation][filled!.network][system!.name]["pipes"] !== "undefined"
                    ) 
                    {
                        data = result[lprops.abbreviation][filled!.network][system!.name]["pipes"];
                    }

                    result[lprops.abbreviation] = {
                        ...result[lprops.abbreviation],
                            [filled!.network]: 
                        {
                            ...(result[lprops.abbreviation] && 
                                result[lprops.abbreviation][filled!.network]),
                                [system!.name]: 
                            {
                                ...(result[lprops.abbreviation] && 
                                    result[lprops.abbreviation][filled!.network] && 
                                    result[lprops.abbreviation][filled!.network][system!.name]),
                                    pipes: 
                                [
                                    ...data,
                                    {
                                        // fittingName: null,
                                        networkType: filled!.network,
                                        pipeSystem: system!.name,
                                        pipeMaterial: filled.material,
                                        pipeSizeMM: calc.realNominalPipeDiameterMM,
                                        pipeStart:  pipeStartPoint.entity.center,
                                        pipeEnd: pipeEndPoint,
                                        z: lprops.floorHeightM + filled.heightAboveFloorM,
                                        // valveType: null,
                                        // valveSystem: null,
                                        // valveSizeMM: null,
                                        // center: null
                                    }
                                ]
                            }
                        }
                    };
                } else if (entity.type === EntityType.FITTING) {
                    const o = this.globalStore.get(entity.uid) as Fitting;
                    const connections = this.globalStore.getConnections(entity.uid);
                    const zArray: Array<number> = [];
                    const sizeMMArray: Array<number> = [];
                    connections.forEach((uid) => {
                        const conObj = this.globalStore.get(uid);

                        if (conObj instanceof Pipe) {
                            const calc = this.globalStore.getOrCreateCalculation(conObj.entity);

                            zArray.push(conObj.entity.heightAboveFloorM);
                            sizeMMArray.push(calc.realNominalPipeDiameterMM || 0);
                        }
                    });
                    const system = this.document.drawing.metadata.flowSystems.find((s) => s.uid === entity.systemUid);
                    
                    let data: Array<any> = [];
                    if (
                        typeof result[lprops.abbreviation] !== "undefined" &&
                        typeof result[lprops.abbreviation]["RETICULATIONS"] !== "undefined" &&
                        typeof result[lprops.abbreviation]["RETICULATIONS"][system!.name] !== "undefined" &&
                        typeof result[lprops.abbreviation]["RETICULATIONS"][system!.name]["fittings"] !== "undefined"
                    ) {
                        data = result[lprops.abbreviation]["RETICULATIONS"][system!.name]["fittings"];
                    }

                    result[lprops.abbreviation] = {
                        ...result[lprops.abbreviation],
                            ["RETICULATIONS"]:
                        {
                            ...(result[lprops.abbreviation] && 
                                result[lprops.abbreviation]["RETICULATIONS"]),
                                [system!.name]: 
                            {
                                ...(result[lprops.abbreviation] && 
                                    result[lprops.abbreviation]["RETICULATIONS"] && 
                                    result[lprops.abbreviation]["RETICULATIONS"] [system!.name]),
                                    fittings: 
                                [
                                    ...data,
                                    {
                                        networkType: "RETICULATIONS",
                                        fittingName: o.friendlyTypeName,
                                        pipeSystem: system!.name,
                                        // pipeMaterial: null,
                                        pipeSizeMM: Math.min(...sizeMMArray),
                                        // pipeStart: null,
                                        // pipeEnd: null,
                                        // valveType: null,
                                        // valveSystem: null,
                                        // valveSizeMM: null,
                                        center: entity.center,
                                        z: lprops.floorHeightM + Math.min(...zArray)
                                    }
                                ]
                            }
                        }
                    };
                } else if (entity.type === EntityType.DIRECTED_VALVE) {
                    const connections = this.globalStore.getConnections(entity.uid);
                    const zArray: Array<number> = [];
                    const sizeMMArray: Array<number> = [];
                    connections.forEach((uid) => {
                        const conObj = this.globalStore.get(uid);

                        if (conObj instanceof Pipe) {
                            const calc = this.globalStore.getOrCreateCalculation(conObj.entity);

                            zArray.push(conObj.entity.heightAboveFloorM);
                            sizeMMArray.push(calc.realNominalPipeDiameterMM || 0);
                        }
                    });

                    const filled = fillDirectedValveFields(this.document.drawing, this.globalStore, entity);
                    const system = this.document.drawing.metadata.flowSystems.find(
                        (s) => s.uid === filled.systemUidOption
                    );
                    const valveWithSize = [
                        ValveType.RPZD_SINGLE,
                        ValveType.RPZD_DOUBLE_SHARED,
                        ValveType.RPZD_DOUBLE_ISOLATED,
                        ValveType.PRV_SINGLE,
                        ValveType.PRV_DOUBLE,
                        ValveType.PRV_TRIPLE
                    ];

                    let valveSizeMM = null;
                    if (valveWithSize.includes(entity.valve.type)) {
                        const calc = this.globalStore.getOrCreateCalculation(entity);
                        valveSizeMM = calc.sizeMM;
                    }

                    if (system) {
                        let data: Array<any> = [];
                        if (
                            typeof result[lprops.abbreviation] !== "undefined" &&
                            typeof result[lprops.abbreviation]["RETICULATIONS"] !== "undefined" &&
                            typeof result[lprops.abbreviation]["RETICULATIONS"][system.name] !== "undefined" &&
                            typeof result[lprops.abbreviation]["RETICULATIONS"][system.name]["valves"] !== "undefined"
                        ) {
                            data = result[lprops.abbreviation]["RETICULATIONS"][system.name]["valves"];
                        }

                        result[lprops.abbreviation] = {
                            ...result[lprops.abbreviation],
                                ["RETICULATIONS"]: 
                            {
                                ...(result[lprops.abbreviation] && 
                                    result[lprops.abbreviation]["RETICULATIONS"]),
                                    [system!.name]: 
                                {
                                    ...(result[lprops.abbreviation] && 
                                        result[lprops.abbreviation]["RETICULATIONS"] && 
                                        result[lprops.abbreviation]["RETICULATIONS"][system.name]),
                                    valves: [
                                        ...data,
                                        {
                                            // fittingName: null,
                                            // networkType: null,
                                            // pipeSystem: null,
                                            // pipeMaterial: null,
                                            // pipeSizeMM: null,
                                            // pipeStart: null,
                                            // pipeEnd: null,
                                            networkType: "RETICULATIONS",
                                            valveType: filled.valve.catalogId,
                                            valveSystem: [system.name],
                                            valveSizeMM: valveSizeMM || Math.min(...sizeMMArray),
                                            center: filled.center,
                                            z: lprops.floorHeightM + Math.min(...zArray)
                                        }
                                    ]
                                }
                            }
                        };
                    }
                } else if (entity.type === EntityType.BIG_VALVE) {
                    let data: Array<any> = [];
                    if (
                        typeof result[lprops.abbreviation] !== "undefined" &&
                        typeof result[lprops.abbreviation]["RETICULATIONS"] !== "undefined" &&
                        typeof result[lprops.abbreviation]["RETICULATIONS"]["HOT_COLD"] !== "undefined" &&
                        typeof result[lprops.abbreviation]["RETICULATIONS"]["HOT_COLD"]["valves"] !== "undefined"
                    ) {
                        data = result[lprops.abbreviation]["RETICULATIONS"]["HOT_COLD"]["valves"];
                    }

                    result[lprops.abbreviation] = {
                        ...result[lprops.abbreviation],
                            ["RETICULATIONS"]: 
                        {
                            ...(result[lprops.abbreviation] && 
                                result[lprops.abbreviation]["RETICULATIONS"]),
                                ["HOT_COLD"]: 
                            {
                                ...(result[lprops.abbreviation] && 
                                    result[lprops.abbreviation]["RETICULATIONS"] && 
                                    result[lprops.abbreviation]["RETICULATIONS"]["HOT_COLD"]),
                                    valves: 
                                [
                                    ...data,
                                    {
                                        // fittingName: null,
                                        // networkType: null,
                                        // pipeSystem: null,
                                        // pipeMaterial: null,
                                        // pipeSizeMM: null,
                                        // pipeStart: null,
                                        // pipeEnd: null,
                                        networkType: "RETICULATIONS",
                                        valveType: entity.valve.type,
                                        valveSystem: ["HOT_COLD"],
                                        // valveSizeMM: null,
                                        center: entity.center,
                                        z: lprops.floorHeightM + entity.heightAboveFloorM,
                                    }
                                ]
                            }
                        }
                    };
                }
            });

            this.globalStore.forEach((obj) => {
                if (obj instanceof Riser) {
                    const system = this.document.drawing.metadata.flowSystems.find(
                        (s) => s.uid === obj.entity.systemUid
                    );

                    const re = obj.entity as RiserEntity;
                    const filled = fillRiserDefaults(this.document.drawing, re);
                    if (system) {
                        const calculation = this.globalStore.getOrCreateCalculation(obj.entity);
                        const currentLevelCalc = Object.entries(calculation.heights).find(
                            ([uid, props]) => uid === lprops.uid
                        );
                        const riserSize = currentLevelCalc![1]?.sizeMM;
                        let riserSizeInMM
                        if (riserSize === null) {
                            // riser is set to minimum size when null.
                            riserSizeInMM = system.networks.RISERS.minimumPipeSize;
                        } else if (riserSize !== null) {
                            riserSizeInMM = currentLevelCalc![1]?.sizeMM
                        };
                        // riser that has the highest pipe size will on be shown.
                        const riserEntries = [].concat.apply([], Object.entries(calculation.heights));
                        const sizeList = riserEntries.map(function(row){ return row.sizeMM });

                        const data = sizeList.filter(function( element ) {
                            return element !== undefined;
                        });
                        const maxRiserSize = Math.max.apply(null, data);

                        if (maxRiserSize === riserSizeInMM) {
                            let data: Array<any> = [];
                            if (
                                typeof result[lprops.abbreviation] !== "undefined" &&
                                typeof result[lprops.abbreviation]["RISERS"] !== "undefined" &&
                                typeof result[lprops.abbreviation]["RISERS"][system.name] !== "undefined" &&
                                typeof result[lprops.abbreviation]["RISERS"][system.name]["risers"] !== "undefined"
                            ) {
                                data = result[lprops.abbreviation]["RISERS"][system.name]["risers"];
                            }

                            result[lprops.abbreviation] = {
                                ...result[lprops.abbreviation],
                                    ["RISERS"]: 
                                {
                                    ...(result[lprops.abbreviation] && 
                                        result[lprops.abbreviation]["RISERS"]),
                                        [system.name]: 
                                    {
                                        ...(result[lprops.abbreviation] && 
                                            result[lprops.abbreviation]["RISERS"] && 
                                            result[lprops.abbreviation]["RISERS"][system.name]),
                                            risers: 
                                        [
                                            ...data,
                                            {
                                                // fittingName: null,
                                                networkType: "RISERS",
                                                // pipeSystem: null,
                                                // pipeMaterial: null,
                                                pipeSizeMM: riserSizeInMM,
                                                // pipeStart: null,
                                                // pipeEnd: null,
                                                // z: Infinity,
                                                // valveType: null,
                                                // valveSystem: null,
                                                // valveSizeMM: null,
                                                center: filled.center,
                                                bottomHeightM:  filled.bottomHeightM,
                                                topHeightM:  filled.topHeightM,
                                            }
                                        ]
                                    }
                                }
                            };
                        }
                    }
                }
            });
        }

        // console.log(result);

        const data = JSON.stringify(result);
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
