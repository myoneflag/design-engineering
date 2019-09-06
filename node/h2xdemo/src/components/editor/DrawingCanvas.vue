
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
            />

            <PropertiesWindow
                    :selectedObject="selectedObject"
                    :selected-drawable="selectedDrawable"
                    v-if="selectedObject && currentTool.propertiesVisible"
                    :object-type="selectedObjectType"
            >

            </PropertiesWindow>

            <Toolbar :current-tool-config="currentTool" :on-tool-click="changeTool"></Toolbar>
        </drop>
        <resize-observer @notify="draw"/>

    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import {OperationTransform} from "@/store/document/operation-transforms/operation-transforms";
    import {ViewPort} from "@/htmlcanvas/viewport";
    import {Background, Coord, DocumentState} from "@/store/document/types";
    import {drawPaperScale} from "@/htmlcanvas/scale";
    import ModeButtons from "@/components/editor/ModeButtons.vue";
    import PropertiesWindow from "@/components/editor/PropertiesWindow.vue";
    import {DrawingMode, MouseMoveResult, UNHANDLED} from "@/htmlcanvas/types";
    import BackgroundLayer from "@/htmlcanvas/layers/background-layer";
    import * as TM from "transformation-matrix";
    import {decomposeMatrix} from "@/htmlcanvas/utils";
    import Toolbar from "@/components/editor/Toolbar.vue";
    import Overlay from "@/components/editor/Overlay.vue";
    import {MainEventBus} from "@/store/main-event-bus";
    import {ToolConfig} from "@/store/tools/types";
    import {ToolHandler} from "@/htmlcanvas/tools/tool";
    import DrawableObject from "@/htmlcanvas/lib/drawable-object";
    import uuid from "uuid";
    import {renderPdf} from "@/api/pdf";
    import HydraulicsLayer from "@/htmlcanvas/layers/hydraulics-layer";
    import Layer from "@/htmlcanvas/layers/layer";
    import doc = Mocha.reporters.doc;
    import HydraulicsInsertPanel from '@/components/editor/HydraulicsInsertPanel.vue';

    @Component({
        components: {HydraulicsInsertPanel, Overlay, Toolbar, PropertiesWindow, ModeButtons},
        props: {
            document: Object,
        }
    })
    export default class DrawingCanvas extends Vue {

        ctx: CanvasRenderingContext2D | null = null;
        mounted() {
            console.log("DrawingCanvas Mounted");
            this.ctx = (this.$refs["drawingCanvas"] as any).getContext("2d");

            MainEventBus.$on('ot-applied', this.onOT);
            MainEventBus.$on('tool-change', this.onToolChange);
            MainEventBus.$on('set-tool-handler', this.setToolHandler);

            (this.$refs["drawingCanvas"] as any).onmousedown = this.onMouseDown;
            (this.$refs["drawingCanvas"] as any).onmousemove = this.onMouseMove;
            (this.$refs["drawingCanvas"] as any).onmouseup = this.onMouseUp;
            (this.$refs["drawingCanvas"] as any).onwheel = this.onWheel;

            this.backgroundLayer = new BackgroundLayer(
                () => {
                    //this.backgroundLayer.update(this.$props.document);
                    this.scheduleDraw();
                },
                (object, drawable) => {
                    this.selectedObjectBackground = object;
                    this.selectedDrawable = drawable;
                    this.scheduleDraw();
                },
                (object) => { // onCommit
                    this.commitBackgroundChange(object);
                    console.log("committing");
                    this.$store.dispatch('document/commit');
                }
            );
            this.drawingLayer = new HydraulicsLayer();

            this.allLayers.push(this.backgroundLayer, this.drawingLayer);
            this.processDocument();

            setInterval(this.drawLoop, 20);
        }

        viewPort: ViewPort = new ViewPort(TM.transform(TM.translate(0, 0), TM.scale(100)), 10000, 10000);
        selected: number | null = null;
        internal_mode: DrawingMode = DrawingMode.FloorPlan;

        // The layers
        backgroundLayer!: BackgroundLayer;
        drawingLayer!: HydraulicsLayer;
        allLayers: Layer[] = [];

        get activeLayer(): Layer | null {
            if (this.mode === DrawingMode.FloorPlan) {
                return this.backgroundLayer;
            } else if (this.mode === DrawingMode.Hydraulics) {
                return this.drawingLayer;
            }
            return null;
        }

        toolHandler: ToolHandler | null = null;

        currentCursor: string = "auto";

        get currentTool(): ToolConfig {
            return this.$store.getters["tools/getCurrentTool"];
        }

        get mode() {
            return this.internal_mode;
        }
        set mode(value) {
            this.internal_mode = value;
            this.selected = null;
            this.processDocument();
        }

        onOT(operation: OperationTransform) {
            this.processDocument();
        }

        onToolChange(tool: ToolConfig) {
            console.log("Tool change: " + tool + " " + this);
            //(this.$refs["drawingCanvas"] as any).cursor = tool.defaultCursor;
            this.scheduleDraw();
        }

        setToolHandler(toolHandler: ToolHandler) {
            this.toolHandler = toolHandler;
            this.scheduleDraw();
        }

        selectedObjectBackground: Background | null = null;
        get selectedObject() {
            if (this.mode == DrawingMode.FloorPlan) {
                return this.selectedObjectBackground;
            }
            return null;
        }
        selectedDrawable: DrawableObject | null = null;

        get selectedObjectType() {
            if (this.mode == DrawingMode.FloorPlan) {
                return "floor-plan";
            }
            return "";
        }

        changeTool(tool: ToolConfig) {
            console.log("dispatching current tool: " + tool.name);
            this.$store.dispatch("tools/setCurrentTool", tool);
        }

        commitBackgroundChange(object: Background) {
            // Scan existing backgrounds for that id.
            const doc: DocumentState = this.$props.document;
            const backgrounds = doc.drawing.backgrounds;
            for (let i = 0; i < backgrounds.length; i++) {
                if (backgrounds[i].uid === object.uid) {
                    // Send OT
                    let newBg: Background = Object.assign({}, backgrounds[i]);
                    newBg.center = object.center;
                    newBg.crop = object.crop;

                    this.$store.dispatch('document/updateBackground', {
                        index: i,
                        background: newBg,
                    });
                }
            }
        }

        processDocument() {
            const document: DocumentState = this.$props.document;
            console.log("Document updated, processing. Drawing is: " + JSON.stringify(document.drawing));

            for (let background of document.drawing.backgrounds) {
                console.log(background.uri);
            }
            this.allLayers.forEach((l) => l.update(document));
            // finally, draw
            this.scheduleDraw();
        }

        shouldDraw: boolean = true;
        lastDraw: number = 0;

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
                    console.log("Caught error in drawing loop");
                }
            }
        }

        // For this to work, there is to be no local state at all. All state is to be stored in the vue store,
        // which is serialised by snapshots and operation transforms.
        draw() {
            this.lastDraw = Date.now();
            const state: DocumentState = this.$store.state.document;
            if (this.ctx != null && (this.$refs["canvasFrame"] as any) != null) {
                let ctx: CanvasRenderingContext2D = this.ctx;

                let width = (this.$refs["canvasFrame"] as any).clientWidth - 1;
                let height = (this.$refs["canvasFrame"] as any).clientHeight;
                ctx.canvas.width = width;
                ctx.canvas.height = height;

                this.viewPort.width = width;
                this.viewPort.height = height;

                this.backgroundLayer.draw(ctx, this.viewPort, this.mode == DrawingMode.FloorPlan, this.currentTool);
                this.drawingLayer.draw(ctx, this.viewPort, this.mode == DrawingMode.Hydraulics);

                // Draw hydraulics layer =>

                // Draw selection layers
                if (this.activeLayer) {
                    this.activeLayer.drawSelectionLayer(ctx, this.viewPort);
                }

                drawPaperScale(ctx, 1 / decomposeMatrix(this.viewPort.position).sx);
            }
            console.log("Draw took " + (Date.now() - this.lastDraw));
        }

        onDrop(value: any, event: DragEvent) {
            if (event.dataTransfer) {
                event.preventDefault();
                for (let i = 0; i < event.dataTransfer.files.length; i++) {
                    if (!(event.dataTransfer.files.item(i) as File).name.endsWith("pdf")) {
                        continue;
                    }
                    console.log("File " + i + ": " + event.dataTransfer.files.item(i));


                    let w = this.viewPort.toWorldCoord({x: event.offsetX, y: event.offsetY});

                    renderPdf(event.dataTransfer.files.item(i) as File, ({paperSize, scale, scaleName, uri, totalPages}) => {
                        console.log("Loaded PDF successfully: " + paperSize + " " + scale + " " + uri);

                        const width = paperSize.widthMM / scale;
                        const height = paperSize.heightMM / scale;
                        // We create the operation here, not the other way around.
                        let background: Background = {
                            center: w,
                            crop: {x: -width/2, y: -height/2, w: width, h: height},
                            offset: {x: 0, y: 0},
                            page: 1,
                            paperSize: paperSize,
                            pointA: null,
                            pointB: null,
                            rotation: 0,
                            scaleFactor: 1,
                            scaleName: scaleName,
                            uid: uuid(),
                            totalPages: totalPages,
                            uri: uri,
                        };

                        this.$store.dispatch("document/addBackground", {background});
                        this.$store.dispatch("document/commit");
                    });
                }
            } else {
                console.log("No files dropped");
            }
        }

        grabbedPoint: Coord | null = null;
        hasDragged: boolean = false;

        onMouseDown(event: MouseEvent): boolean {
            if (this.toolHandler) {
                if (this.toolHandler.onMouseDown(event, this.viewPort)) {
                    return true;
                }
            } else {

                // Pass the event down to layers below
                if (this.activeLayer) {

                    if (this.activeLayer.onMouseDown(event, this.viewPort)) return true;
                }
            }

            // If no objects or tools wanted the events, we can always drag and shit.
            this.grabbedPoint = this.viewPort.toWorldCoord({x: event.offsetX, y: event.offsetY});
            this.hasDragged = false;
            return true;
        }

        onMouseMove(event: MouseEvent): boolean {
            if (event.movementX === 0 && event.movementY === 0) {
                console.log("Warning: Phantom mousemove event");
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
                    if (res.handled) return res;
                }
            }

            if (event.buttons && 1) {
                if (this.grabbedPoint != null) {
                    let s = this.viewPort.toScreenCoord(this.grabbedPoint);
                    if (!this.hasDragged) {
                        console.log("...Dragging for the first time");
                        console.log("Moved: " + event.movementX + " " + event.movementY);
                    }
                    this.hasDragged = true;
                    let {sx, sy} = decomposeMatrix(this.viewPort.position);
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
            console.log("onMouseUp");

            if (this.grabbedPoint) {
                this.grabbedPoint = null;
                const wasDragged = this.hasDragged;
                this.hasDragged = false;
                if (wasDragged) {
                    console.log("...Was dragged");
                    return true;
                }
            }

            if (this.toolHandler) {
                if (this.toolHandler.onMouseUp(event, this.viewPort)) {
                    console.log("...Handled by tool");
                    return true;
                }
            } else {
                // Pass the event down to layers below
                if (this.activeLayer) {
                    if (this.activeLayer.onMouseUp(event, this.viewPort)) {
                        console.log("...Handled by active layer");
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
    }

    .fullFrame {
        width:100%;
        height: -webkit-calc(100vh - 65px);
    }
</style>
