<template>
    <drop @drop="onDrop">
        <!--Anything that needs scrolling needs to be up here, outside of canvasFrame.-->
        <PropertiesWindow
            :selected-entities="selectedEntities"
            :selected-objects="selectedObjects"
            :target-property="targetProperty"
            v-if="selectedObjects.length && propertiesVisible && initialized"
            :mode="document.uiState.drawingMode"
            :on-change="onPropertiesChange"
            :on-delete="deleteSelected"
            :object-store="globalStore"
        >
        </PropertiesWindow>

        <CalculationsSidebar
            v-if="document.uiState.drawingMode === 2 && initialized"
            :objects="allObjects"
            :on-change="scheduleDraw"
        >
        </CalculationsSidebar>

        <LevelSelector
            v-if="levelSelectorVisible && initialized"
            :object-store="globalStore"
        >
        </LevelSelector>

        <div ref="canvasFrame" class="fullFrame" v-bind:class="{ disableMouseEvents: shouldDisableUIMouseEvents }">
            <DrawingNavBar :loading="isLoading" />

            <canvas
                ref="drawingCanvas"
                @contextmenu="disableContextMenu"
                v-bind:style="{
                    backgroundColor: 'aliceblue',
                    cursor: currentCursor,
                    pointerEvents: 'auto',
                    marginTop: '-60px'
                }"
            >
            </canvas>

            <ModeButtons :mode.sync="document.uiState.drawingMode" v-if="currentTool.modesVisible && initialized" />

            <FloorPlanInsertPanel @insert-floor-plan="onFloorPlanSelected" v-if="document.uiState.drawingMode === 0" />

            <HydraulicsInsertPanel
                v-if="document.uiState.drawingMode === 1 && initialized && !document.uiState.viewOnly"
                :flow-systems="document.drawing.metadata.flowSystems"
                @insert="hydraulicsInsert"
                :fixtures="effectiveCatalog.fixtures"
                :valves="effectiveCatalog.valves"
                :available-fixtures="availableFixtures"
                :available-valves="availableValves"
                :last-used-fixture-uid="document.uiState.lastUsedFixtureUid"
                :last-used-valve-vid="document.uiState.lastUsedValveVid"
                :is-drawing="toolHandler !== null"
            />

            <CalculationBar
                v-if="document.uiState.drawingMode === 2 && initialized"
                :demandType.sync="demandType"
                :is-calculating="isCalculating"
            />

            <Toolbar
                :current-tool-config="currentTool"
                :on-tool-click="changeTool"
                :on-fit-to-view-click="fitToView"
                v-if="initialized"
            ></Toolbar>

            <InstructionPage v-if="documentBrandNew && toolHandler === null" />

            <div v-if="document.uiState.levelUid === null" class="choose-level-instruction">
                <v-icon name="arrow-left" scale="2"></v-icon> Please Choose a Level
            </div>
            <resize-observer @notify="scheduleDraw" />
        </div>
    </drop>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { ViewPort } from "../../../src/htmlcanvas/viewport";
import {
    Coord,
    DocumentState,
    EntityParam,
    FlowSystemParameters,
    Level,
    NetworkType
} from "../../../src/store/document/types";
import { drawLoadingUnits, drawPaperScale } from "../../../src/htmlcanvas/on-screen-items";
import ModeButtons from "../../../src/components/editor/ModeButtons.vue";
import PropertiesWindow from "../../../src/components/editor/property-window/PropertiesWindow.vue";
import { DrawingMode, MouseMoveResult, UNHANDLED } from "../../../src/htmlcanvas/types";
import BackgroundLayer from "../../../src/htmlcanvas/layers/background-layer";
import * as TM from "transformation-matrix";
import { cooperativeYield, decomposeMatrix, InterruptedError, matrixScale } from "../../../src/htmlcanvas/utils";
import Toolbar from "../../../src/components/editor/Toolbar.vue";
import LoadingScreen from "../../../src/views/LoadingScreen.vue";
import { MainEventBus } from "../../../src/store/main-event-bus";
import { ToolConfig } from "../../../src/store/tools/types";
import { DEFAULT_TOOL, ToolHandler } from "../../../src/htmlcanvas/lib/tool";
import uuid from "uuid";
import { renderPdf } from "../../../src/api/pdf";
import HydraulicsLayer from "../../../src/htmlcanvas/layers/hydraulics-layer";
import Layer, { SelectMode } from "../../../src/htmlcanvas/layers/layer";
import HydraulicsInsertPanel from "../../../src/components/editor/HydraulicsInsertPanel.vue";
import BaseBackedObject from "../../../src/htmlcanvas/lib/base-backed-object";
import { EntityType } from "../../../src/store/document/entities/types";
import { Interaction } from "../../../src/htmlcanvas/lib/interaction";
import insertRiser from "../../htmlcanvas/tools/insert-riser";
import insertPipes from "../../../src/htmlcanvas/tools/insert-pipes";
import insertValve from "../../../src/htmlcanvas/tools/insert-valve";
import { DrawingContext, SelectionTarget, ValveId } from "../../../src/htmlcanvas/lib/types";
import { BackgroundEntity } from "../../../src/store/document/entities/background-entity";
import insertBigValve from "../../htmlcanvas/tools/insert-big-valve";
import insertFixture from "../../../src/htmlcanvas/tools/insert-fixture";
import FloorPlanInsertPanel from "../../../src/components/editor/FloorPlanInsertPanel.vue";
import InstructionPage from "../../../src/components/editor/InstructionPage.vue";
import CalculationBar from "../../../src/components/CalculationBar.vue";
import { DemandType } from "../../../src/calculations/types";
import CalculationEngine from "../../../src/calculations/calculation-engine";
import CalculationLayer from "../../../src/htmlcanvas/layers/calculation-layer";
import { getBoundingBox, levelIncludesRiser } from "../../../src/htmlcanvas/lib/utils";
import { Catalog } from "../../../src/store/catalog/types";
import { DrawableEntityConcrete } from "../../../src/store/document/entities/concrete-entity";
import SelectBox from "../../../src/htmlcanvas/objects/select-box";
import * as _ from "lodash";
import { AutoConnector } from "../../../src/htmlcanvas/lib/black-magic/auto-connect";
import insertDirectedValve from "../../../src/htmlcanvas/tools/insert-directed-valve";
import { ValveType } from "../../../src/store/document/entities/directed-valves/valve-types";
import { countPsdUnits } from "../../../src/calculations/utils";
import CalculationsSidebar from "../../../src/components/editor/CalculationsSidebar.vue";
import { assertUnreachable } from "../../../src/config";
import DrawingNavBar from "../DrawingNavBar.vue";
import LevelSelector from "./LevelSelector.vue";
import DrawableObjectFactory from "../../htmlcanvas/lib/drawable-object-factory";
import PipeEntity from "../../store/document/entities/pipe-entity";
import util from "util";
import insertLoadNode from "../../htmlcanvas/tools/insert-load-node";
import { NodeType } from "../../store/document/entities/load-node-entity";
import { BigValveType } from "../../store/document/entities/big-valve/big-valve-entity";
import { Buffer } from "./RenderBuffer";
import { GlobalStore } from "../../htmlcanvas/lib/global-store";
import { ObjectStore } from "../../htmlcanvas/lib/object-store";
import insertFlowSource from '../../htmlcanvas/tools/insert-flow-source';

@Component({
    components: {
        LevelSelector,
        DrawingNavBar,
        CalculationsSidebar,
        CalculationBar,
        InstructionPage,
        FloorPlanInsertPanel,
        LoadingScreen,
        HydraulicsInsertPanel,
        Overlay: LoadingScreen,
        Toolbar,
        PropertiesWindow,
        ModeButtons
    }
})
export default class DrawingCanvas extends Vue {
    get catalogLoaded(): boolean {
        return this.$store.getters["catalog/loaded"];
    }

    get isLoading() {
        return !this.catalogLoaded || !this.document.uiState.loaded;
    }

    get shouldDisableUIMouseEvents(): boolean {
        if (this.hasDragged || this.isLayerDragging) {
            return true;
        }

        if (this.selectBox) {
            return true;
        }

        return false;
    }

    get initialViewport() {
        return new ViewPort(TM.transform(TM.translate(0, 0), TM.scale(50)), 5000, 5000);
    }

    get documentBrandNew() {
        return this.$store.getters["document/isBrandNew"];
    }

    get document(): DocumentState {
        return this.$store.getters["document/document"];
    }

    get currentLevel(): Level | null {
        return this.$store.getters["document/currentLevel"];
    }

    get effectiveCatalog(): Catalog {
        return this.$store.getters["catalog/default"];
    }

    get availableFixtures(): string[] {
        return this.document.drawing.metadata.availableFixtures;
    }

    get availableValves(): Array<ValveId | { name: string; valves: ValveId[] }> {
        return [
            { type: ValveType.ISOLATION_VALVE, catalogId: "gateValve", name: "" },
            { type: ValveType.ISOLATION_VALVE, catalogId: "ballValve", name: "" },
            { type: ValveType.ISOLATION_VALVE, catalogId: "butterflyValve", name: "" },
            { type: ValveType.CHECK_VALVE, catalogId: "checkValve", name: "" },
            { type: ValveType.WATER_METER, catalogId: "waterMeter", name: "" },
            { type: ValveType.STRAINER, catalogId: "strainer", name: "" },

            { type: ValveType.RPZD_SINGLE, catalogId: "RPZD", name: "RPZD" },
            { type: ValveType.RPZD_DOUBLE_SHARED, catalogId: "RPZD", name: "Double RPZD - 50/50 Load Each" },
            { type: ValveType.RPZD_DOUBLE_ISOLATED, catalogId: "RPZD", name: "Double RPZD - 100% Load Each" }
        ].map((a) => {
            if (a.name === "") {
                a.name = this.effectiveCatalog.valves[a.catalogId].name;
            }
            return a;
        });
    }

    get allObjects(): BaseBackedObject[] {
        if (!this.initialized) {
            return [];
        }

        const objects: BaseBackedObject[] = Object.keys(this.document.drawing.shared).map(
            (e) => this.globalStore.get(e)!
        );
        if (this.currentLevel) {
            objects.push(...Object.keys(this.currentLevel.entities).map((e) => this.globalStore.get(e)!));
        }

        objects.forEach((o) => {
            if (o === undefined) {
                throw new Error("Inconsistent state: an object in the document is not in the store");
            }
        });

        return objects;
    }

    get activeLayer(): Layer | null {
        if (this.document.uiState.drawingMode === DrawingMode.FloorPlan) {
            return this.backgroundLayer;
        } else if (this.document.uiState.drawingMode === DrawingMode.Hydraulics) {
            return this.hydraulicsLayer;
        } else if (this.document.uiState.drawingMode === DrawingMode.Calculations) {
            return this.calculationLayer;
        }
        return null;
    }

    get propertiesVisible() {
        if (!this.selectedObjects) {
            return false;
        }

        if (!this.currentTool.propertiesVisible) {
            return false;
        }

        if (this.hasDragged || this.isLayerDragging) {
            return false;
        }

        if (this.selectBox) {
            return false;
        }
        return true;
    }

    get levelSelectorVisible() {
        if (!this.currentTool.propertiesVisible) {
            return false;
        }

        if (this.hasDragged || this.isLayerDragging) {
            return false;
        }

        if (this.selectBox) {
            return false;
        }
        return true;
    }

    get attributesVisible() {
        if (this.selectedObjects && this.selectedObjects.length > 0) {
            return false;
        }

        if (!this.currentTool.propertiesVisible) {
            return false;
        }

        if (this.hasDragged || this.isLayerDragging) {
            return false;
        }

        if (this.selectBox) {
            return false;
        }
        return true;
    }

    get uncommittedEntityUids(): string[] {
        return this.$store.getters["document/uncommittedEntityUids"];
    }

    get currentTool(): ToolConfig {
        if (this.toolHandler) {
            return this.toolHandler.config;
        } else {
            return DEFAULT_TOOL;
        }
    }

    get demandType() {
        return this.document.uiState.demandType;
    }

    set demandType(value: DemandType) {
        this.document.uiState.demandType = value;
        this.considerCalculating();
    }

    get viewPort(): ViewPort {
        if (this.document.uiState.viewPort === null) {
            this.document.uiState.viewPort = this.initialViewport;
        }
        return this.document.uiState.viewPort;
    }

    set viewPort(vp: ViewPort) {
        this.document.uiState.viewPort = vp;
    }

    get selectedEntities() {
        if (this.activeLayer) {
            return this.activeLayer.selectedEntities;
        }
        return null;
    }

    get selectedObjects() {
        if (this.activeLayer) {
            return this.activeLayer.selectedObjects;
        }
        return null;
    }

    get selectedIds() {
        if (this.activeLayer) {
            return this.activeLayer.selectedIds;
        }
        return null;
    }

    get isCalculating() {
        return this.document.uiState.isCalculating;
    }

    get sortedLevels() {
        return this.$store.getters["document/sortedLevels"];
    }

    get interactiveUids(): string[] {
        return this.interactive ? this.interactive.map((o) => o.uid) : [];
    }

    ctx: CanvasRenderingContext2D | null = null;

    grabbedPoint: Coord | null = null;
    hasDragged: boolean = false;

    objectStore: ObjectStore = new ObjectStore(this);
    globalStore: GlobalStore = new GlobalStore(this);

    // The layers
    backgroundLayer: BackgroundLayer = new BackgroundLayer(
        this.objectStore,
        this.onChangeFromLayer,
        () => {
            this.onLayerSelect();
        },
        () => {
            // onCommit
            this.$store.dispatch("document/commit");
        }
    );
    hydraulicsLayer: HydraulicsLayer = new HydraulicsLayer(
        this.objectStore,
        this.onChangeFromLayer,
        () => {
            this.onLayerSelect();
        },
        () => {
            this.$store.dispatch("document/commit");
        }
    );
    calculationLayer: CalculationLayer = new CalculationLayer(
        this.objectStore,
        this.onChangeFromLayer,
        () => {
            this.onLayerSelect();
        },
        () => {
            this.$store.dispatch("document/commit");
        }
    );
    allLayers: Layer[] = [];

    toolHandler: ToolHandler | null = null;
    currentCursor: string = "auto";

    shouldDraw: boolean = true;
    lastDraw: number = 0;

    // The currently hovered element ready for interaction.
    interactive: DrawableEntityConcrete[] | null = null;

    updating: boolean = false;

    drawingLocked: number = 0;

    lastDrawingContext: DrawingContext | null = null;

    calculationEngine!: CalculationEngine;
    targetProperty: string | null = null;
    isLayerDragging: boolean = false;

    selectBox: SelectBox | null = null;
    selectBoxMode: SelectMode | null = null;
    selectBoxStartSelected: string[] = [];

    mouseClicked: boolean = false;

    levelChangeUnwatchers = new Map<string, () => void>();

    initialized = false;

    /**
     * Drawing works by processing frame requests and putting them on the frame stack, storing with it the
     */

    buffer: Buffer;
    reactiveRenderQueue: Array<Promise<any>> = [];
    fullRenderQueue: Array<Promise<any>> = [];

    numSkipped = 0;
    waitingForRepaint = false;

    simulDraws = 0;

    mounted() {
        this.objectStore.vm = this;
        this.globalStore.vm = this;
        this.ctx = (this.$refs.drawingCanvas as any).getContext("2d");

        // In the future, there will be 2 types of OTs to handle. Full snapshots, and diffable updates.
        // At the moment, even small diffable updates go through the full treatment.
        MainEventBus.$on("committed", this.onCommitted);
        MainEventBus.$on("set-tool-handler", this.setToolHandler);
        MainEventBus.$on("select", this.onSelectRequest);
        MainEventBus.$on("auto-connect", this.onAutoConnect);

        MainEventBus.$on("add-entity", this.onAddEntity);
        MainEventBus.$on("delete-entity", this.onDeleteEntity);
        MainEventBus.$on("add-level", this.onAddLevel);
        MainEventBus.$on("delete-level", this.onDeleteLevel);
        MainEventBus.$on("current-level-changed", this.onCurrentLevelChanged);
        MainEventBus.$on("revert-level", this.onRevertLevel);
        MainEventBus.$on("update-pipe-endpoints", this.onPipeEndpoints);
        MainEventBus.$on("update-entity", this.onUpdateEntity);

        this.$watch(
            () => this.document.uiState.drawingMode,
            (newVal) => {
                this.considerCalculating();
                this.scheduleDraw();
            }
        );

        (this.$refs.drawingCanvas as any).onmousedown = this.onMouseDown;
        (this.$refs.drawingCanvas as any).onmousemove = this.onMouseMove;
        (this.$refs.drawingCanvas as any).onmouseup = this.onMouseUp;
        (this.$refs.canvasFrame as any).onwheel = this.onWheel;

        this.allLayers.push(this.backgroundLayer, this.hydraulicsLayer, this.calculationLayer);
        this.processDocumentInitial();

        // set view on groundiest floor
        this.selectGroundFloor();

        this.calculationEngine = new CalculationEngine();

        // setInterval(this.drawLoop, 20);
        this.initialized = true;
    }

    destroyed() {
        MainEventBus.$off("committed", this.onCommitted);
        MainEventBus.$off("set-tool-handler", this.setToolHandler);
        MainEventBus.$off("select", this.onSelectRequest);
        MainEventBus.$off("auto-connect", this.onAutoConnect);

        MainEventBus.$off("add-entity", this.onAddEntity);
        MainEventBus.$off("delete-entity", this.onDeleteEntity);
        MainEventBus.$off("add-level", this.onAddLevel);
        MainEventBus.$off("delete-level", this.onDeleteLevel);
        MainEventBus.$off("current-level-changed", this.onCurrentLevelChanged);
        MainEventBus.$off("revert-level", this.onRevertLevel);
        MainEventBus.$off("update-pipe-endpoints", this.onPipeEndpoints);
        MainEventBus.$off("update-entity", this.onUpdateEntity);
        this.document.uiState.lastCalculationId = -1;
    }

    onChangeFromLayer(uids: string[]) {
        /*
            uids.forEach((uid) => {
                this.$store.dispatch('document/notifyEntityChange', {
                    entityUid: uid,
                    levelUid: this.globalStore.levelOfEntity.get(uid),
                });
            });*/
        this.scheduleDraw();
    }

    processDocumentInitial() {
        this.drawingLocked++;
        if (
            this.document.uiState.levelUid &&
            !this.document.drawing.levels.hasOwnProperty(this.document.uiState.levelUid)
        ) {
            this.document.uiState.levelUid = null;
        }

        Object.values(this.document.drawing.levels).forEach((level) => {
            this.globalStore.resetLevel(level.uid, Object.values(level.entities), this.document, this);
        });
        this.globalStore.resetLevel(null, Object.values(this.document.drawing.shared), this.document, this);
        Array.from(this.globalStore.entitiesInLevel.keys()).forEach((lvlUid) => {
            if (lvlUid !== null && !this.document.drawing.levels.hasOwnProperty(lvlUid)) {
                this.globalStore.onLevelDelete(lvlUid);
            }
        });

        this.resetVisibleLevel();
        this.drawingLocked--;
    }

    onCommitted(redraw: boolean = true) {
        if (redraw) {
            this.scheduleDraw();
        }
    }

    setToolHandler(toolHandler: ToolHandler) {
        if (toolHandler !== null && this.toolHandler !== null) {
            this.toolHandler.finish(true, true);
        }
        this.interactive = null;
        this.toolHandler = toolHandler;
        this.scheduleDraw();
    }

    reactiveDrawSet(): Set<string> {
        const seed = this.uncommittedEntityUids.slice();
        if (this.selectedIds) {
            seed.push(...this.selectedIds);
        }
        const result = new Set<string>();

        seed.forEach((ouid) => {
            const o = this.globalStore.get(ouid);
            if (o) {
                result.add(o.uid);
                o.getNeighbours().forEach((no) => {
                    if (!result.has(no.uid)) {
                        result.add(no.uid);
                        no.getNeighbours().forEach((nno) => {
                            result.add(nno.uid);
                        });
                    }
                });
            }
        });

        if (this.interactive) {
            this.interactive.forEach((o) => {
                result.add(o.uid);
            });
        }

        return result;
    }

    onPropertiesChange() {
        // Properties can change for selected objects.
        /*
            if (this.selectedObjects) {
                this.selectedObjects.forEach((o) => {
                    this.$store.dispatch('document/notifyEntityChange', {
                        entityUid: o.uid,
                        levelUid: this.globalStore.levelOfEntity.get(o.uid),
                    });
                });s
            } else {
                throw new Error('Properties changed but nothing is selected');
            }*/
    }

    onPipeEndpoints({ entity, endpoints }: { entity: PipeEntity; endpoints: [string, string] }) {
        this.objectStore.updatePipeEndpoints(entity.uid);
        this.globalStore.updatePipeEndpoints(entity.uid);
    }

    getEntityFromBase(euid: string, luid: string | null): DrawableEntityConcrete {
        if (!luid) {
            return this.document.drawing.shared[euid];
        } else {
            return this.document.drawing.levels[luid].entities[euid];
        }
    }

    sanityCheckGlobalStore() {
        if (window.location.host === "localhost") {
            this.globalStore.sanityCheck(this.document);
        }
    }

    onLayerSelect() {
        this.targetProperty = null;
        this.scheduleDraw();
    }

    onCurrentLevelChanged() {
        this.resetVisibleLevel();
        this.scheduleDraw();
    }

    onRevertLevel(levelUid: string) {
        if (levelUid === this.document.uiState.levelUid) {
            this.resetVisibleLevel();
        }
        this.globalStore.resetLevel(
            levelUid,
            Object.values(levelUid ? this.document.drawing.levels[levelUid].entities : this.document.drawing.shared),
            this.document,
            this
        );
        this.globalStore.resetLevel(null, Object.values(this.document.drawing.shared), this.document, this);
    }

    onUpdateEntity(uid: string) {
        if (this.globalStore.has(uid)) {
            this.globalStore.onEntityChange(uid);
            const currLvl = this.globalStore.levelOfEntity.get(uid);
            if (this.currentLevel && (currLvl === null || currLvl === this.currentLevel!.uid)) {
                this.objectStore.onEntityChange(uid);
            }
        }
    }

    onAddEntity({ entity, levelUid }: EntityParam) {
        if (this.currentLevel && levelUid === this.currentLevel.uid) {
            switch (entity.type) {
                case EntityType.BACKGROUND_IMAGE:
                    this.backgroundLayer.addEntity(() => this.getEntityFromBase(entity.uid, levelUid));
                    break;
                case EntityType.FITTING:
                case EntityType.DIRECTED_VALVE:
                case EntityType.PIPE:
                case EntityType.RISER:
                case EntityType.SYSTEM_NODE:
                case EntityType.BIG_VALVE:
                case EntityType.FIXTURE:
                case EntityType.FLOW_SOURCE:
                case EntityType.LOAD_NODE:
                    this.hydraulicsLayer.addEntity(() => {
                        const val = this.getEntityFromBase(entity.uid, levelUid);
                        return val;
                    });
                    break;
                default:
                    assertUnreachable(entity);
            }
        } else if (entity.type === EntityType.RISER) {
            // Determine if this guy belongs
            if (this.currentLevel) {
                if (levelIncludesRiser(this.currentLevel, entity, this.sortedLevels)) {
                    this.hydraulicsLayer.addEntity(() => this.getEntityFromBase(entity.uid, levelUid));
                }
            }
        }

        const go = DrawableObjectFactory.buildGhost(
            () =>
                levelUid
                    ? this.document.drawing.levels[levelUid].entities[entity.uid]
                    : this.document.drawing.shared[entity.uid],
            this.globalStore,
            levelUid,
            this
        );
    }

    onDeleteEntity({ entity, levelUid }: EntityParam) {
        if (this.currentLevel && levelUid === this.currentLevel.uid) {
            switch (entity.type) {
                case EntityType.BACKGROUND_IMAGE:
                    this.backgroundLayer.deleteEntity(entity);
                    break;
                case EntityType.FITTING:
                case EntityType.DIRECTED_VALVE:
                case EntityType.PIPE:
                case EntityType.RISER:
                case EntityType.SYSTEM_NODE:
                case EntityType.BIG_VALVE:
                case EntityType.FIXTURE:
                case EntityType.FLOW_SOURCE:
                case EntityType.LOAD_NODE:
                    this.hydraulicsLayer.deleteEntity(entity);
                    break;
                default:
                    assertUnreachable(entity);
            }
        } else if (entity.type === EntityType.RISER) {
            // Determine if this guy belongs
            if (this.currentLevel) {
                if (levelIncludesRiser(this.currentLevel, entity, this.sortedLevels)) {
                    this.hydraulicsLayer.deleteEntity(entity);
                }
            }
        }

        this.globalStore.delete(entity.uid);
    }

    selectGroundFloor() {
        const levels: Level[] = Object.values(this.document.drawing.levels);
        let bestDist = Infinity;
        let bestLevel: Level | null = null;
        levels.forEach((level) => {
            if (Math.abs(level.floorHeightM) < bestDist) {
                bestDist = Math.abs(level.floorHeightM);
                bestLevel = level;
            }
        });
        if (bestLevel) {
            this.$store.dispatch("document/setCurrentLevelUid", (bestLevel as Level).uid);
        }
    }

    onAddLevel(level: Level) {
        this.watchLevel(level.uid);
        this.globalStore.resetLevel(level.uid, Object.values(level.entities), this.document, this);
    }

    onDeleteLevel(level: Level) {
        this.unwatchLevel(level.uid);
        this.globalStore.onLevelDelete(level.uid);
    }

    disableContextMenu(e: Event) {
        return e.preventDefault();
    }

    onAutoConnect() {
        if (this.selectedObjects) {
            const ac = new AutoConnector(this.selectedObjects, this);
            ac.autoConnect();
            this.scheduleDraw();
        }
    }

    deleteEntity(object: BaseBackedObject): Set<string> {
        object = this.globalStore.get(object.uid)!;
        if (object.objectStore !== this.globalStore) {
            throw new Error("Can only delete objects from the global object store");
        }
        const toDelete = object.prepareDelete(this);
        const deleted = new Set<string>();
        toDelete.forEach((drawableObject) => {
            if (drawableObject.entity === undefined) {
                return;
            }
            const ouid = drawableObject.uid;
            if (deleted.has(drawableObject.uid)) {
                return;
            }
            this.$store.dispatch("document/deleteEntityOn", {
                entity: drawableObject.entity,
                levelUid: this.globalStore.levelOfEntity.get(drawableObject.uid)
            });
            deleted.add(ouid);
        });
        return deleted;
    }

    onSelectRequest(selectionTarget: SelectionTarget) {
        if (selectionTarget.uid === null) {
            if (this.activeLayer) {
                this.activeLayer.select([], SelectMode.Replace);
            }
        } else {
            const obj = this.objectStore.get(selectionTarget.uid);
            if (!obj) {
                throw new Error("Selecting an object that doesn't exist");
            }

            const drawable = obj.entity;
            if (drawable.type === EntityType.BACKGROUND_IMAGE) {
                this.document.uiState.drawingMode = DrawingMode.FloorPlan;
            } else if (drawable) {
                this.document.uiState.drawingMode = DrawingMode.Hydraulics;
            }

            if (this.activeLayer) {
                this.activeLayer.select([obj], SelectMode.Replace);
            }

            if (selectionTarget.property) {
                this.targetProperty = selectionTarget.property;
            } else {
                this.targetProperty = null;
            }

            if (selectionTarget.recenter === true) {
                // Move view to object
                const shape = obj.shape();
                if (shape) {
                    this.viewPort.panToWc(shape.box.center);
                }
            }
        }

        if (selectionTarget.message) {
            (this as any).$bvToast.toast(selectionTarget.message, {
                variant: selectionTarget.variant!,
                title: selectionTarget.title!
            });
        }

        this.scheduleDraw();
    }

    deleteSelected() {
        const deleted = new Set<string>();
        if (this.selectedEntities) {
            this.selectedEntities
                .map((e) => e.uid)
                .forEach((euid) => {
                    // Delete from the global store
                    const o = this.globalStore.get(euid)!;
                    if (o) {
                        this.deleteEntity(o).forEach((uid) => {
                            deleted.add(uid);
                        });
                    }
                });
            this.$store.dispatch("document/commit").then(() => {
                this.scheduleDraw();
            });
        } else {
            throw new Error("Delete selected was called but we didn't select anything");
        }
    }

    changeTool(tool: ToolConfig) {
        if (tool.name === DEFAULT_TOOL.name) {
            this.$emit("set-tool-handler", null);
        }
    }

    resetVisibleLevel() {
        if (
            this.document.uiState.levelUid === null ||
            (!this.document.drawing.levels.hasOwnProperty(this.document.uiState.levelUid) &&
                !_.isEmpty(this.document.drawing.levels))
        ) {
            this.selectGroundFloor();
            return;
        }

        this.updating = true;
        this.considerCalculating();

        this.levelChangeUnwatchers.forEach((v, k) => this.unwatchLevel(k));

        for (const key of Object.keys(this.document.drawing.levels)) {
            this.watchLevel(key);
        }

        this.allLayers.forEach((l) => l.resetDocument(this.document));
        this.updating = false;
    }

    // Note: Unfortunately, with the current vue reactivity system, this is going to be super slow because every time
    // an object is created or deleted, the entire entity store is notified. However this is going to be changed in
    // vue3 according to https://github.com/vuejs/vue/issues/8970, which will be coming out soon (hopefully).
    // There are solutions like ReactiveX but that works in a separate stream of promises which could mean glitches
    // in states when working with vue. So sticking with Vue's reactivity is preferred.
    // To mitigate this perf issue, we will just watch levels.
    watchLevel(key: string) {
        const watcher = this.$watch(
            () => this.document.drawing.levels[key],
            (oldval, newval) => {
                /**/
            },
            { deep: true }
        );
        this.levelChangeUnwatchers.set(key, watcher);
    }

    unwatchLevel(key: string) {
        this.levelChangeUnwatchers.get(key)!();
        this.levelChangeUnwatchers.delete(key);
    }

    scheduleDraw() {
        if (this.reactiveRenderQueue.length === 0) {
            this.reactiveRenderQueue.push(
                this.drawFast().then(() => {
                    this.reactiveRenderQueue.splice(0, 1);
                })
            );
        } else if (this.reactiveRenderQueue.length === 1) {
            this.reactiveRenderQueue.push(
                this.reactiveRenderQueue[0].then(() => {
                    return this.drawFast().then(() => {
                        this.reactiveRenderQueue.splice(0, 1);
                    });
                })
            );
        }

        if (this.fullRenderQueue.length === 0) {
            this.fullRenderQueue.push(
                this.drawFull().then(() => {
                    this.fullRenderQueue.splice(0, 1);
                })
            );
        } else if (this.fullRenderQueue.length === 1) {
            this.fullRenderQueue.push(
                this.fullRenderQueue[0].then(() => {
                    return this.drawFull().then(() => {
                        this.fullRenderQueue.splice(0, 1);
                    });
                })
            );
        }
    }

    lockDrawing() {
        this.drawingLocked++;
    }

    unlockDrawing() {
        this.drawingLocked--;
        if (this.drawingLocked === 0) {
            this.scheduleDraw();
        }
    }

    drawLoop() {
        if (this.shouldDraw && !this.waitingForRepaint) {
            this.shouldDraw = false;
            try {
                this.drawFast();
            } catch {
                //
            }
        }
    }

    insertFlowReturn(system: FlowSystemParameters) {
        window.alert("No can do returns just yet");
    }

    offerInteraction(
        interaction: Interaction,
        filter?: (objects: DrawableEntityConcrete[]) => boolean,
        sortBy?: (objects: DrawableEntityConcrete[]) => any
    ): DrawableEntityConcrete[] | null {
        this.interactive = null;
        for (let i = this.allLayers.length - 1; i >= 0; i--) {
            const result = this.allLayers[i].offerInteraction(interaction, filter, sortBy);
            if (result && result.length > 0) {
                this.interactive = result;
                return this.interactive;
            }
        }
        return this.interactive;
    }

    fitToView() {
        if (this.currentLevel) {
            if (_.isEmpty(this.currentLevel.entities)) {
                this.viewPort = this.initialViewport;
                this.scheduleDraw();
            } else {
                const { l, r, t, b } = getBoundingBox(this.objectStore, this.document);

                const w = this.ctx!.canvas.width;
                const h = this.ctx!.canvas.height;
                const s = Math.max((r - l + 1) / w, (b - t + 1) / h, 1) * 1.5;
                this.viewPort = new ViewPort(TM.transform(TM.translate((l + r) / 2, (t + b) / 2), TM.scale(s)), w, h);
                this.scheduleDraw();
            }
        }
    }

    hydraulicsInsert(params: {
        entityName: string;
        system: FlowSystemParameters;
        catalogId: string;
        valveType: ValveType;
        nodeType: NodeType;
        bigValveType: BigValveType;
        valveName: string;
        networkType: NetworkType;
    }) {
        const { entityName, system, catalogId, valveType, nodeType, valveName, networkType, bigValveType } = params;
        this.hydraulicsLayer.select([], SelectMode.Replace);

        if (entityName === EntityType.RISER) {
            insertRiser(this, system);
        } else if (entityName === EntityType.RETURN) {
            this.insertFlowReturn(system);
        } else if (entityName === EntityType.PIPE) {
            insertPipes(this, system, networkType);
        } else if (entityName === EntityType.FITTING) {
            insertValve(this, system);
        } else if (entityName === EntityType.BIG_VALVE) {
            insertBigValve(this, bigValveType, 0);
        } else if (entityName === EntityType.FIXTURE) {
            this.document.uiState.lastUsedFixtureUid = catalogId;
            insertFixture(this, catalogId, 0);
        } else if (entityName === EntityType.DIRECTED_VALVE) {
            this.document.uiState.lastUsedValveVid = {
                catalogId,
                name: valveName,
                type: valveType
            };
            insertDirectedValve(this, valveType, catalogId, system);
        } else if (entityName === EntityType.LOAD_NODE) {
            insertLoadNode(this, nodeType);
        } else if (entityName === EntityType.FLOW_SOURCE) {
            insertFlowSource(this, system);
        }
    }

    async drawFast() {
        // this.sanityCheckGlobalStore();

        if (this.ctx != null && (this.$refs.canvasFrame as any) != null) {
            const width = (this.$refs.canvasFrame as any).clientWidth - 1;
            const height = (this.$refs.canvasFrame as any).clientHeight;
            this.ctx.canvas.width = width;
            this.ctx.canvas.height = height;

            if (this.document.uiState.viewPort === null) {
                this.fitToView();
            }

            this.viewPort.width = width;
            this.viewPort.height = height;

            if (this.buffer === undefined) {
                this.buffer = new Buffer(width, height, this.viewPort.world2ScreenMatrix, this.reactiveDrawSet());
            }

            await this.blitBuffer();

            // await util.promisify(requestAnimationFrame);
        }
    }

    async blitBuffer() {
        await util.promisify(requestAnimationFrame);
        this.ctx!.resetTransform();
        this.ctx!.clearRect(0, 0, this.viewPort.width, this.viewPort.height);

        this.buffer.drawOnto(this.ctx!, this.viewPort.world2ScreenMatrix);

        const context: DrawingContext = {
            ctx: this.ctx!,
            vp: this.viewPort,
            doc: this.document,
            catalog: this.effectiveCatalog,
            globalStore: this.globalStore
        };

        if (this.activeLayer) {
            const reactive = new Set(this.buffer.excluded);
            this.reactiveDrawSet().forEach((uid) => {
                reactive.add(uid);
            });
            this.activeLayer.drawReactiveLayer(
                context,
                [...this.interactiveUids, ...this.uncommittedEntityUids],
                reactive
            );
        }

        // Draw on screen HUD
        this.ctx!.setTransform(TM.identity());
        drawPaperScale(this.ctx!, 1 / matrixScale(this.viewPort.position));

        if (this.propertiesVisible) {
            if (
                this.selectedEntities &&
                this.selectedEntities.length > 0 &&
                this.document.uiState.drawingMode === DrawingMode.Hydraulics
            ) {
                drawLoadingUnits(
                    context,
                    this.effectiveCatalog,
                    countPsdUnits(this.selectedEntities, this.document, this.effectiveCatalog, this.globalStore),
                    true
                );
            } else {
                drawLoadingUnits(
                    context,
                    this.effectiveCatalog,
                    countPsdUnits(
                        Array.from(this.objectStore.values()).map((o) => o.entity),
                        this.document,
                        this.effectiveCatalog,
                        this.globalStore,
                    )
                );
            }
        }

        // draw selection box
        if (this.selectBox) {
            this.selectBox.draw(context, { selected: true, active: true, calculationFilters: null });
        }

        if (this.toolHandler) {
            context.ctx.setTransform(TM.identity());
            this.toolHandler.draw(context);
        }
    }
    async drawFull() {
        const start = new Date();
        this.simulDraws++;
        if (this.simulDraws === 2) {
            throw new Error("Shound't be running 2 simulaneous draws");
        }
        try {
            const shouldContinue = (() => {
                const res = this.fullRenderQueue.length < 2; // || this.numSkipped > 4;
                if (res === false) {
                    this.numSkipped++;
                }
                // console.log(' checking ' + res);
                // return res;
                return true;
            }).bind(this);

            const reactive = this.reactiveDrawSet();
            const buffer = new Buffer(
                this.viewPort.width,
                this.viewPort.height,
                this.viewPort.world2ScreenMatrix,
                reactive
            );

            const context: DrawingContext = {
                ctx: buffer.ctx,
                vp: this.viewPort.copy(),
                doc: this.document,
                catalog: this.effectiveCatalog,
                globalStore: this.globalStore
            };

            // this.buffer.transform = this.viewPort.world2ScreenMatrix; do that at the end
            this.lastDrawingContext = context;
            await this.backgroundLayer.draw(
                context,
                this.document.uiState.drawingMode === DrawingMode.FloorPlan,
                shouldContinue,
                reactive,
                this.currentTool
            );
            const filters =
                this.document.uiState.drawingMode === DrawingMode.Calculations
                    ? this.document.uiState.calculationFilters
                    : null;

            await this.hydraulicsLayer.draw(
                context,
                this.document.uiState.drawingMode === DrawingMode.Hydraulics,
                shouldContinue,
                reactive,
                this.document.uiState.drawingMode,
                filters
            );
            await cooperativeYield(shouldContinue);
            await this.calculationLayer.draw(
                context,
                this.document.uiState.drawingMode === DrawingMode.Calculations,
                shouldContinue,
                reactive,
                filters
            );
            await cooperativeYield(shouldContinue);

            // Draw hydraulics layer

            // Draw selection layers
            /*
                    if (this.activeLayer) {
                        await this.activeLayer.drawSelectionLayer(context, this.interactive);
                        await cooperativeYield(shouldContinue);
                    }*/

            this.buffer = buffer; // swap out the buffer, so that the new render shows the new frame.

            await this.blitBuffer();
            this.numSkipped = 0;
            const end = new Date();
        } catch (e) {
            if (e instanceof InterruptedError) {
                // that's fine, just exit, because a newer frame wants to render.
            } else {
                throw e;
            }
        } finally {
            this.simulDraws--;
        }
    }

    considerCalculating() {
        if (this.document.uiState.drawingMode === DrawingMode.Calculations) {
            if (
                this.document.uiState.lastCalculationId < this.document.nextId ||
                this.document.uiState.lastCalculationUiSettings.demandType !== this.demandType
            ) {
                this.calculationLayer.calculate(this, this.demandType, () => {
                    this.scheduleDraw();
                });
            }
        }
    }

    onDrop(value: any, event: DragEvent) {
        if (event.dataTransfer) {
            event.preventDefault();
            for (let i = 0; i < event.dataTransfer.files.length; i++) {
                if (!(event.dataTransfer.files.item(i) as File).name.endsWith("pdf")) {
                    continue;
                }

                const w = this.viewPort.toWorldCoord({ x: event.offsetX, y: event.offsetY });

                this.insertFloorPlan(event.dataTransfer.files.item(i) as File, w);
            }
        }
    }

    onFloorPlanSelected(file: File) {
        const m = decomposeMatrix(this.viewPort.position);
        this.insertFloorPlan(file, { x: m.tx + this.viewPort.width / 2, y: m.ty + this.viewPort.height / 2 });
    }

    insertFloorPlan(file: File, wc: Coord) {
        renderPdf(file).then((res) => {
            if (res.success) {
                const { paperSize, scale, scaleName, key, totalPages } = res.data;
                const width = paperSize.widthMM / scale;
                const height = paperSize.heightMM / scale;
                // We create the operation here, not the server.
                const background: BackgroundEntity = {
                    parentUid: null,
                    type: EntityType.BACKGROUND_IMAGE,
                    filename: file.name,
                    center: wc,
                    crop: { x: -width / 2, y: -height / 2, w: width, h: height },
                    offset: { x: 0, y: 0 },
                    page: 1,
                    paperSize,
                    pointA: null,
                    pointB: null,
                    rotation: 0,
                    scaleFactor: 1,
                    scaleName,
                    uid: uuid(),
                    totalPages,
                    key,
                };

                this.$store.dispatch("document/addEntity", background);
                this.$store.dispatch("document/commit");
            } else {
                this.$bvToast.toast(res.message, {
                    title: "Error Uploading PDF",
                    variant: "danger"
                });
            }
        });
    }

    onMouseDown(event: MouseEvent): boolean {
        this.mouseClicked = true;
        if (event.button === 2) {
            if (event.shiftKey && !event.ctrlKey) {
                this.selectBoxMode = SelectMode.Exclude;
            } else if (event.ctrlKey && !event.shiftKey) {
                this.selectBoxMode = SelectMode.Add;
            } else if (event.shiftKey && event.ctrlKey) {
                this.selectBoxMode = SelectMode.Toggle;
            } else {
                this.selectBoxMode = SelectMode.Replace;
            }
            this.selectBoxStartSelected = _.clone(this.hydraulicsLayer.selectedIds);
            event.preventDefault();

            // start box thingy
            this.selectBox = new SelectBox(
                null,
                this.hydraulicsLayer,
                this.viewPort.toWorldCoord({ x: event.offsetX, y: event.offsetY }),
                this.viewPort.toWorldCoord({ x: event.offsetX, y: event.offsetY })
            );

            return true;
        }

        if (this.toolHandler) {
            if (this.toolHandler.onMouseDown(event, this)) {
                return true;
            }
        } else {
            // Pass the event down to layers below
            if (this.activeLayer) {
                if (this.activeLayer.onMouseDown(event, this)) {
                    return true;
                }
            }
        }

        // If no objects or tools wanted the events, we can always drag and shit.
        this.grabbedPoint = this.viewPort.toWorldCoord({ x: event.offsetX, y: event.offsetY });
        this.hasDragged = false;
        return true;
    }

    onMouseMove(event: MouseEvent): boolean {
        if (event.movementX === 0 && event.movementY === 0) {
            return true; // Phantom movement - damn it chrome
        }
        const res = this.onMouseMoveInternal(event);
        if (res.cursor) {
            this.currentCursor = res.cursor;
        } else {
            this.currentCursor = this.currentTool.defaultCursor;
        }
        return true;
        // return res.handled;
    }

    onMouseMoveInternal(event: MouseEvent): MouseMoveResult {
        if (this.selectBox) {
            this.selectBox.pointB = this.viewPort.toWorldCoord({ x: event.offsetX, y: event.offsetY });

            event.preventDefault();

            if (this.document.uiState.drawingMode === DrawingMode.Hydraulics) {
                this.hydraulicsLayer.select(_.clone(this.selectBoxStartSelected), SelectMode.Replace);

                this.hydraulicsLayer.select(
                    this.hydraulicsLayer.uidsInOrder.filter((uid) => {
                        return this.selectBox!.inSelection([this.objectStore.get(uid)!]).length > 0;
                    }),
                    this.selectBoxMode!
                );
            }

            this.scheduleDraw();
            // todo: select
            return { cursor: null, handled: true };
        }

        if (this.toolHandler) {
            const res = this.toolHandler.onMouseMove(event, this);
            if (res.handled) {
                return res;
            }
        } else {
            // Pass the event down to layers below
            if (this.activeLayer) {
                const res = this.activeLayer.onMouseMove(event, this);
                if (res.handled) {
                    return res;
                }
            }
        }

        if (event.buttons && 1) {
            if (this.grabbedPoint != null) {
                const s = this.viewPort.toScreenCoord(this.grabbedPoint);
                this.hasDragged = true;
                this.viewPort.panAbs(s.x - event.offsetX, s.y - event.offsetY);
                this.scheduleDraw();
                return { handled: true, cursor: "Move" };
            } else {
                return UNHANDLED;
            }
        } else {
            this.grabbedPoint = null;
            this.hasDragged = false;
            return UNHANDLED;
        }
    }

    onMouseUp(event: MouseEvent): boolean {
        if (!this.mouseClicked) {
            // This event happened when the user clicked from a non canvas control to the middle. Ignore it.
            // Possibilities include when the user is trying to select text in the properties box and then let
            // go on a position in the canvas.
            return false;
        }
        this.mouseClicked = false;
        if (this.selectBox && event.button === 2) {
            // finish selection
            event.preventDefault();
            this.selectBox = null;
            this.scheduleDraw();
            return false;
        }

        this.interactive = null;

        if (this.grabbedPoint) {
            this.grabbedPoint = null;
            const wasDragged = this.hasDragged;
            this.hasDragged = false;
            if (wasDragged) {
                this.scheduleDraw();
                return true;
            }
        }

        if (this.toolHandler) {
            if (this.toolHandler.onMouseUp(event, this)) {
                return true;
            }
        } else {
            // Pass the event down to layers below
            if (this.activeLayer) {
                if (this.activeLayer.onMouseUp(event, this)) {
                    return true;
                }
            }
        }

        return false;
    }

    onWheel(event: WheelEvent) {
        event.preventDefault();
        let delta = 1 + event.deltaY / 500;
        if (event.deltaY < 0) {
            delta = 1 / (1 - event.deltaY / 500);
        }
        this.viewPort.rescale(delta, event.offsetX, event.offsetY);
        this.scheduleDraw();
    }
}
</script>

<style lang="css">
body {
    height: 100%;
    overflow: hidden;
}

.fullFrame {
    width: 100%;
    height: -webkit-calc(100vh);
}

.disableMouseEvents {
    pointer-events: none;
}
.choose-level-instruction {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);

    pointer-events: none;
    font-size: 30px;
}
</style>
