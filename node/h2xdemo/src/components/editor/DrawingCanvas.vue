import {ValveType} from "@/store/document/entities/directed-valves/valve-types";
<template>
    <div ref="canvasFrame" class="fullFrame">
        <drop
            @drop="onDrop"
        >
            <canvas ref="drawingCanvas" @contextmenu="disableContextMenu" v-bind:style="{ backgroundColor: 'aliceblue', cursor: currentCursor}">

            </canvas>

            <ModeButtons
                    :mode.sync="mode"
                    v-if="currentTool.modesVisible"
            />

            <FloorPlanInsertPanel
                @insert-floor-plan="onFloorPlanSelected"
                v-if="mode === 0"
            />

            <HydraulicsInsertPanel
                v-if="mode === 1"
                :flow-systems="document.drawing.flowSystems"
                @insert="hydraulicsInsert"
                :fixtures="effectiveCatalog.fixtures"
                :valves="effectiveCatalog.valves"
                :available-fixtures="availableFixtures"
                :available-valves="availableValves"
                :last-used-fixture-uid="document.uiState.lastUsedFixtureUid"
                :last-used-valve-vid="document.uiState.lastUsedValveCUid"
            />

            <CalculationBar
                v-if="mode === 2"
                :demandType.sync="demandType"
                :is-calculating="isCalculating"
            />

            <PropertiesWindow
                    :selected-entities="selectedEntities"
                    :selected-objects="selectedObjects"
                    :target-property="targetProperty"
                    v-if="selectedObjects.length && propertiesVisible"
                    :mode="mode"
                    :on-change="scheduleDraw"
                    :on-delete="deleteSelected"
            >

            </PropertiesWindow>

            <Toolbar
                    :current-tool-config="currentTool"
                    :on-tool-click="changeTool"
                    :on-fit-to-view-click="fitToView"
            ></Toolbar>

            <InstructionPage
                v-if="documentBrandNew && toolHandler === null"
            />
        </drop>
        <resize-observer @notify="draw"/>

    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import {ViewPort} from "@/htmlcanvas/viewport";
    import {Coord, DocumentState, FlowSystemParameters} from "@/store/document/types";
    import {drawPaperScale} from "@/htmlcanvas/scale";
    import ModeButtons from "@/components/editor/ModeButtons.vue";
    import PropertiesWindow from "@/components/editor/property-window/PropertiesWindow.vue";
    import {DrawingMode, MouseMoveResult, UNHANDLED} from "@/htmlcanvas/types";
    import BackgroundLayer from "@/htmlcanvas/layers/background-layer";
    import * as TM from "transformation-matrix";
    import {decomposeMatrix, matrixScale} from "@/htmlcanvas/utils";
    import Toolbar from "@/components/editor/Toolbar.vue";
    import LoadingScreen from "@/views/LoadingScreen.vue";
    import {MainEventBus} from "@/store/main-event-bus";
    import {ToolConfig} from "@/store/tools/types";
    import {DEFAULT_TOOL, ToolHandler} from "@/htmlcanvas/lib/tool";
    import uuid from "uuid";
    import {renderPdf} from "@/api/pdf";
    import HydraulicsLayer from "@/htmlcanvas/layers/hydraulics-layer";
    import Layer, {SelectMode} from "@/htmlcanvas/layers/layer";
    import HydraulicsInsertPanel from "@/components/editor/HydraulicsInsertPanel.vue";
    import BaseBackedObject from "@/htmlcanvas/lib/base-backed-object";
    import {EntityType} from "@/store/document/entities/types";
    import {Interaction} from "@/htmlcanvas/lib/interaction";
    import insertFlowSource from "@/htmlcanvas/tools/insert-flow-source";
    import insertPipes from "@/htmlcanvas/tools/insert-pipes";
    import insertValve from "@/htmlcanvas/tools/insert-valve";
    import {DrawingContext, ObjectStore, SelectionTarget, ValveId} from "@/htmlcanvas/lib/types";
    import {BackgroundEntity} from "@/store/document/entities/background-entity";
    import insertTmv from "@/htmlcanvas/tools/insert-tmv";
    import insertFixture from "@/htmlcanvas/tools/insert-fixture";
    import FloorPlanInsertPanel from "@/components/editor/FloorPlanInsertPanel.vue";
    import InstructionPage from "@/components/editor/InstructionPage.vue";
    import CalculationBar from "@/components/CalculationBar.vue";
    import {DemandType} from "@/calculations/types";
    import CalculationEngine from "@/calculations/calculation-engine";
    import CalculationLayer from "@/htmlcanvas/layers/calculation-layer";
    import {getBoundingBox} from "@/htmlcanvas/lib/utils";
    import {Catalog} from "@/store/catalog/types";
    import {DrawableEntityConcrete} from "@/store/document/entities/concrete-entity";
    import SelectBox from "@/htmlcanvas/objects/select-box";
    import * as _ from "lodash";
    import {AutoConnector} from "@/htmlcanvas/lib/black-magic/auto-connect";
    import {assertUnreachable} from "@/lib/utils";
    import insertDirectedValve from "@/htmlcanvas/tools/insert-directed-valve";
    import {ValveType} from '@/store/document/entities/directed-valves/valve-types';

    @Component({
        components: {
            CalculationBar,
            InstructionPage,
            FloorPlanInsertPanel,
            LoadingScreen,
            HydraulicsInsertPanel, Overlay: LoadingScreen, Toolbar, PropertiesWindow, ModeButtons},
    })
    export default class DrawingCanvas extends Vue {

        ctx: CanvasRenderingContext2D | null = null;

        grabbedPoint: Coord | null = null;
        hasDragged: boolean = false;

        objectStore: ObjectStore =
            new ObjectStore();

        // The layers
        backgroundLayer: BackgroundLayer = new BackgroundLayer(
            this.objectStore,
            () => {
                this.scheduleDraw();
            },
            () => {
                this.onLayerSelect();
            },
            () => { // onCommit
                this.$store.dispatch('document/commit');
            },
        );
        hydraulicsLayer: HydraulicsLayer = new HydraulicsLayer(
            this.objectStore,
            () => {
                this.scheduleDraw();
            },
            () => {
                this.onLayerSelect();
            },
            () => {
                this.$store.dispatch('document/commit');
            },
        );
        calculationLayer: CalculationLayer = new CalculationLayer(
            this.objectStore,
            () => {
                this.scheduleDraw();
            },
            () => {
                this.onLayerSelect();
            },
            () => {
                this.$store.dispatch('document/commit');
            },
        );
        allLayers: Layer[] = [];


        toolHandler: ToolHandler | null = null;
        currentCursor: string = 'auto';

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

        mounted() {
            this.ctx = (this.$refs.drawingCanvas as any).getContext('2d');

            MainEventBus.$on('ot-applied', this.onOT);
            MainEventBus.$on('set-tool-handler', this.setToolHandler);
            MainEventBus.$on('select', this.onSelectRequest);
            MainEventBus.$on('auto-connect', this.onAutoConnect);
            MainEventBus.$on('add-entity', this.onAddEntity);
            MainEventBus.$on('delete-entity', this.onDeleteEntity);

            (this.$refs.drawingCanvas as any).onmousedown = this.onMouseDown;
            (this.$refs.drawingCanvas as any).onmousemove = this.onMouseMove;
            (this.$refs.drawingCanvas as any).onmouseup = this.onMouseUp;
            (this.$refs.drawingCanvas as any).onwheel = this.onWheel;

            this.allLayers.push(this.backgroundLayer, this.hydraulicsLayer, this.calculationLayer);
            this.processDocument();

            if (this.document.uiState.viewPort === null) {
                this.fitToView();
            }

            this.calculationEngine = new CalculationEngine();

            setInterval(this.drawLoop, 20);
        }

        get initialViewport() {
            return new ViewPort(TM.transform(TM.translate(0, 0), TM.scale(50)), 5000, 5000);
        }

        get documentBrandNew() {
            return this.$store.getters['document/isBrandNew'];
        }

        get document(): DocumentState {
            return this.$store.getters['document/document'];
        }

        get effectiveCatalog(): Catalog {
            return this.$store.getters['catalog/default'];
        }

        get availableFixtures(): string[] {
            return this.document.drawing.availableFixtures;
        }

        get availableValves(): ValveId[] {
            return [
                {type: ValveType.ISOLATION_VALVE, catalogId: 'gateValve', name: ''},
                {type: ValveType.ISOLATION_VALVE, catalogId: 'ballValve', name: ''},
                {type: ValveType.ISOLATION_VALVE, catalogId: 'butterflyValve', name: ''},
                {type: ValveType.CHECK_VALVE, catalogId: 'checkValve', name: ''},
                {type: ValveType.WATER_METER, catalogId: 'waterMeter', name: ''},
                {type: ValveType.STRAINER, catalogId: 'strainer', name: ''},
            ].map((a) => {
                a.name = this.effectiveCatalog.valves[a.catalogId].name;
                return a;
            });
        }

        get activeLayer(): Layer | null {
            if (this.mode === DrawingMode.FloorPlan) {
                return this.backgroundLayer;
            } else if (this.mode === DrawingMode.Hydraulics) {
                return this.hydraulicsLayer;
            } else if (this.mode === DrawingMode.Calculations) {
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

        get currentTool(): ToolConfig {
            if (this.toolHandler) {
                return this.toolHandler.config;
            } else {
                return DEFAULT_TOOL;
            }
        }

        get mode() {
            return this.document.uiState.drawingMode;
        }
        set mode(value) {
            this.document.uiState.drawingMode = value;
            this.processDocument();
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

        onOT(redraw: boolean = true) {
            this.processDocument(redraw);
        }

        setToolHandler(toolHandler: ToolHandler) {
            if (toolHandler !== null && this.toolHandler !== null) {
                this.toolHandler.finish(true, true);
            }
            this.interactive = null;
            this.toolHandler = toolHandler;
            this.scheduleDraw();
        }

        get selectedEntities() {
            if (this.activeLayer) {
                return this.activeLayer.selectedEntities;
            }
        }

        get selectedObjects() {
            if (this.activeLayer) {
                return this.activeLayer.selectedObjects;
            }
            return null;
        }

        get isCalculating() {
            return this.document.uiState.isCalculating;
        }

        onLayerSelect() {
            this.targetProperty = null;
            this.scheduleDraw();
        }

        onAddEntity(entity: DrawableEntityConcrete) {
            switch (entity.type) {
                case EntityType.BACKGROUND_IMAGE:
                    this.backgroundLayer.addEntity(entity);
                    break;
                case EntityType.RESULTS_MESSAGE:
                    this.calculationLayer.addEntity(entity);
                    break;
                case EntityType.FITTING:
                case EntityType.DIRECTED_VALVE:
                case EntityType.PIPE:
                case EntityType.FLOW_SOURCE:
                case EntityType.SYSTEM_NODE:
                case EntityType.TMV:
                case EntityType.FIXTURE:
                    this.hydraulicsLayer.addEntity(entity);
                    break;
                default:
                    assertUnreachable(entity);
            }
        }

        onDeleteEntity(entity: DrawableEntityConcrete) {
            switch (entity.type) {
                case EntityType.BACKGROUND_IMAGE:
                    this.backgroundLayer.deleteEntity(entity);
                    break;
                case EntityType.RESULTS_MESSAGE:
                    this.calculationLayer.deleteEntity(entity);
                    break;
                case EntityType.FITTING:
                case EntityType.DIRECTED_VALVE:
                case EntityType.PIPE:
                case EntityType.FLOW_SOURCE:
                case EntityType.SYSTEM_NODE:
                case EntityType.TMV:
                case EntityType.FIXTURE:
                    this.hydraulicsLayer.deleteEntity(entity);
                    break;
                default:
                    assertUnreachable(entity);
            }
        }

        disableContextMenu(e: Event) {
            return e.preventDefault();
        }

        onAutoConnect() {
            if (this.selectedObjects) {
                const ac = new AutoConnector(this.selectedObjects, this);
                ac.autoConnect();
            }
        }

        deleteEntity(object: BaseBackedObject): Set<string> {
            const toDelete = object.prepareDelete(this);
            const deleted = new Set<string>();
            toDelete.forEach((drawableObject) => {
                if (deleted.has(drawableObject.uid)) {
                    return;
                }
                this.$store.dispatch('document/deleteEntity', drawableObject.entity);
                deleted.add(drawableObject.uid);
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
                    throw new Error('Selecting an object that doesn\'t exist');
                }

                const background = this.document.drawing.backgrounds.find((b) => b.uid === selectionTarget.uid);
                const drawable = this.document.drawing.entities.find((e) => e.uid === selectionTarget.uid);
                if (background) {
                    this.mode = DrawingMode.FloorPlan;
                } else if (drawable) {
                    this.mode = DrawingMode.Hydraulics;
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
                    title: selectionTarget.title!,
                });
            }

            this.scheduleDraw();
        }

        deleteSelected() {
            const deleted = new Set<string>();
            if (this.selectedObjects) {
                this.selectedObjects.forEach((o) => {
                    if (!deleted.has(o.uid)) {
                        this.deleteEntity(o).forEach((uid) => {
                            deleted.add(uid);
                        });
                    }
                });
                this.$store.dispatch('document/commit');
            } else {
                throw new Error('Delete selected was called but we didn\'t select anything');
            }
        }

        changeTool(tool: ToolConfig) {
            if (tool.name === DEFAULT_TOOL.name) {
                this.$emit('set-tool-handler', null);
            }
        }

        processDocument(redraw: boolean = true) {
            this.updating = true;
            this.considerCalculating();
            this.allLayers.forEach((l) => l.update(this.document));
            this.updating = false;
            // finally, draw
            if (redraw) {
                this.scheduleDraw();
            }
        }

        scheduleDraw() {
            if (Date.now() - this.lastDraw < 25) {
                this.shouldDraw = true;
            } else if (this.updating) {
                this.shouldDraw = true;
            } else if (this.shouldDraw) {
                this.shouldDraw = true;
            } else if (this.drawingLocked > 0) {
                this.shouldDraw = true;
            } else { // throttle rendering.
                this.draw();
            }
        }

        lockDrawing() {
            this.drawingLocked ++;
        }

        unlockDrawing() {
            this.drawingLocked --;
            if (this.drawingLocked === 0) {
                this.scheduleDraw();
            }
        }

        drawLoop() {
            if (this.shouldDraw) {
                this.shouldDraw = false;
                try {
                    this.draw();
                } catch {
                    //
                }
            }
        }

        insertFlowReturn(system: FlowSystemParameters) {
            window.alert('No can do returns just yet');
        }

        offerInteraction(
            interaction: Interaction,
            filter?: (objects: DrawableEntityConcrete[]) => boolean,
            sortBy?: (objects: DrawableEntityConcrete[]) => any,
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
            if (this.document.drawing.entities.length === 0 && this.document.drawing.backgrounds.length === 0) {
                this.viewPort = this.initialViewport;
                this.scheduleDraw();
            } else {

                const {l, r, t, b} = getBoundingBox(this.objectStore, this.document);

                const w = this.viewPort.width;
                const h = this.viewPort.height;
                const s = Math.max((r - l + 1) / w, (b - t + 1) / h, 1) * 1.5;
                this.viewPort =
                    new ViewPort(
                        TM.transform(TM.translate((l + r) / 2, (t + b) / 2), TM.scale(s)),
                        w,
                        h,
                    );
                this.scheduleDraw();
            }
        }

        hydraulicsInsert(
            {entityName, system, catalogId, tmvHasCold, valveType}:
                {entityName: string, system: FlowSystemParameters, catalogId: string,
                    tmvHasCold: boolean, valveType: ValveType},
        ) {
            this.hydraulicsLayer.select([], SelectMode.Replace);

            if (entityName === EntityType.FLOW_SOURCE) {
                insertFlowSource(this, system);
            } else if (entityName === EntityType.FLOW_RETURN) {
                this.insertFlowReturn(system);
            } else if (entityName === EntityType.PIPE) {
                insertPipes(this, system);
            } else if (entityName === EntityType.FITTING) {
                insertValve(this, system);
            } else if (entityName === EntityType.TMV) {
                insertTmv(this, tmvHasCold, 0);
            } else if (entityName === EntityType.FIXTURE) {
                this.document.uiState.lastUsedFixtureUid = catalogId;
                insertFixture(this, catalogId, 0);
            } else if (entityName === EntityType.DIRECTED_VALVE) {
                this.document.uiState.lastUsedValveVid = {
                    catalogId,
                    name: this.effectiveCatalog.valves[catalogId].name,
                    type: valveType,
                };
                insertDirectedValve(this, valveType, catalogId, system);
            }
        }

        // For this to work, there is to be no local state at all. All state is to be stored in the vue store,
        // which is serialised by snapshots and operation transforms.
        draw() {
            this.lastDraw = Date.now();
            if (this.ctx != null && (this.$refs.canvasFrame as any) != null) {
                const ctx: CanvasRenderingContext2D = this.ctx;

                const width = (this.$refs.canvasFrame as any).clientWidth - 1;
                const height = (this.$refs.canvasFrame as any).clientHeight;
                ctx.canvas.width = width;
                ctx.canvas.height = height;

                this.viewPort.width = width;
                this.viewPort.height = height;

                const context: DrawingContext = {ctx, vp: this.viewPort, doc: this.document};
                this.lastDrawingContext = context;
                this.backgroundLayer.draw(context, this.mode === DrawingMode.FloorPlan, this.currentTool);
                this.hydraulicsLayer.draw(context, this.mode === DrawingMode.Hydraulics, this.mode);
                this.calculationLayer.draw(context, this.mode === DrawingMode.Calculations);

                // Draw hydraulics layer

                // Draw selection layers
                if (this.activeLayer) {
                    this.activeLayer.drawSelectionLayer(context, this.interactive);
                }


                // draw selection box
                if (this.selectBox) {
                    this.selectBox.draw(context);
                }

                ctx.setTransform(TM.identity());
                drawPaperScale(ctx, 1 / matrixScale(this.viewPort.position));

                if (this.toolHandler) {
                    ctx.setTransform(TM.identity());
                    this.toolHandler.draw(context);
                }
            }
        }

        considerCalculating() {
            if (this.mode === DrawingMode.Calculations) {
                if (this.document.uiState.lastCalculationId < this.document.nextId
                    || this.document.uiState.lastCalculationUiSettings.demandType !== this.demandType) {

                    this.calculationLayer.calculate(
                        this,
                        this.demandType,
                        () => {
                            this.scheduleDraw();
                        },
                    );
                }
            }
        }

        onDrop(value: any, event: DragEvent) {
            if (event.dataTransfer) {
                event.preventDefault();
                for (let i = 0; i < event.dataTransfer.files.length; i++) {
                    if (!(event.dataTransfer.files.item(i) as File).name.endsWith('pdf')) {
                        continue;
                    }

                    const w = this.viewPort.toWorldCoord({x: event.offsetX, y: event.offsetY});

                    this.insertFloorPlan(event.dataTransfer.files.item(i) as File, w);
                }
            }
        }

        onFloorPlanSelected(file: File) {
            const m = decomposeMatrix(this.viewPort.position);
            this.insertFloorPlan(file, {x: m.tx + this.viewPort.width / 2, y: m.ty + this.viewPort.height / 2});
        }

        insertFloorPlan(file: File, wc: Coord) {
            renderPdf(
                file,
                ({paperSize, scale, scaleName, uri, totalPages},
                ) => {

                    const width = paperSize.widthMM / scale;
                    const height = paperSize.heightMM / scale;
                    // We create the operation here, not the server.
                    const background: BackgroundEntity = {
                        parentUid: null,
                        type: EntityType.BACKGROUND_IMAGE,
                        filename: file.name,
                        center: wc,
                        crop: {x: -width / 2, y: -height / 2, w: width, h: height},
                        offset: {x: 0, y: 0},
                        page: 1,
                        paperSize,
                        pointA: null,
                        pointB: null,
                        rotation: 0,
                        scaleFactor: 1,
                        scaleName,
                        uid: uuid(),
                        totalPages,
                        uri,
                    };

                    this.$store.dispatch('document/addBackground', {background});
                    this.$store.dispatch('document/commit');
                });
        }

        onMouseDown(event: MouseEvent): boolean {
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
                    this.viewPort.toWorldCoord({x: event.offsetX, y: event.offsetY}),
                    this.viewPort.toWorldCoord({x: event.offsetX, y: event.offsetY}),
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
            this.grabbedPoint = this.viewPort.toWorldCoord({x: event.offsetX, y: event.offsetY});
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
            return res.handled;
        }

        onMouseMoveInternal(event: MouseEvent): MouseMoveResult {
            if (this.selectBox) {
                this.selectBox.pointB = this.viewPort.toWorldCoord({x: event.offsetX, y: event.offsetY});

                event.preventDefault();

                if (this.mode === DrawingMode.Hydraulics) {
                    this.hydraulicsLayer.select(_.clone(this.selectBoxStartSelected), SelectMode.Replace);

                    this.hydraulicsLayer.select(
                        this.hydraulicsLayer.uidsInOrder.filter((uid) => {
                            return this.selectBox!.inSelection(
                                [this.objectStore.get(uid)!],
                            ).length > 0;
                        }),
                        this.selectBoxMode!,
                    );
                }

                this.scheduleDraw();
                // todo: select
                return {cursor: null, handled: true};
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
                    return {handled: true, cursor: 'Move'};
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
        width:100%;
        height: -webkit-calc(100vh - 65px);
    }
</style>
