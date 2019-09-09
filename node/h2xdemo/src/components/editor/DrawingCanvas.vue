<template>
    <div ref="canvasFrame" class="fullFrame">
        <drop
            @drop="onDrop"
        >
            <canvas ref="drawingCanvas" v-bind:style="{ backgroundColor: 'aliceblue', cursor: currentCursor}">

            </canvas>

            <ModeButtons
                    :mode.sync="mode"
                    v-if="currentTool.modesVisible"
            />

            <HydraulicsInsertPanel
                v-if="mode === 1"
                :flow-systems="document.drawing.flowSystems"
                @insert="hydraulicsInsert"
            />

            <PropertiesWindow
                    :selected-entity="selectedEntity"
                    :selected-object="selectedObject"
                    v-if="selectedObject && currentTool.propertiesVisible"
                    :object-type="selectedObjectType"
                    :on-change="scheduleDraw"
            >

            </PropertiesWindow>

            <Toolbar :current-tool-config="currentTool" :on-tool-click="changeTool"></Toolbar>
        </drop>
        <resize-observer @notify="draw"/>

    </div>
</template>

<script lang="ts">
    import Vue from 'vue';
    import Component from 'vue-class-component';
    import {OperationTransform} from '@/store/document/operation-transforms/operation-transforms';
    import {ViewPort} from '@/htmlcanvas/viewport';
    import {Background, Coord, DocumentState, FlowSystemParameters, WithID} from '@/store/document/types';
    import {drawPaperScale} from '@/htmlcanvas/scale';
    import ModeButtons from '@/components/editor/ModeButtons.vue';
    import PropertiesWindow from '@/components/editor/property-window/PropertiesWindow.vue';
    import {DrawingMode, MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';
    import BackgroundLayer from '@/htmlcanvas/layers/background-layer';
    import * as TM from 'transformation-matrix';
    import {decomposeMatrix} from '@/htmlcanvas/utils';
    import Toolbar from '@/components/editor/Toolbar.vue';
    import Overlay from '@/components/editor/Overlay.vue';
    import {MainEventBus} from '@/store/main-event-bus';
    import {ToolConfig} from '@/store/tools/types';
    import {DEFAULT_TOOL, POINT_TOOL, ToolHandler} from '@/htmlcanvas/tools/tool';
    import DrawableObject from '@/htmlcanvas/lib/drawable-object';
    import uuid from 'uuid';
    import {renderPdf} from '@/api/pdf';
    import HydraulicsLayer from '@/htmlcanvas/layers/hydraulics-layer';
    import Layer from '@/htmlcanvas/layers/layer';
    import HydraulicsInsertPanel from '@/components/editor/HydraulicsInsertPanel.vue';
    import PointTool from '@/htmlcanvas/tools/point-tool';
    import FlowSourceEntity from '@/store/document/entities/flow-source';
    import {ENTITY_NAMES} from '@/store/document/entities';
    import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
    import * as _ from 'lodash';

    @Component({
        components: {HydraulicsInsertPanel, Overlay, Toolbar, PropertiesWindow, ModeButtons},
    })
    export default class DrawingCanvas extends Vue {

        ctx: CanvasRenderingContext2D | null = null;

        grabbedPoint: Coord | null = null;
        hasDragged: boolean = false;

        viewPort: ViewPort = new ViewPort(TM.transform(TM.translate(0, 0), TM.scale(100)), 10000, 10000);
        selected: number | null = null;
        internalMode: DrawingMode = DrawingMode.FloorPlan;

        // The layers
        backgroundLayer!: BackgroundLayer;
        hydraulicsLayer!: HydraulicsLayer;
        allLayers: Layer[] = [];


        toolHandler: ToolHandler | null = null;
        currentCursor: string = 'auto';

        selectedObjectBackground: Background | null = null;
        selectedObject: DrawableObject | null = null;

        shouldDraw: boolean = true;
        lastDraw: number = 0;


        objectStore: Map<string, DrawableObject> = new Map<string, DrawableObject>();

        mounted() {
            this.ctx = (this.$refs.drawingCanvas as any).getContext('2d');

            MainEventBus.$on('ot-applied', this.onOT);
            MainEventBus.$on('tool-change', this.onToolChange);
            MainEventBus.$on('set-tool-handler', this.setToolHandler);

            (this.$refs.drawingCanvas as any).onmousedown = this.onMouseDown;
            (this.$refs.drawingCanvas as any).onmousemove = this.onMouseMove;
            (this.$refs.drawingCanvas as any).onmouseup = this.onMouseUp;
            (this.$refs.drawingCanvas as any).onwheel = this.onWheel;

            this.backgroundLayer = new BackgroundLayer(
                this.objectStore,
                () => {
                    this.scheduleDraw();
                },
                (object, drawable) => {
                    this.selectedObjectBackground = object;
                    this.selectedObject = drawable;
                    this.scheduleDraw();
                },
                () => { // onCommit
                    this.$store.dispatch('document/commit');
                },
            );
            this.hydraulicsLayer = new HydraulicsLayer(
                this.objectStore,
                () => {
                    this.scheduleDraw();
                },
                (selectedObject: BackedDrawableObject<WithID> | null) => {
                    this.selectedObject = selectedObject;
                    this.scheduleDraw();
                },
                () => {
                    this.$store.dispatch('document/commit');
                },
            );

            this.allLayers.push(this.backgroundLayer, this.hydraulicsLayer);
            this.processDocument();

            setInterval(this.drawLoop, 20);
        }

        get document() {
            return this.$store.getters['document/document'];
        }

        get activeLayer(): Layer | null {
            if (this.mode === DrawingMode.FloorPlan) {
                return this.backgroundLayer;
            } else if (this.mode === DrawingMode.Hydraulics) {
                return this.hydraulicsLayer;
            }
            return null;
        }


        get currentTool(): ToolConfig {
            return this.$store.getters['tools/getCurrentTool'];
        }

        get mode() {
            return this.internalMode;
        }
        set mode(value) {
            this.internalMode = value;
            this.selected = null;
            this.processDocument();
        }

        onOT(operation: OperationTransform) {
            this.processDocument();
        }

        onToolChange(tool: ToolConfig) {
            this.scheduleDraw();
        }

        setToolHandler(toolHandler: ToolHandler) {
            this.toolHandler = toolHandler;
            this.scheduleDraw();
        }

        get selectedEntity() {
            if (this.mode === DrawingMode.FloorPlan) {
                return this.selectedObjectBackground;
            } else if (this.mode === DrawingMode.Hydraulics) {
                if (this.selectedObject) {
                    return (this.selectedObject as BackedDrawableObject<WithID>).stateObject;
                } else {
                    return null;
                }
            }
            return null;
        }

        get selectedObjectType() {
            if (this.mode === DrawingMode.FloorPlan) {
                return 'floor-plan';
            } else if (this.mode === DrawingMode.Hydraulics) {
                return 'hydraulics';
            }
            return '';
        }

        changeTool(tool: ToolConfig) {
            this.$store.dispatch('tools/setCurrentTool', tool);
        }

        processDocument() {
            const document: DocumentState = this.$store.getters['document/document'];

            this.allLayers.forEach((l) => l.update(document));
            // finally, draw
            this.scheduleDraw();
        }


        scheduleDraw() {
            if (Date.now() - this.lastDraw > 25 && !this.shouldDraw) {
                this.draw();
            } else { // throttle rendering.
                this.shouldDraw = true;
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

        hydraulicsInsert({entityName, system}: {entityName: string, system: FlowSystemParameters}) {
            this.$store.dispatch('tools/setCurrentTool', POINT_TOOL);
            MainEventBus.$emit('set-tool-handler', new PointTool(
                () => {
                    this.$store.dispatch('tools/setCurrentTool', DEFAULT_TOOL);
                    MainEventBus.$emit('set-tool-handler', null);
                },
                (wc: Coord) => {
                    const doc = this.document as DocumentState;

                    // Maybe we drew onto a background
                    const floor = this.backgroundLayer.getBackgroundAt(wc, this.objectStore);
                    let parentUid: string | null = null;
                    let oc = _.cloneDeep(wc);
                    if (floor != null) {
                        parentUid = floor.background.uid;
                        oc = floor.toObjectCoord(wc);
                    }

                    const newEntity: FlowSourceEntity = {
                        center: oc,
                        color: null,
                        heightAboveFloorM: 0,
                        material: null,
                        maximumVelocityMS: null,
                        parentUid,
                        pressureKPA: 0,
                        radiusMM: 100,
                        spareCapacity: null,
                        systemUid: system.uid,
                        temperatureC: null,
                        type: ENTITY_NAMES.FLOW_SOURCE,
                        uid: uuid(),
                    };
                    doc.drawing.entities.push(newEntity);
                    this.$store.dispatch('document/commit');
                },
            ));
        }

        // For this to work, there is to be no local state at all. All state is to be stored in the vue store,
        // which is serialised by snapshots and operation transforms.
        draw() {
            this.lastDraw = Date.now();
            const state: DocumentState = this.$store.state.document;
            if (this.ctx != null && (this.$refs.canvasFrame as any) != null) {
                const ctx: CanvasRenderingContext2D = this.ctx;

                const width = (this.$refs.canvasFrame as any).clientWidth - 1;
                const height = (this.$refs.canvasFrame as any).clientHeight;
                ctx.canvas.width = width;
                ctx.canvas.height = height;

                this.viewPort.width = width;
                this.viewPort.height = height;

                this.backgroundLayer.draw(ctx, this.viewPort, this.mode === DrawingMode.FloorPlan, this.currentTool);
                this.hydraulicsLayer.draw(ctx, this.viewPort, this.mode === DrawingMode.Hydraulics);

                // Draw hydraulics layer

                // Draw selection layers
                if (this.activeLayer) {
                    this.activeLayer.drawSelectionLayer(ctx, this.viewPort);
                }

                drawPaperScale(ctx, 1 / decomposeMatrix(this.viewPort.position).sx);
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

                    renderPdf(
                        event.dataTransfer.files.item(i) as File,
                        ({paperSize, scale, scaleName, uri, totalPages},
                        ) => {

                        const width = paperSize.widthMM / scale;
                        const height = paperSize.heightMM / scale;
                        // We create the operation here, not the server.
                        const background: Background = {
                            center: w,
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
            }
        }

        onMouseDown(event: MouseEvent): boolean {
            if (this.toolHandler) {
                if (this.toolHandler.onMouseDown(event, this.viewPort)) {
                    return true;
                }
            } else {

                // Pass the event down to layers below
                if (this.activeLayer) {

                    if (this.activeLayer.onMouseDown(event, this.viewPort)) {
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
            if (this.toolHandler) {
                const res = this.toolHandler.onMouseMove(event, this.viewPort);
                if (res.handled) {
                    return res;
                }
            } else {
                // Pass the event down to layers below
                if (this.activeLayer) {
                    const res = this.activeLayer.onMouseMove(event, this.viewPort);
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

            if (this.grabbedPoint) {
                this.grabbedPoint = null;
                const wasDragged = this.hasDragged;
                this.hasDragged = false;
                if (wasDragged) {
                    return true;
                }
            }

            if (this.toolHandler) {
                if (this.toolHandler.onMouseUp(event, this.viewPort)) {
                    return true;
                }
            } else {
                // Pass the event down to layers below
                if (this.activeLayer) {
                    if (this.activeLayer.onMouseUp(event, this.viewPort)) {
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
