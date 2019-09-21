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
                    :mode="mode"
                    :on-change="scheduleDraw"
                    :on-delete="deleteSelected"
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
    import {ViewPort} from '@/htmlcanvas/viewport';
    import {
        Coord,
        DocumentState,
        DrawableEntity,
        FlowSystemParameters,
    } from '@/store/document/types';
    import {drawPaperScale} from '@/htmlcanvas/scale';
    import ModeButtons from '@/components/editor/ModeButtons.vue';
    import PropertiesWindow from '@/components/editor/property-window/PropertiesWindow.vue';
    import {DrawingMode, MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';
    import BackgroundLayer from '@/htmlcanvas/layers/background-layer';
    import * as TM from 'transformation-matrix';
    import {decomposeMatrix} from '@/htmlcanvas/utils';
    import Toolbar from '@/components/editor/Toolbar.vue';
    import LoadingScreen from '@/views/LoadingScreen.vue';
    import {MainEventBus} from '@/store/main-event-bus';
    import {ToolConfig} from '@/store/tools/types';
    import {DEFAULT_TOOL, ToolHandler} from '@/htmlcanvas/lib/tool';
    import uuid from 'uuid';
    import {renderPdf} from '@/api/pdf';
    import HydraulicsLayer from '@/htmlcanvas/layers/hydraulics-layer';
    import Layer from '@/htmlcanvas/layers/layer';
    import HydraulicsInsertPanel from '@/components/editor/HydraulicsInsertPanel.vue';
    import BackedDrawableObject, {BaseBackedObject} from '@/htmlcanvas/lib/backed-drawable-object';
    import {EntityType} from '@/store/document/entities/types';
    import {Interaction} from '@/htmlcanvas/lib/interaction';
    import insertFlowSource from '@/htmlcanvas/tools/insert-flow-source';
    import insertPipes from '@/htmlcanvas/tools/insert-pipes';
    import insertValve from '@/htmlcanvas/tools/insert-valve';
    import {DrawingContext, ObjectStore} from '@/htmlcanvas/lib/types';
    import {BackgroundEntity} from '@/store/document/entities/background-entity';
    import insertTmv from '@/htmlcanvas/tools/insert-tmv';
    import insertFixture from '@/htmlcanvas/tools/insert-fixture';

    @Component({
        components: {
            LoadingScreen,
            HydraulicsInsertPanel, Overlay: LoadingScreen, Toolbar, PropertiesWindow, ModeButtons},
    })
    export default class DrawingCanvas extends Vue {

        ctx: CanvasRenderingContext2D | null = null;

        grabbedPoint: Coord | null = null;
        hasDragged: boolean = false;

        viewPort: ViewPort = new ViewPort(TM.transform(TM.translate(0, 0), TM.scale(100)), 10000, 10000);
        internalMode: DrawingMode = DrawingMode.FloorPlan;

        // The layers
        backgroundLayer!: BackgroundLayer;
        hydraulicsLayer!: HydraulicsLayer;
        allLayers: Layer[] = [];


        toolHandler: ToolHandler | null = null;
        currentCursor: string = 'auto';

        shouldDraw: boolean = true;
        lastDraw: number = 0;


        // The currently hovered element ready for interaction.
        interactive: BaseBackedObject | null = null;

        objectStore: ObjectStore =
            new ObjectStore();

        updating: boolean = false;

        drawingLocked: number = 0;

        lastDrawingContext: DrawingContext | null = null;

        mounted() {
            this.ctx = (this.$refs.drawingCanvas as any).getContext('2d');

            MainEventBus.$on('ot-applied', this.onOT);
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
                (selectedObject: BaseBackedObject | null) => {
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

        get document(): DocumentState {
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
            if (this.toolHandler) {
                return this.toolHandler.config;
            } else {
                return DEFAULT_TOOL;
            }
        }

        get mode() {
            return this.internalMode;
        }
        set mode(value) {
            this.internalMode = value;
            this.processDocument();
        }

        onOT(redraw: boolean = true) {
            this.processDocument(redraw);
        }

        setToolHandler(toolHandler: ToolHandler) {
            this.interactive = null;
            this.toolHandler = toolHandler;
            this.scheduleDraw();
        }

        get selectedEntity() {
            if (this.mode === DrawingMode.FloorPlan) {
                if (this.backgroundLayer) {
                    return this.backgroundLayer.selectedEntity;
                } else {
                    return null;
                }
            } else if (this.mode === DrawingMode.Hydraulics) {
                if (this.hydraulicsLayer) {
                    return this.hydraulicsLayer.selectedEntity;
                } else {
                    return null;
                }
            }
            return null;
        }

        get selectedObject() {
            if (this.mode === DrawingMode.FloorPlan) {
                if (this.backgroundLayer) {
                    return this.backgroundLayer.selectedObject;
                } else {
                    return null;
                }
            } else if (this.mode === DrawingMode.Hydraulics) {
                if (this.hydraulicsLayer) {
                    return this.hydraulicsLayer.selectedObject;
                } else {
                    return null;
                }
            }
            return null;
        }

        deleteEntity(object: BaseBackedObject) {
            const toDelete = object.prepareDelete();
            toDelete.forEach((drawableObject) => {
                let index = this.document.drawing.entities.findIndex((b) => b.uid === drawableObject.uid);
                if (index !== -1) {
                    this.document.drawing.entities.splice(index, 1);
                }
                index = this.document.drawing.backgrounds.findIndex((b) => b.uid === drawableObject.uid);
                if (index !== -1) {
                    this.document.drawing.backgrounds.splice(index, 1);
                }
            });
        }

        deleteSelected() {
            if (this.selectedObject) {
                this.deleteEntity(this.selectedObject);
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
            console.log("lock " + this.drawingLocked);
        }

        unlockDrawing() {
            this.drawingLocked --;
            console.log("unlock " + this.drawingLocked);
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
            filter?: (object: BaseBackedObject) => boolean,
            sortBy?: (object: BaseBackedObject) => any,
        ): BaseBackedObject | null {
            for (let i = this.allLayers.length - 1; i >= 0; i--) {
                this.interactive = this.allLayers[i].offerInteraction(interaction, filter, sortBy);
                if (this.interactive) {
                    this.scheduleDraw();
                    return this.interactive;
                }
            }
            this.scheduleDraw();
            return this.interactive;
        }


        hydraulicsInsert({entityName, system, fixtureName}: {entityName: string, system: FlowSystemParameters, fixtureName: string}) {
            this.hydraulicsLayer.onSelected(null);

            if (entityName === EntityType.FLOW_SOURCE) {
                insertFlowSource(this, system);
            } else if (entityName === EntityType.FLOW_RETURN) {
                this.insertFlowReturn(system);
            } else if (entityName === EntityType.PIPE) {
                insertPipes(this, system);
            } else if (entityName === EntityType.VALVE) {
                insertValve(this, system);
            } else if (entityName === EntityType.TMV) {
                insertTmv(this);
            } else if (entityName === EntityType.FIXTURE) {
                insertFixture(this, fixtureName);
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
                this.hydraulicsLayer.draw(context, this.mode === DrawingMode.Hydraulics);

                // Draw hydraulics layer

                // Draw selection layers
                if (this.activeLayer) {
                    this.activeLayer.drawSelectionLayer(context, this.interactive);
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
                        const background: BackgroundEntity = {
                            parentUid: null,
                            type: EntityType.BACKGROUND_IMAGE,
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
