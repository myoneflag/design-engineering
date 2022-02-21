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
      v-if="
        document.uiState.drawingMode === DrawingMode.Calculations &&
          initialized &&
          !showExport &&
          (!toolHandler || toolHandler.config.calculationSideBar)
      "
      :objects="visibleObjects"
      :on-change="scheduleDraw"
      :canvas-context="this"
    >
    </CalculationsSidebar>

    <LevelSelector
      v-if="levelSelectorVisible && initialized"
      @level-changed="floorLockStatus = false"
      :object-store="globalStore"
      :class="{ onboarding: checkOnboardingClass(DocumentStep.Levels) }"
    ></LevelSelector>
    <LUAndCostTable
      v-if="LUAndCostTableVisible && initialized && document.drawing"
      :global-store="globalStore"
      :selected-entities="selectedEntities"
      :projectLUs="projectLUs"
      :focus-l-us="focusLUs"
      :focus-name="focusName"
      :focus-cost="focusCost"
      :project-cost="projectCost()"
    />

    <div ref="canvasFrame" class="fullFrame" v-bind:class="{ disableMouseEvents: shouldDisableUIMouseEvents }">
      <DrawingNavBar :loading="isLoading" :disabled="!!toolHandler" />

      <canvas
        ref="drawingCanvas"
        :title="
          !floorLockStatus && this.document.uiState.drawingMode == DrawingMode.FloorPlan
            ? 'Click on the padlock to unlock'
            : ''
        "
        @contextmenu="disableContextMenu"
        v-bind:style="{
          backgroundColor: 'aliceblue',
          cursor: currentCursor,
          pointerEvents: 'auto',
          marginTop: '-60px'
        }"
      ></canvas>

      <div ref="menu" id="menu" v-click-outside="handleCloseMenu">
        <div>
          <button id="pulse-button" @click="handleClickSelectSimilar">Select Similar</button>
        </div>
      </div>

      <ModeButtons
        :mode.sync="document.uiState.drawingMode"
        :showExport.sync="showExport"
        @floor-plan="floorLockStatus = false"
        v-if="shouldDisplayModeButtons"
      />

      <HistoryView v-if="showHistoryBar"></HistoryView>

      <FloorPlanInsertPanel
        @insert-floor-plan="onFloorPlanSelected"
        @lock-unlock-floor="lockUnlockFloor"
        :floor-lock-status="floorLockStatus"
        v-if="document.uiState.drawingMode === DrawingMode.FloorPlan && profile"
      />

      <ExportPanel
        v-if="showExport && initialized && (!toolHandler || toolHandler.config.calculationSideBar)"
        :objects="visibleObjects"
        :on-change="scheduleDraw"
        :canvas-context="this"
      />

      <ExportPanel
        v-if="showExport && initialized && (!toolHandler || toolHandler.config.calculationSideBar)"
        :objects="visibleObjects"
        :on-change="scheduleDraw"
        :canvas-context="this"
      />

      <HydraulicsInsertPanel
        v-if="document.uiState.drawingMode === DrawingMode.Hydraulics && initialized && !document.uiState.viewOnly"
        :flow-systems="availableFlowSystems"
        @insert="hydraulicsInsert"
        :fixtures="effectiveCatalog.fixtures"
        :valves="effectiveCatalog.valves"
        :available-fixtures="availableFixtures"
        :available-valves="availableValves"
        :last-used-fixture-uid="document.uiState.lastUsedFixtureUid"
        :last-used-valve-vid="document.uiState.lastUsedValveVid"
        :is-drawing="toolHandler !== null"
      />

      <PressureDrainageSelector
        v-if="
          (document.uiState.drawingMode !== DrawingMode.FloorPlan && !showExport) ||
            (toolHandler && toolHandler.config.paperSnapshotTopBar)
        "
      >
      </PressureDrainageSelector>

      <CalculationTopBar
        v-if="
          document.uiState.drawingMode === DrawingMode.Calculations &&
            !showExport &&
            initialized &&
            (!toolHandler || toolHandler.config.calculationTopBar)
        "
        :is-calculating="isCalculating"
        :on-re-calculate="considerCalculating"
      />
      <Toolbar
        v-if="!showExport || (toolHandler && toolHandler.config.paperSnapshotTopBar)"
        :showExport="showExport"
        :current-tool-config="currentTool"
        :on-tool-click="changeTool"
        :on-fit-to-view-click="fitToView"
        :on-change="scheduleDraw"
        :on-undo="onUndo"
        :on-redo="onRedo"
        :on-copy="copySelected"
        :on-paste="paste"
      ></Toolbar>

      <PDFSnapshotTopBar
        v-if="toolHandler && toolHandler.config.paperSnapshotTopBar"
        :canvas-context="thisContext"
        :tool-handler="toolHandler"
      >
      </PDFSnapshotTopBar>

      <FeedbackModal v-model="showFeedbackModal" feedbackType="help" />
      <b-button class="helpButton" variant="outline-info" @click="showFeedbackModal = true"
        >Help <b-icon icon="question-circle"
      /></b-button>

      <div v-if="document.uiState.levelUid === null" class="choose-level-instruction">
        <v-icon name="arrow-left" scale="1"></v-icon>
        Please add a Level
      </div>
      <resize-observer @notify="scheduleDraw" />
    </div>
    <Onboarding
      v-if="onboardingScreen"
      :screen="onboardingScreen"
      :mode.sync="document.uiState.drawingMode"
    ></Onboarding>
  </drop>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
// @ts-ignore
import ClickOutside from "vue-click-outside";

import { ViewPort } from "../../../src/htmlcanvas/viewport";
import { DocumentState, EntityParam, initialUIState } from "../../../src/store/document/types";
import ModeButtons from "../../../src/components/editor/ModeButtons.vue";
import PropertiesWindow from "../../../src/components/editor/property-window/PropertiesWindow.vue";
import { DrawingMode, MouseMoveResult, UNHANDLED } from "../../../src/htmlcanvas/types";
import BackgroundLayer from "../../../src/htmlcanvas/layers/background-layer";
import * as TM from "transformation-matrix";
import {
  cooperativeYield,
  decomposeMatrix,
  InterruptedError,
  KeyCode,
  matrixScale
} from "../../../src/htmlcanvas/utils";
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
import { EntityType, getReferences } from "../../../../common/src/api/document/entities/types";
import { Interaction } from "../../../src/htmlcanvas/lib/interaction";
import insertRiser from "../../htmlcanvas/tools/insert-riser";
import insertPipes from "../../../src/htmlcanvas/tools/insert-pipes";
import insertValve from "../../../src/htmlcanvas/tools/insert-valve";
import { DrawingContext, SelectionTarget, ValidationResult, ValveId } from "../../../src/htmlcanvas/lib/types";
import { BackgroundEntity } from "../../../../common/src/api/document/entities/background-entity";
import insertBigValve from "../../htmlcanvas/tools/insert-big-valve";
import insertFixture from "../../../src/htmlcanvas/tools/insert-fixture";
import FloorPlanInsertPanel from "../../../src/components/editor/FloorPlanInsertPanel.vue";
import ExportPanel from "../../../src/components/editor/ExportPanel.vue";
import InstructionPage from "../../../src/components/editor/InstructionPage.vue";
import CalculationLayer from "../../../src/htmlcanvas/layers/calculation-layer";
import { getVisibleBoundingBox, levelIncludesRiser } from "../../../src/htmlcanvas/lib/utils";
import { DrawableEntityConcrete, isCenteredEntity } from "../../../../common/src/api/document/entities/concrete-entity";
import SelectBox from "../../../src/htmlcanvas/objects/select-box";
import * as _ from "lodash";
import { AutoConnector } from "../../../src/htmlcanvas/lib/black-magic/auto-connect";
import {
  getIdsOfSimilarEntities,
  entityTypeSupportsSimilar
} from "../../../src/htmlcanvas/lib/black-magic/select-similar";
import insertDirectedValve from "../../../src/htmlcanvas/tools/insert-directed-valve";
import { ValveType } from "../../../../common/src/api/document/entities/directed-valves/valve-types";
import {
  addCosts,
  addPsdUnitsByFlowSystem,
  Cost,
  countPsdUnits,
  PsdUnitsByFlowSystem,
  zeroCost
} from "../../../src/calculations/utils";
import CalculationsSidebar from "../../../src/components/editor/CalculationsSidebar.vue";
import DrawingNavBar from "../DrawingNavBar.vue";
import LevelSelector from "./LevelSelector.vue";
import PipeEntity from "../../../../common/src/api/document/entities/pipe-entity";
import util from "util";
import insertLoadNode from "../../htmlcanvas/tools/insert-load-node";
import LoadNodeEntity, {
  NodeType,
  NodeVariant,
  LoadNode
} from "../../../../common/src/api/document/entities/load-node-entity";
import { BigValveType } from "../../../../common/src/api/document/entities/big-valve/big-valve-entity";
import { Buffer } from "./RenderBuffer";
import { GlobalStore } from "../../htmlcanvas/lib/global-store";
import insertFlowSource from "../../htmlcanvas/tools/insert-flow-source";
import insertPlant from "../../htmlcanvas/tools/insert-plant";
import { assertUnreachable, isDrainage } from "../../../../common/src/api/config";
import { Catalog } from "../../../../common/src/api/catalog/types";
import { Coord, FlowSystemParameters, Level, NetworkType } from "../../../../common/src/api/document/drawing";
import { rebaseAll } from "../../htmlcanvas/lib/black-magic/rebase-all";
import { globalStore } from "../../store/document/mutations";
import HistoryView from "./HistoryView.vue";
import { DEFAULT_FONT_NAME } from "../../config";
import { cloneSimple } from "../../../../common/src/lib/utils";
import Riser from "../../htmlcanvas/objects/riser";
import stringify from "json-stable-stringify";
import PDFSnapshotTopBar from "../PDFSnapshotTopBar.vue";
import CanvasContext from "../../htmlcanvas/lib/canvas-context";
import { PlantType } from "../../../../common/src/api/document/entities/plants/plant-types";
import CalculationTopBar from "../CalculationTopBar.vue";
import insertFixtureHotCold from "../../htmlcanvas/tools/insert-fixture-hot-cold";
import { User } from "../../../../common/src/models/User";
import { PriceTable } from "../../../../common/src/api/catalog/price-table";
import LUAndCostTable from "./LUAndCostTable.vue";
import { isCalculated } from "../../store/document/calculations";
import Onboarding from "../Onboarding.vue";
import OnboardingState, { ONBOARDING_SCREEN } from "../../store/onboarding/types";
import insertGasAppliance from "../../htmlcanvas/tools/insert-gas-appliance";
import { drawGridLines } from "../../htmlcanvas/on-screen-items";

import PressureDrainageSelector from "./PressureDrainageSelector.vue";
import { I18N } from "../../../../common/src/api/locale/values";
import { SupportedLocales } from "../../../../common/src/api/locale";
import FeedbackModal from "../FeedbackModal.vue";
import { DocumentStep } from "../../store/onboarding/steps";
import CalculationEngine from "../../calculations/calculation-engine";
import { reportWarning } from '../../../src/api/error-report';

import { getSavedWarningsFilter } from "../../lib/filters/warnings";
import { getSavedFilters, getSavedFilterSettings } from "../../lib/filters/results";

@Component({
  components: {
    LUAndCostTable,
    PDFSnapshotTopBar,
    HistoryView,
    LevelSelector,
    DrawingNavBar,
    CalculationsSidebar,
    InstructionPage,
    FloorPlanInsertPanel,
    ExportPanel,
    LoadingScreen,
    HydraulicsInsertPanel,
    CalculationTopBar,
    Overlay: LoadingScreen,
    Toolbar,
    PropertiesWindow,
    ModeButtons,
    Onboarding,
    PressureDrainageSelector,
    FeedbackModal
  },
  directives: {
    ClickOutside
  }
})
export default class DrawingCanvas extends Vue {
  get DrawingMode() {
    return DrawingMode;
  }

  get DocumentStep() {
    return DocumentStep;
  }

  get globalStore(): GlobalStore {
    return globalStore;
  }
  floorLockStatus: boolean = false;
  lockUnlockFloor(val: boolean | undefined) {
    if (val) this.floorLockStatus = val;
    else this.floorLockStatus = this.floorLockStatus && this.floorLockStatus === true ? false : true;
    this.select([], SelectMode.Replace);
    this.scheduleDraw();
  }
  get catalogLoaded(): boolean {
    return this.$store.getters["catalog/loaded"];
  }

  get isLoading() {
    return !this.catalogLoaded || !this.document.uiState.loaded;
  }

  get thisContext(): CanvasContext {
    return this;
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

  get shouldDisplayModeButtons() {
    return (
      this.currentTool.modesVisible && this.initialized && this.document.uiState.drawingMode !== DrawingMode.History
    );
  }

  get showHistoryBar() {
    return this.document.uiState.drawingMode === DrawingMode.History;
  }

  get initialViewport() {
    return new ViewPort(TM.transform(TM.translate(0, 0), TM.scale(50)), 5000, 5000);
  }

  get visibleObjects(): BaseBackedObject[] {
    if (!this.initialized || !this.currentLevel) {
      return [];
    }

    const objects: BaseBackedObject[] = Object.values(this.document.drawing.shared)
      .filter((r) => levelIncludesRiser(this.currentLevel!, r, this.$store.getters["document/sortedLevels"]))
      .map((e) => this.globalStore.get(e.uid)!);
    if (this.currentLevel) {
      objects.push(...Object.keys(this.currentLevel.entities).map((e) => this.globalStore.get(e)!));
      for (const e of Object.keys(this.currentLevel.entities)) {
        if (!this.globalStore.get(e)) {
          console.log(e);
          console.log(this.currentLevel.entities[e]);
        }
      }
    }

    objects.forEach((o) => {
      if (o === undefined) {
        throw new Error("Inconsistent state: an object in the document is not in the store");
      }
    });

    return objects;
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

  get effectivePriceTable(): PriceTable {
    return this.$store.getters["document/priceTable"];
  }

  get availableFixtures(): string[] {
    return this.document.drawing.metadata.availableFixtures;
  }

  get locale(): SupportedLocales {
    return this.$store.getters["profile/locale"];
  }

  get availableValves(): Array<ValveId | { name: string; valves: ValveId[] }> {
    return [
      { type: ValveType.ISOLATION_VALVE, catalogId: "gateValve", name: "" },
      { type: ValveType.ISOLATION_VALVE, catalogId: "ballValve", name: "" },
      { type: ValveType.ISOLATION_VALVE, catalogId: "butterflyValve", name: "" },

      { type: ValveType.BALANCING, catalogId: "balancing", name: "Balancing Valve" },

      { type: ValveType.CHECK_VALVE, catalogId: "checkValve", name: "" },
      { type: ValveType.WATER_METER, catalogId: "waterMeter", name: "" },
      { type: ValveType.STRAINER, catalogId: "strainer", name: "" },

      { type: ValveType.RPZD_SINGLE, catalogId: "RPZD", name: "RPZD" },
      { type: ValveType.RPZD_DOUBLE_SHARED, catalogId: "RPZD", name: "Double RPZD - 50/50 Load Each" },
      { type: ValveType.RPZD_DOUBLE_ISOLATED, catalogId: "RPZD", name: "Double RPZD - 100% Load Each" },

      { type: ValveType.PRV_SINGLE, catalogId: "prv", name: I18N.pressureReducingValve[this.locale] },
      { type: ValveType.PRV_DOUBLE, catalogId: "prv", name: "PRV Dual - 50% Load Each" },
      { type: ValveType.PRV_TRIPLE, catalogId: "prv", name: "PRV Trio - 33% Load Each" }
    ].map((a) => {
      if (a.name === "") {
        a.name = this.effectiveCatalog.valves[a.catalogId].name;
      }
      return a;
    });
  }

  get activeLayer(): Layer {
    switch (this.document.uiState.drawingMode) {
      case DrawingMode.FloorPlan:
        return this.backgroundLayer;
      case DrawingMode.Hydraulics:
        return this.hydraulicsLayer;
      case DrawingMode.Calculations:
        return this.calculationLayer;
      case DrawingMode.History:
        return this.hydraulicsLayer;
    }
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

    if (
      this.document.uiState.drawingMode !== DrawingMode.Hydraulics &&
      this.document.uiState.drawingMode !== DrawingMode.FloorPlan
    ) {
      return false;
    }

    return true;
  }

  get levelSelectorVisible() {
    if (!this.currentTool.propertiesVisible) {
      return false;
    }

    if (this.showExport) {
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

  get LUAndCostTableVisible() {
    if (!this.currentTool.propertiesVisible) {
      return false;
    }

    if (this.showExport) {
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
    return this.selectedIds.map((uid) => this.globalStore.get(uid)!.entity);
  }

  get selectedObjects() {
    return this.selectedIds.map((uid) => this.globalStore.get(uid)!);
  }

  get selectedIds() {
    return this.document.uiState.selectedUids;
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

  get profile(): User {
    return this.$store.getters["profile/profile"];
  }

  get projectLUs(): PsdUnitsByFlowSystem | null {
    let result: PsdUnitsByFlowSystem | null = {};

    for (const luid of Object.keys(this.document.drawing.levels)) {
      if (this.changedLevelsSinceLastPLUCalc.has(luid)) {
        const entities = Array.from(this.globalStore.entitiesInLevel.get(luid) || new Set<string>()).map(
          (uid) => this.globalStore.get(uid)!.entity
        );
        this.levelLUCache.set(
          luid,
          countPsdUnits(entities, this.document, this.effectiveCatalog, this.globalStore, this.nodes)
        );
      }

      if (result === null || this.levelLUCache.get(luid) == null) {
        result = null;
      } else {
        result = addPsdUnitsByFlowSystem(result, this.levelLUCache.get(luid)!);
      }
    }

    this.changedLevelsSinceLastPLUCalc.clear();
    return result;
  }

  get onboardingScreen() {
    return ONBOARDING_SCREEN.DOCUMENT;
  }

  get onboarding(): OnboardingState {
    return this.$store.getters["onboarding/onboarding"];
  }

  get nodes() {
    return this.$store.getters["customEntity/nodes"];
  }

  get availableFlowSystems(): FlowSystemParameters[] {
    switch (this.document.uiState.pressureOrDrainage) {
      case "pressure":
        return this.document.drawing.metadata.flowSystems.filter(
          (s) => !isDrainage(s.uid, this.document.drawing.metadata.flowSystems)
        );
      case "drainage":
        return this.document.drawing.metadata.flowSystems.filter((s) =>
          isDrainage(s.uid, this.document.drawing.metadata.flowSystems)
        );
    }
    assertUnreachable(this.document.uiState.pressureOrDrainage);
  }

  projectCost(): Cost {
    let result: Cost = zeroCost();
    for (const o of this.globalStore.values()) {
      if (isCalculated(o.entity)) {
        const calc = this.globalStore.getOrCreateCalculation(o.entity);
        result = addCosts(result, calc.cost);
      }
    }
    return result;
  }

  levelLUCache = new Map<string, PsdUnitsByFlowSystem | null>();
  changedLevelsSinceLastPLUCalc = new Set<string>();

  ctx: CanvasRenderingContext2D | null = null;

  grabbedPoint: Coord | null = null;
  hasDragged: boolean = false;

  // The layers
  backgroundLayer: BackgroundLayer = new BackgroundLayer(this);
  hydraulicsLayer: HydraulicsLayer = new HydraulicsLayer(this);
  calculationLayer: CalculationLayer = new CalculationLayer(this);
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

  targetProperty: string | null = null;
  isLayerDragging: boolean = false;

  selectBox: SelectBox | null = null;
  selectBoxMode: SelectMode | null = null;
  selectBoxStartSelected: string[] = [];

  showExport = false;
  showFeedbackModal = false;

  mouseClicked: boolean = false;

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
    this.ctx = (this.$refs.drawingCanvas as any).getContext("2d");

    // In the future, there will be 2 types of OTs to handle. Full snapshots, and diffable updates.
    // At the moment, even small diffable updates go through the full treatment.

    MainEventBus.$on("redraw", this.scheduleDraw);
    MainEventBus.$on("entity-select", this.onEntitySelect);
    MainEventBus.$on("interaction-complete", this.onInteractionComplete);

    MainEventBus.$on("committed", this.onCommitted);
    MainEventBus.$on("set-tool-handler", this.setToolHandler);
    MainEventBus.$on("select", this.onSelectRequest);
    MainEventBus.$on("auto-connect", this.onAutoConnect);

    MainEventBus.$on("add-entity", this.onAddEntity);
    MainEventBus.$on("delete-entity", this.onDeleteEntity);
    MainEventBus.$on("add-level", this.onAddLevel);
    MainEventBus.$on("delete-level", this.onDeleteLevel);
    MainEventBus.$on("current-level-changed", this.onCurrentLevelChanged);
    MainEventBus.$on("update-pipe-endpoints", this.onPipeEndpoints);
    MainEventBus.$on("update-entity", this.onUpdateEntity);

    MainEventBus.$on("keydown", this.onKeyDown);

    MainEventBus.$on("validate-and-commit", this.onValidateAndCommit);
    MainEventBus.$on("drawing-loaded", this.onDrawingLoaded);

    MainEventBus.$on("set-scale", this.onSetScale);
    MainEventBus.$on("set-detail-scale", this.onDetailScale);
    MainEventBus.$on("set-preview", this.setIsPreview);
    MainEventBus.$on("entity-dependencies", this.runCheckEntityDependencies);
    this.$watch(
      () => this.document.uiState.drawingMode,
      (newVal, oldVal) => {
        if (oldVal === DrawingMode.History && newVal !== DrawingMode.History) {
          this.$store.dispatch("document/revertFull");
          this.scheduleDraw();
        }
        this.document.uiState.selectedUids.splice(0);
        this.document.uiState.warningFilter.activeEntityUid = "";
        this.considerCalculating();
        this.scheduleDraw();
      }
    );
    this.$watch(
      () => this.document.uiState.pressureOrDrainage,
      () => {
        this.select([], SelectMode.Replace);
        this.considerCalculating();
      }
    );
    this.$watch(
      () => this.document.uiState.warningFilter.activeEntityUid,
      (newVal, oldVal) => {
        if (!newVal) {
          this.document.uiState.selectedUids.splice(0);
        } else {
          // this.select([newVal], SelectMode.Replace);
          this.centerEntityOnScreen(newVal);
        }
        this.scheduleDraw();
      }
    );
    this.$watch(
      () => this.document.uiState.warningFilter.editEntityUid,
      (newVal, oldVal) => {
        if (!newVal) {
          return;
        }
        this.document.uiState.warningFilter.editEntityUid = "";
        this.select([newVal], SelectMode.Replace);
        this.centerEntityOnScreen(newVal);
        this.scheduleDraw();
      }
    );
    (this.$refs.drawingCanvas as any).onmousedown = this.onMouseDown;
    (this.$refs.drawingCanvas as any).onmousemove = this.onMouseMove;
    (this.$refs.drawingCanvas as any).onmouseup = this.onMouseUp;
    (this.$refs.canvasFrame as any).onwheel = this.onWheel;

    this.allLayers.push(this.backgroundLayer, this.hydraulicsLayer, this.calculationLayer);

    if (this.document.uiState.loaded) {
      this.onDrawingLoaded();
    }

    // set view on groundiest floor
    if (!this.currentLevel) this.selectGroundFloor();

    for (const luid of Object.keys(this.document.drawing.levels)) {
      this.changedLevelsSinceLastPLUCalc.add(luid);
    }

    this.setDrawingMode();
    this.setIsPreview(false);
    // setInterval(this.drawLoop, 20);
    this.initialized = true;
    this.scheduleDraw();
  }

  setDrawingMode() {
    if (this.document.uiState.viewOnly) {
      this.document.uiState.drawingMode = DrawingMode.Calculations;
    }
    const mode = this.$route.params.mode;
    if ([DrawingMode.FloorPlan, DrawingMode.Hydraulics, DrawingMode.Calculations].indexOf(parseInt(mode)) != -1) {
      this.document.uiState.drawingMode = parseInt(mode);
    }
  }

  destroyed() {
    MainEventBus.$off("redraw", this.scheduleDraw);
    MainEventBus.$off("entity-select", this.onEntitySelect);
    MainEventBus.$off("interaction-complete", this.onInteractionComplete);

    MainEventBus.$off("committed", this.onCommitted);
    MainEventBus.$off("set-tool-handler", this.setToolHandler);
    MainEventBus.$off("select", this.onSelectRequest);
    MainEventBus.$off("auto-connect", this.onAutoConnect);

    MainEventBus.$off("add-entity", this.onAddEntity);
    MainEventBus.$off("delete-entity", this.onDeleteEntity);
    MainEventBus.$off("add-level", this.onAddLevel);
    MainEventBus.$off("delete-level", this.onDeleteLevel);
    MainEventBus.$off("current-level-changed", this.onCurrentLevelChanged);
    MainEventBus.$off("update-pipe-endpoints", this.onPipeEndpoints);
    MainEventBus.$off("update-entity", this.onUpdateEntity);
    MainEventBus.$off("keydown", this.onKeyDown);
    MainEventBus.$off("validate-and-commit", this.onValidateAndCommit);
    MainEventBus.$off("drawing-loaded", this.onDrawingLoaded);
    MainEventBus.$off("set-scale", this.onSetScale);
    MainEventBus.$off("set-detail-scale", this.onDetailScale);
    MainEventBus.$off("entity-dependencies", this.runCheckEntityDependencies);
    this.document.uiState.lastCalculationId = -1;
  }

  onInteractionComplete(entity: DrawableEntityConcrete) {
    this.onValidateAndCommit(true, false);
  }

  onSetScale(screenScale: number) {
    const currS = matrixScale(this.viewPort.screen2worldMatrix);
    this.viewPort.rescale((1 / currS) * screenScale, this.viewPort.width / 2, this.viewPort.height / 2);
  }

  onDetailScale(detailScale: number) {
    // preserve screen scale
    const oldScreenScale = matrixScale(this.viewPort.screen2worldMatrix);
    this.viewPort.screenScale = detailScale;
    const newScreenScale = matrixScale(this.viewPort.screen2worldMatrix);
    this.viewPort.rescale(oldScreenScale / newScreenScale, this.viewPort.width / 2, this.viewPort.height / 2);
  }

  onEntitySelect({ entity, e }: { entity: DrawableEntityConcrete; e: MouseEvent }) {
    if (e.ctrlKey) {
      this.select([entity.uid], SelectMode.Add);
    } else if (e.shiftKey) {
      this.select([entity.uid], SelectMode.Exclude);
    } else {
      this.select([entity.uid], SelectMode.Replace);
    }
    this.targetProperty = null;
    this.scheduleDraw();
  }

  select(objects: BaseBackedObject[] | string[], mode: SelectMode): void {
    let ids: string[];

    if (objects.length !== 0 && objects[0] instanceof BaseBackedObject) {
      ids = (objects as BaseBackedObject[]).map((o) => o.uid);
    } else {
      ids = objects as string[];
    }
    switch (mode) {
      case SelectMode.Replace:
        this.selectedIds.splice(0, this.selectedIds.length, ...ids);
        break;
      case SelectMode.Toggle:
        const common = this.selectedIds.filter((uid) => ids.includes(uid));
        this.selectedIds.push(...ids);
        this.selectedIds.splice(0, this.selectedIds.length, ...this.selectedIds.filter((uid) => !common.includes(uid)));
        break;
      case SelectMode.Add:
        this.selectedIds.push(...ids.filter((uid) => !this.selectedIds.includes(uid)));
        break;
      case SelectMode.Exclude:
        this.selectedIds.splice(0, this.selectedIds.length, ...this.selectedIds.filter((uid) => !ids.includes(uid)));
        break;
      default:
        assertUnreachable(mode);
    }
    let backgroundEntityIndex = this.selectedIds.findIndex(
      (euid) => this.globalStore.get(euid)!.type === EntityType.BACKGROUND_IMAGE
    );
    if (backgroundEntityIndex !== -1) {
      this.selectedIds.splice(0, this.selectedIds.length, this.selectedIds[backgroundEntityIndex]);
    }
  }
  setIsPreview(state: boolean) {
    this.$store.dispatch("document/setPreviewMode", state);
  }
  onDrawingLoaded() {
    this.onValidateAndCommit(false, true);
    this.runCheckEntityDependencies();
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

  onCommitted(redraw: boolean = true) {
    if (redraw) {
      this.scheduleDraw();
      this.runCheckEntityDependencies();
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
    if (this.document.uiState.drawingMode === DrawingMode.History) {
      return new Set(this.selectedIds);
    }

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
          if (no) {
            // sometimes our object is out of sync because our events lagged, but this should eventually coincide.
            if (!result.has(no.uid)) {
              result.add(no.uid);
              no.getNeighbours().forEach((nno) => {
                if (nno) {
                  result.add(nno.uid);
                } else {
                  // sometimes our object is out of sync because our events lagged, but this should eventually coincide.
                }
              });
            }
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
    this.globalStore.updatePipeEndpoints(entity.uid);
  }

  onCurrentLevelChanged() {
    if (this.currentLevel) {
      this.changedLevelsSinceLastPLUCalc.add(this.currentLevel.uid);
    }
    this.scheduleDraw();
  }

  onKeyDown(event: KeyboardEvent) {
    switch (event.keyCode) {
      case KeyCode.Z:
        if (event.ctrlKey) {
          if (event.shiftKey) {
            this.onRedo();
          } else {
            this.onUndo();
          }
        }
        break;
      case KeyCode.Y:
        if (event.ctrlKey) {
          this.onRedo();
        }
        break;
      case KeyCode.C:
        if (event.ctrlKey) {
          this.copySelected();
        }
        break;
      case KeyCode.V:
        if (event.ctrlKey) {
          this.paste();
        }
      default:
        break;
    }
  }

  onUndo() {
    if (this.toolHandler === null) {
      this.$store.dispatch("document/undo");
    }
  }

  onRedo() {
    if (this.toolHandler === null) {
      this.$store.dispatch("document/redo");
    }
  }

  onUpdateEntity(uid: string) {
    //
    if (this.globalStore.levelOfEntity.get(uid)) {
      this.changedLevelsSinceLastPLUCalc.add(this.globalStore.levelOfEntity.get(uid)!);
    }
  }

  onAddEntity({ entity, levelUid }: EntityParam) {
    // Layers are responsible for this.
    //this.scheduleDraw();
    if (levelUid) {
      this.changedLevelsSinceLastPLUCalc.add(levelUid);
    }
  }

  onDeleteEntity({ entity, levelUid }: EntityParam) {
    // Layers are responsible for this.
    if (this.document.uiState.selectedUids.includes(entity.uid)) {
      this.document.uiState.selectedUids.splice(this.document.uiState.selectedUids.indexOf(entity.uid), 1);
    }

    if (levelUid) {
      this.changedLevelsSinceLastPLUCalc.add(levelUid);
    }
    //this.scheduleDraw();
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
    //
    this.changedLevelsSinceLastPLUCalc.add(level.uid);
  }

  onDeleteLevel(level: Level) {
    //
    if (level.uid === this.document.uiState.levelUid) {
      this.selectGroundFloor();
    }
    this.changedLevelsSinceLastPLUCalc.add(level.uid);
  }

  disableContextMenu(e: MouseEvent) {
    e.preventDefault();

    if (this.selectedEntities.length !== 1) {
      return;
    }

    const { type } = this.selectedEntities[0];

    if (entityTypeSupportsSimilar(type)) {
      var menuNode = this.$refs.menu as HTMLDivElement;
      var rect = (this.$refs.drawingCanvas as HTMLCanvasElement).getBoundingClientRect();
      var x = e.x - rect.left;
      var y = e.y - rect.top;

      // show menu
      menuNode!.style.display = "initial";
      menuNode!.style.top = y + 4 + "px";
      menuNode!.style.left = x + 4 + "px";
    }
  }

  handleClickSelectSimilar() {
    const selected = this.selectedEntities[0];

    const similarIds = getIdsOfSimilarEntities(
      selected,
      this.document.drawing,
      this.document.uiState.levelUid,
      this.globalStore
    );

    this.select(similarIds, SelectMode.Add);

    this.targetProperty = null;
    this.scheduleDraw();
    this.handleCloseMenu();
  }

  handleCloseMenu() {
    var menuNode = this.$refs.menu as HTMLDivElement;
    menuNode!.style.display = "none";
    return;
  }

  onAutoConnect() {
    if (this.selectedObjects) {
      const ac = new AutoConnector(this.selectedObjects, this);
      ac.autoConnect();
      this.scheduleDraw();
    }
  }

  async onValidateAndCommit(logUndo: boolean, tryToFix: boolean = false) {
    if (this.document.uiState.drawingMode === DrawingMode.History) {
      this.$store.dispatch("document/revert");
      return;
    }

    rebaseAll(this);

    // the below code cleans up the document on open from various bugs
    // do not delete / disable if the underlying root causes of the bugs have not been found and fixed
    // the original author decided to "hide" teh bugs with this code
    // and it's a real can of worms
    // https://h2xengineering.atlassian.net/browse/DEV-621    
    const modified = this.removeOrphanObjects();
    if(modified) {
      await reportWarning("Removed orphan objects");
    }
    if (tryToFix) {
      await this.deleteDuplicatePipes();
      await this.deleteWeirdStuff();
    }
    const res = this.validate(tryToFix);
    if (res.success) {
      this.$store.dispatch("document/commit", { skipUndo: !logUndo });
    } else if (res.modified) {
      this.onValidateAndCommit(logUndo, tryToFix);
      this.$bvModal.msgBoxOk(res.message);
      await reportWarning(res.message);
    } else {
      this.$store.dispatch("document/revert");
      this.$bvModal.msgBoxOk(res.message);
      await reportWarning(res.message);      
      this.scheduleDraw();
    }
  }

  async deleteDuplicatePipes() {
    // this is done here rather than at the entity level for performance reasons.
    let numDeleted = 0;
    const seen = new Set<string>();
    for (const o of this.globalStore.values()) {
      if (o.entity.type === EntityType.PIPE) {
        const key = o.entity.endpointUid[0] + ":" + o.entity.endpointUid[1];
        if (seen.has(key)) {
          this.deleteEntity(o);
          numDeleted++;
        } else {
          const key2 = o.entity.endpointUid[1] + ":" + o.entity.endpointUid[0];
          seen.add(key);
          seen.add(key2);
        }
      }
    }

    if (numDeleted) {
      const message = "Info: Deleted " + numDeleted + " duplicate pipes";
      this.$bvModal.msgBoxOk(message);
      await reportWarning(message);
    }
  }

  async deleteWeirdStuff() {
    // Sometimes, there are dangling objects that don't have IDs. This is caused by something broken in the software.
    // DEV-156. I cannot find it. It is cheaper to remove it here, and mask the problem.
    let numDeleted = 0;
    for (const [levelUid, level] of Object.entries(this.document.drawing.levels)) {
      for (const [entityUid, entity] of Object.entries(level.entities)) {
        if (entity.uid !== entityUid) {
          // we will delete now, but we have to add the uid field artificially.
          entity.uid = entityUid;
          this.$store.dispatch("document/deleteEntityOn", { entity, levelUid });
          numDeleted++;
        }
      }
    }

    for (const [entityUid, entity] of Object.entries(this.document.drawing.shared)) {
      if (entity.uid !== entityUid) {
        // we will delete now, but we have to add the uid field artificially.
        entity.uid = entityUid;
        // Make it a riser, just in case of error checking in delete.
        entity.type = EntityType.RISER;
        this.$store.dispatch("document/deleteEntityOn", { entity, levelUid: null });
        numDeleted++;
      }
    }

    if (numDeleted) {
      const message = "Info: Deleted " +
          numDeleted + 
          " extraneous objects. This could have been" +
          " caused by a saving /network error.";
      this.$bvModal.msgBoxOk(message);
      await reportWarning(message);
    }
  }

  removeOrphanObjects(): boolean {
    let modified = false;
    for (const o of Array.from(this.globalStore.values())) {
      switch (o.entity.type) {
        case EntityType.BACKGROUND_IMAGE:
          break;
        case EntityType.FITTING:
          if (this.globalStore.getConnections(o.entity.uid).length === 0) {
            // this.deleteEntity(o); this is causing issues with multi editing and drawing pipes, first leg.
            console.log("orphan fitting", o.entity.uid);
            modified = true;
          }
          break;
        case EntityType.PIPE:
          let ok = true;
          const myLevel = this.globalStore.levelOfEntity.get(o.entity.uid);
          for (const uid of o.entity.endpointUid) {
            const eLvl = this.globalStore.levelOfEntity.get(uid);
            if (eLvl !== null && eLvl !== myLevel) {
              ok = false;
            }
          }

          if (!ok) {
            const ep: EntityParam = {
              entity: o.entity,
              levelUid: this.globalStore.levelOfEntity.get(o.entity.uid)!
            };
            this.$store.dispatch("document/deleteEntityOn", ep);
            modified = true;
            console.log("pipe multi-level endpoints", o.entity.uid);
          }
          break;
        case EntityType.RISER:
          break;
        case EntityType.SYSTEM_NODE:
          const parentUid = o.entity.parentUid!;
          if (!this.globalStore.has(parentUid)) {
            const ep: EntityParam = {
              entity: o.entity,
              levelUid: this.globalStore.levelOfEntity.get(o.entity.uid)!
            };
            this.$store.dispatch("document/deleteEntityOn", ep);
            modified = true;
            console.log("orphan system node", o.entity.uid);
          }
          break;
        case EntityType.BIG_VALVE:
          break;
        case EntityType.FIXTURE:
          break;
        case EntityType.DIRECTED_VALVE:
          break;
        case EntityType.LOAD_NODE:
          break;
        case EntityType.FLOW_SOURCE:
          break;
        case EntityType.PLANT:
          break;
      }
    }

    return modified;
  }

  validate(tryToFix: boolean): ValidationResult {
    let result: ValidationResult | null = null;
    for (const o of this.globalStore.values()) {
      const res = o.validate(this, tryToFix);
      if (!res.success && res.modified) {
        // should only cause one unsuccessful validation. Any edits after that would cause a restart.
        this.$store.dispatch("document/commit"); // commit without validation first
        return res;
      } else if (!res.success) {
        result = res;
      }
    }
    return result || { success: true };
  }

  deleteEntity(object: BaseBackedObject): Set<string> {
    if (this.document.uiState.drawingMode === DrawingMode.History || this.document.uiState.viewOnly) {
      return new Set();
    }

    object = this.globalStore.get(object.uid)!;
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

  centerEntityOnScreen(entityUid: string): void {
    const obj = this.globalStore.get(entityUid);
    if (!obj) {
      throw new Error("Selecting an object that doesn't exist");
    }
    const shape = obj.shape();
    if (shape) {
      this.viewPort.panToWc(shape.box.center);
    }
  }

  async onSelectRequest(selectionTarget: SelectionTarget) {
    if (selectionTarget.uid === null) {
      this.select([], SelectMode.Replace);
    } else {
      let objectLevel = this.globalStore.levelOfEntity.get(selectionTarget.uid);

      const obj = this.globalStore.get(selectionTarget.uid);
      if (!obj) {
        throw new Error("Selecting an object that doesn't exist");
      }
      if (obj.entity.type === EntityType.RISER) {
        const riser = obj as Riser;
        // risers have level set to null, so we can't use it to find a visible level.
        for (const lvlUid of [this.document.uiState.levelUid, ...Object.keys(this.document.drawing.levels)]) {
          if (
            levelIncludesRiser(
              this.document.drawing.levels[lvlUid!],
              obj.entity,
              this.$store.getters["document/sortedLevels"]
            )
          ) {
            objectLevel = lvlUid;
            break;
          }
        }
      }

      if (objectLevel && (this.currentLevel === null || objectLevel !== this.currentLevel.uid)) {
        await this.$store.dispatch("document/setCurrentLevelUid", objectLevel);
        await cooperativeYield();
      }

      if (this.currentLevel!.uid !== objectLevel) {
        throw new Error("Level didn't change properly");
      }

      const drawable = obj.entity;
      if (drawable.type === EntityType.BACKGROUND_IMAGE) {
        this.document.uiState.drawingMode = DrawingMode.FloorPlan;
      } else if (drawable) {
        this.document.uiState.drawingMode = DrawingMode.Hydraulics;
      }

      await cooperativeYield(); // wait for document to auto clear selection after changing mode

      this.select([obj], SelectMode.Replace);

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
      this.$store.dispatch("document/validateAndCommit").then(() => {
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
        const { l, r, t, b } = getVisibleBoundingBox(this.globalStore, this.document);

        const w = this.ctx!.canvas.width;
        const h = this.ctx!.canvas.height;
        const s = Math.max((r - l + 1) / w, (b - t + 1) / h, 1) * 1.5;
        this.viewPort = new ViewPort(TM.transform(TM.translate((l + r) / 2, (t + b) / 2), TM.scale(s)), w, h);
        this.scheduleDraw();
      }
    }
  }

  hydraulicsInsert(params: {
    entityName: EntityType;
    system: FlowSystemParameters;
    catalogId: string;
    valveType: ValveType;
    nodeType: NodeType;
    bigValveType: BigValveType;
    valveName: string;
    networkType: NetworkType;
    variant: string;
    plantType: PlantType;
    inletSystemUid: string;
    outletSystemUid: string;
    title: string;
    customNodeId: number;
    isVent: boolean | undefined;
  }) {
    const {
      entityName,
      system,
      catalogId,
      valveType,
      nodeType,
      valveName,
      networkType,
      bigValveType,
      plantType,
      inletSystemUid,
      outletSystemUid,
      title,
      isVent
    } = params;
    this.select([], SelectMode.Replace);

    if (entityName === EntityType.RISER) {
      insertRiser(this, system, isVent);
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
      if (valveName) {
        this.document.uiState.lastUsedValveVid = {
          catalogId,
          name: valveName,
          type: valveType
        };
      }
      insertDirectedValve(this, valveType, catalogId, system);
    } else if (entityName === EntityType.LOAD_NODE) {
      if (params.variant === "hot-cold-load") {
        insertFixtureHotCold(this, 0, params.customNodeId);
      } else if (params.variant === "continuous") {
        insertLoadNode(this, nodeType, system?.uid || null, 0, 1, 1, NodeVariant.CONTINUOUS);
      } else {
        insertLoadNode(this, nodeType, system?.uid || null, 1, 0, 1, NodeVariant.FIXTURE);
      }
    } else if (entityName === EntityType.FLOW_SOURCE) {
      insertFlowSource(this, system);
    } else if (entityName === EntityType.PLANT) {
      insertPlant(this, 0, plantType, inletSystemUid, outletSystemUid, title, false);
    } else if (entityName === EntityType.GAS_APPLIANCE) {
      insertGasAppliance(this, 0);
    }
  }

  async drawFast() {
    // this.sanityCheckGlobalStore();
    try {
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
    } catch (e) {
      this.drawError(e);
      console.error(e);
    }
  }

  // We can turn reactive off when there are problems.
  async blitBuffer(drawReactive: boolean = true) {
    await util.promisify(requestAnimationFrame);
    this.ctx!.resetTransform();
    this.ctx!.clearRect(0, 0, this.viewPort.width, this.viewPort.height);

    this.buffer.drawOnto(this.ctx!, this.viewPort.world2ScreenMatrix);

    const context: DrawingContext = {
      ctx: this.ctx!,
      vp: this.viewPort,
      doc: this.document,
      priceTable: this.effectivePriceTable,
      catalog: this.effectiveCatalog,
      globalStore: this.globalStore,
      selectedUids: new Set<string>(), // this is set in the draw reactive layer,
      nodes: this.nodes
    };

    if (drawReactive && this.activeLayer) {
      const reactive = new Set(this.buffer.excluded);
      this.reactiveDrawSet().forEach((uid) => {
        reactive.add(uid);
      });
      for (const layer of this.allLayers) {
        layer.drawReactiveLayer(
          context,
          this.document.uiState.drawingMode === DrawingMode.History
            ? []
            : [...this.interactiveUids, ...this.uncommittedEntityUids],
          reactive
        );
      }
    }

    // draw gridlines
    drawGridLines(context);

    // draw selection box
    if (this.selectBox) {
      this.selectBox.draw(context, {
        active: true,
        forExport: false,
        withCalculation: false
      });
    }

    if (this.toolHandler) {
      context.ctx.setTransform(TM.identity());
      this.toolHandler.draw(context);
    }
  }

  get focusLUs() {
    if (this.selectedEntities.length && this.document.uiState.drawingMode === DrawingMode.Hydraulics) {
      return countPsdUnits(this.selectedEntities, this.document, this.effectiveCatalog, this.globalStore, this.nodes);
    } else {
      return countPsdUnits(
        Array.from((this.globalStore.entitiesInLevel.get(this.document.uiState.levelUid) || new Set()).values()).map(
          (u) => {
            if (!this.globalStore.has(u)) {
              throw new Error("can't find uid " + u);
            }
            return this.globalStore.get(u)!.entity;
          }
        ),
        this.document,
        this.effectiveCatalog,
        this.globalStore,
        this.nodes
      );
    }
  }

  get focusCost(): Cost {
    let result: Cost = zeroCost();
    let entities: DrawableEntityConcrete[] = [];
    if (this.selectedEntities.length && this.document.uiState.drawingMode === DrawingMode.Hydraulics) {
      entities = this.selectedEntities;
    } else {
      entities = Array.from(
        (this.globalStore.entitiesInLevel.get(this.document.uiState.levelUid) || new Set()).values()
      ).map((u) => {
        if (!this.globalStore.has(u)) {
          throw new Error("can't find uid " + u);
        }
        return this.globalStore.get(u)!.entity;
      });
    }
    if (this.document.uiState.isCalculating) {
      // Trigger vue to recalculate this field upon new calculations
    }
    for (const e of entities) {
      if (isCalculated(e)) {
        const calc = this.globalStore.getOrCreateCalculation(e);
        result = addCosts(result, calc.cost);
      }
    }
    return result;
  }

  get focusName() {
    if (this.selectedEntities.length && this.document.uiState.drawingMode === DrawingMode.Hydraulics) {
      return "Selection";
    } else {
      return "Level";
    }
  }

  beforeDrawWithoutTool() {
    this.onDetailScale(1);
  }

  async drawFull(altCtx?: CanvasRenderingContext2D, altVp?: ViewPort, forExport: boolean = false) {
    if (!forExport) {
      this.simulDraws++;
    }
    if (this.simulDraws === 2) {
      throw new Error("Shound't be running 2 simulaneous draws");
    }
    try {
      console.time("drawFull");

      const shouldContinue = (() => {
        const res = this.fullRenderQueue.length < 2; // || this.numSkipped > 4;
        if (res === false) {
          this.numSkipped++;
        }
        // return res;
        return true;
      }).bind(this);

      const reactive = this.reactiveDrawSet();
      const buffer = new Buffer(this.viewPort.width, this.viewPort.height, this.viewPort.world2ScreenMatrix, reactive);

      const context: DrawingContext = {
        ctx: altCtx || buffer.ctx,
        vp: altVp || this.viewPort.copy(),
        priceTable: this.effectivePriceTable,
        doc: this.document,
        catalog: this.effectiveCatalog,
        globalStore: this.globalStore,
        selectedUids: new Set<string>(this.selectedIds),
        nodes: this.nodes
      };

      if (this.toolHandler && !forExport) {
        this.toolHandler.beforeDraw(context);
      } else {
        this.beforeDrawWithoutTool();
      }

      //context.vp = altVp || this.viewPort.copy(); // hack for the use case of the beforeDraw api. Perhaps there's
      // a nicer way.

      // this.buffer.transform = this.viewPort.world2ScreenMatrix; do that at the end
      this.lastDrawingContext = context;

      if (!forExport || this.document.uiState.exportSettings.floorPlans) {
        await this.backgroundLayer.draw(
          context,
          this.document.uiState.drawingMode === DrawingMode.FloorPlan && !forExport,
          shouldContinue,
          reactive,
          this.currentTool,
          forExport,
          this.floorLockStatus
        );
      }

      await this.hydraulicsLayer.draw(
        context,
        this.document.uiState.drawingMode === DrawingMode.Hydraulics ||
          this.document.uiState.drawingMode === DrawingMode.History,
        shouldContinue,
        reactive,
        this.document.uiState.drawingMode,
        this.document.uiState.drawingMode === DrawingMode.Calculations,
        forExport
      );
      await cooperativeYield(shouldContinue);
      await this.calculationLayer.draw(
        context,
        this.document.uiState.drawingMode === DrawingMode.Calculations,
        shouldContinue,
        reactive,
        this.document.uiState.drawingMode === DrawingMode.Calculations,
        forExport
      );
      await cooperativeYield(shouldContinue);

      // Draw hydraulics layer

      // Draw selection layers
      /*
                        if (this.activeLayer) {
                            await this.activeLayer.drawSelectionLayer(context, this.interactive);
                            await cooperativeYield(shouldContinue);
                        }*/

      if (!forExport) {
        this.buffer = buffer; // swap out the buffer, so that the new render shows the new frame.
        await this.blitBuffer();
        this.numSkipped = 0;
      }

      console.timeEnd("drawFull");
    } catch (e) {
      if (e instanceof InterruptedError) {
        // that's fine, just exit, because a newer frame wants to render.
      } else {
        this.drawError(e);
        console.error(e);
      }
    } finally {
      if (!forExport) {
        this.simulDraws--;
      }
    }
  }

  async drawError(e: Error) {
    console.log(e);
    if (this.ctx) {
      try {
        await this.blitBuffer(false);
      } catch (e) {
        // Throw exception
        console.log(e);
      }

      this.ctx.resetTransform();
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      this.ctx.fillRect(0, 0, this.viewPort.width, this.viewPort.height);
      this.ctx.fillStyle = "#FFFFFF";
      this.ctx.font = 100 + "px " + DEFAULT_FONT_NAME;
      const dims = this.ctx.measureText("Rendering Error");
      this.ctx.fillText("Rendering Error", this.viewPort.width / 2 - dims.width / 2, this.viewPort.height / 2 - 50);
    }
  }

  considerCalculating() {
    this.$store.dispatch("document/reCalculate", false);

    if (this.document.uiState.drawingMode === DrawingMode.Calculations) {
      this.document.uiState.calculationFilterSettings = getSavedFilterSettings(window, this.document.documentId, initialUIState.calculationFilterSettings);
      this.document.uiState.calculationFilters = getSavedFilters(window, this.document.documentId, {});
      this.document.uiState.warningFilter = getSavedWarningsFilter(window, this.document.documentId, initialUIState.warningFilter);

      if (!this.document.uiState.isCalculating) {
        this.calculationLayer.calculate(this, () => {
          this.scheduleDraw();
        });
      }
    }
  }

  async copySelected() {
    this.$store.dispatch("document/resetPastes");
    const entities: DrawableEntityConcrete[] = [];
    const objects = Array.from(this.selectedObjects);
    const seenUids = new Set<string>();
    for (let i = 0; i < objects.length; i++) {
      if (seenUids.has(objects[i].uid)) {
        continue;
      }
      seenUids.add(objects[i].uid);
      if (isCenteredEntity(objects[i].entity)) {
        objects[i].debase(this);
      }

      const toCopy = objects[i].getCopiedObjects();
      objects.push(...toCopy);

      const entity = cloneSimple(objects[i].entity);
      entities.push(entity);
      if (isCenteredEntity(objects[i].entity)) {
        objects[i].rebase(this);
      }
    }

    await navigator.clipboard.writeText(
      JSON.stringify({
        type: "h2x_clipboard",
        entities: entities
      })
    );
    Vue.set(this.document.uiState.pastesByLevel, this.document.uiState.levelUid || "null", 1);
  }

  async paste() {
    const text = await navigator.clipboard.readText();
    try {
      const val = JSON.parse(text);
      if (val.hasOwnProperty("type") && val.type === "h2x_clipboard") {
        let nPastes = this.document.uiState.pastesByLevel[this.document.uiState.levelUid || "null"] || 0;

        const entities: DrawableEntityConcrete[] = val.entities;

        let hasBackground = false;
        let bgWidth = 0;
        for (const e of entities) {
          if (e.type === EntityType.BACKGROUND_IMAGE) {
            hasBackground = true;
            bgWidth = Math.max(bgWidth, e.crop.w);
          }
        }

        const uidMap = new Map<string, string>();
        for (const e of entities) {
          if (!nPastes && e.type === EntityType.RISER) {
            // Don't duplicate the risers if copying from one level to the other
            if (this.globalStore.has(e.uid)) {
              if (stringify((this.globalStore.get(e.uid) as Riser).entity.center) === stringify(e.center)) {
                continue;
              }
            }
          }
          uidMap.set(e.uid, uuid());
        }

        const entitiesCopied: DrawableEntityConcrete[] = [];
        for (const e of entities) {
          if (!uidMap.has(e.uid)) {
            continue;
          }
          e.uid = uidMap.get(e.uid)!;
          let etext = JSON.stringify(e);
          for (const r of getReferences(e)) {
            if (r != null && !uidMap.has(r)) {
              // This is actually a normal case now for when we want to reference existing objects.
              // throw new Error('UID reference not found for entity ' + JSON.stringify(e) + ' reference ' + r);
            } else {
              etext = etext.replace(r, uidMap.get(r)!);
            }
          }
          entitiesCopied.push(JSON.parse(etext));
        }

        for (const e of entitiesCopied) {
          if (hasBackground) {
            // Offset only the background after each paste
            if (e.type === EntityType.BACKGROUND_IMAGE) {
              e.center.x += (bgWidth + 2000) * nPastes;
            }

            if (isCenteredEntity(e)) {
              if (e.parentUid === null) {
                e.center.x += (bgWidth + 2000) * nPastes;
              }
            }
          } else {
            // Offset the location by incremental amounts after each paste
            if (isCenteredEntity(e)) {
              if (e.parentUid === null) {
                e.center.x += 1000 * nPastes;
                e.center.y += 1000 * nPastes;
              }
            }
          }
          this.$store.dispatch("document/addEntity", e);
          if (isCenteredEntity(e)) {
            this.globalStore.get(e.uid)!.rebase(this);
          }
        }
        nPastes++;
        Vue.set(this.document.uiState.pastesByLevel, this.document.uiState.levelUid || "null", nPastes);

        this.select(
          entitiesCopied.map((e) => this.globalStore.get(e.uid)!).filter((o) => o.selectable),
          SelectMode.Replace
        );
      }
      this.$store.dispatch("document/validateAndCommit");
    } catch (e) {
      //
    }
    this.scheduleDraw();
  }

  onDrop(value: any, event: DragEvent) {
    if (event.dataTransfer) {
      event.preventDefault();
      if (event.dataTransfer.files.length > 1) {
        this.$bvModal.msgBoxOk(
          "Please drag and drop the .PDF for the " +
            (this.currentLevel ? this.currentLevel.name : "current") +
            " level one at a time."
        );
      } else {
        for (let i = 0; i < event.dataTransfer.files.length; i++) {
          if (!(event.dataTransfer.files.item(i) as File).name.endsWith("pdf")) {
            continue;
          }

          const w = this.viewPort.toWorldCoord({ x: event.offsetX, y: event.offsetY });

          this.insertFloorPlan(event.dataTransfer.files.item(i) as File, w);
        }
      }
    }
  }

  onFloorPlanSelected(file: File) {
    const m = decomposeMatrix(this.viewPort.surfaceToWorld);
    this.insertFloorPlan(file, { x: m.tx + this.viewPort.width / 2, y: m.ty + this.viewPort.height / 2 });
  }

  insertFloorPlan(file: File, wc: Coord) {
    if (!this.currentLevel) {
      this.$bvModal.msgBoxOk("Please select a level before uploading a PDF");
      return;
    }

    const lvlUid = this.currentLevel.uid;
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
          key
        };

        const ep: EntityParam = {
          entity: background,
          levelUid: lvlUid
        };

        this.$store.dispatch("document/addEntityOn", ep);
        this.$store.dispatch("document/validateAndCommit");
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
    if (this.toolHandler) {
      if (this.toolHandler.onMouseDown(event, this)) {
        return true;
      }
    } else {
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
          this.viewPort.toWorldCoord({ x: event.offsetX, y: event.offsetY }),
          this.viewPort.toWorldCoord({ x: event.offsetX, y: event.offsetY })
        );

        return true;
      }

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
        this.select(_.clone(this.selectBoxStartSelected), SelectMode.Replace);

        this.select(
          this.hydraulicsLayer.uidsInOrder.filter((uid) => {
            return this.selectBox!.inSelection([this.globalStore.get(uid)!]).length > 0;
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

    this.scheduleDraw();
    return false;
  }

  onWheel(event: WheelEvent) {
    event.preventDefault();
    let delta = 1 + event.deltaY / 500;
    if (event.deltaY < 0) {
      delta = 1 / (1 - event.deltaY / 500);
    }
    const currS = matrixScale(this.viewPort.surfaceToWorld);
    delta = Math.max(0.5 / currS, delta);
    delta = Math.min(2000 / currS, delta);

    if (!this.toolHandler || !this.toolHandler.config.preventZooming) {
      this.viewPort.rescale(delta, event.offsetX, event.offsetY);
    }

    this.scheduleDraw();
  }

  isSelected(object: BaseBackedObject | string) {
    if (object instanceof BaseBackedObject) {
      return this.selectedIds.indexOf(object.uid) !== -1;
    } else {
      return this.selectedIds.indexOf(object) !== -1;
    }
  }

  checkOnboardingClass(step: number) {
    return step === this.onboarding.currentStep && this.onboarding.screen === ONBOARDING_SCREEN.DOCUMENT;
  }

  runCheckEntityDependencies() {
    const calc = new CalculationEngine();
    this.$store.dispatch(
      "document/updateDependenceOn",
      calc.identifyDependencies(this.globalStore, this.document, this.effectiveCatalog)
    );
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

#menu {
  display: none;
  position: absolute;
  width: auto;
  background-color: white;
  box-shadow: 0 0 5px grey;
  border-radius: 3px;
}

#menu button {
  background-color: white;
  border: none;
  margin: 0;
  padding: 10px;
  white-space: nowrap;
}

#menu button:hover {
  background-color: lightgray;
}

.helpButton {
  position: fixed;
  bottom: 30px;
  right: 30px;
  opacity: 1;
  background-color: #f0f8ff;
}
</style>
