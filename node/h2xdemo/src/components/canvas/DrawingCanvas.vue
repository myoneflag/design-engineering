<template>
    <div ref="canvasFrame" style="width:100%; height: -webkit-calc(100vh - 65px);">
        <drop
            @drop="onDrop"
        >
            <canvas ref="drawingCanvas" style="background-color: aliceblue;"
            >

            </canvas>
        </drop>
        <resize-observer @notify="draw"/>

        <ModeButtons :mode.sync="mode"/>

        <PropertiesWindow>

        </PropertiesWindow>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue';
    import Component from "vue-class-component";
    import * as OT from '@/store/document/operationTransforms';
    import {ViewPort} from "@/Drawings/2DViewport";
    import {createViewportForPaper, parseScale} from "@/Drawings/Utils";
    import {Background, DocumentState} from "@/store/document/types";
    import {DEFAULT_PAPER_SIZE, PAPER_SIZES, PaperSize} from "@/config";
    import {fillRect, rect} from "@/Drawings/ViewportDrawing";
    import {BackgroundImage} from "@/Drawings/BackgroundImage";
    import {drawPaperScale} from "@/Drawings/Scale";
    import ModeButtons from '@/components/canvas/ModeButtons.vue';
    import {Watch} from 'vue-property-decorator'
    import PropertiesWindow from '@/components/canvas/PropertiesWindow.vue';
    import {DrawingMode} from '@/components/canvas/types';
    import axios from 'axios';
    import doc = Mocha.reporters.doc;
    import {OperationTransform} from "@/store/document/operationTransforms";
    import BackgroundLayer from "@/components/canvas/backgroundLayer";

    @Component({
        components: {PropertiesWindow, ModeButtons},
        props: {
            document: Object,
        }
    })
    export default class DrawingCanvas extends Vue {

        ctx: CanvasRenderingContext2D | null = null;
        mounted() {
            console.log("DrawingCanvas Mounted");
            this.ctx = (this.$refs["drawingCanvas"] as any).getContext("2d");

            OT.OTEventBus.$on('ot-applied', this.onOT);

            (this.$refs["drawingCanvas"] as any).onmousedown = this.onMouseDown;
            (this.$refs["drawingCanvas"] as any).onmousemove = this.onMouseMove;
            (this.$refs["drawingCanvas"] as any).onmouseup = this.onMouseUp;
            (this.$refs["drawingCanvas"] as any).onwheel = this.onWheel;
            this.backgroundLayer = new BackgroundLayer(() => {
                this.backgroundLayer.update(this.$props.document);
                this.draw();
            });
            this.processDocument();
        }

        viewPort: ViewPort = new ViewPort(0, 0, 100, 100, 1);
        selected: number | null = null;
        internal_mode: DrawingMode = DrawingMode.FloorPlan;

        // These are ones that are still being sent to the server
        loadingPdfs: {x: number, y: number}[] = [];

        // The layers
        backgroundLayer!: BackgroundLayer;

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

        processDocument() {
            const document: DocumentState = this.$props.document;
            console.log("Document updated, processing. Document is: " + JSON.stringify(document));

            for (let background of document.drawing.backgrounds) {
                console.log(background.uri);
            }
            this.backgroundLayer.update(document);

            // hook all the UI

            // do any indexes

            // finally, draw
            this.draw();
        }


        // For this to work, there is to be no local state at all. All state is to be stored in the vue store,
        // which is serialised by snapshots and operation transforms.
        draw() {
            const state: DocumentState = this.$store.state.document;
            if (this.ctx != null && (this.$refs["canvasFrame"] as any) != null) {
                console.log("Rendering. Viewport: " + JSON.stringify(this.viewPort));
                let ctx: CanvasRenderingContext2D = this.ctx;

                let width = (this.$refs["canvasFrame"] as any).clientWidth-1;
                let height = (this.$refs["canvasFrame"] as any).clientHeight;
                ctx.canvas.width = width;
                ctx.canvas.height = height;

                this.viewPort.width = width;
                this.viewPort.height = height;

                this.backgroundLayer.draw(ctx, this.viewPort);

                drawPaperScale(ctx, this.viewPort.scale);
            }
        }

        onDrop(value: any, event: DragEvent) {
            if (event.dataTransfer) {
                event.preventDefault();
                for (let i = 0; i < event.dataTransfer.files.length; i++) {
                    if (!(event.dataTransfer.files.item(i) as File).name.endsWith("pdf")) {
                        continue;
                    }
                    console.log("File " + i + ": " + event.dataTransfer.files.item(i));

                    let formData = new FormData();
                    let [wx, wy] = this.viewPort.toWorldCoord(event.offsetX, event.offsetY);
                    formData.append("pdf", event.dataTransfer.files.item(i) as File);
                    formData.append("x", String(wx));
                    formData.append("y", String(wy));

                    const loading = {'x': wx, 'y': wy};

                    this.loadingPdfs.push(loading);
                    console.log("Loading pdfs: " + this.loadingPdfs);

                    let promise = axios.post('api/uploadPdf', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                    promise.catch(reason => {
                        console.log(JSON.stringify(reason));
                        console.log("Loaded PDF failed: " + JSON.stringify(loading));
                        this.loadingPdfs.splice(this.loadingPdfs.indexOf(loading), 1);
                        console.log("Loading pdfs: " + this.loadingPdfs);
                    });
                    promise.then((value) => {
                        console.log("Loaded PDF successfully: " + JSON.stringify(loading));
                        this.loadingPdfs.splice(this.loadingPdfs.indexOf(loading), 1);
                        console.log("Loading pdfs: " + this.loadingPdfs);
                    });
                }
            } else {
                console.log("No files dropped");
            }
        }

        grabbedPoint: [number, number] | null = null;
        onMouseDown(event: MouseEvent, vp: ViewPort): boolean {
            this.grabbedPoint = this.viewPort.toWorldCoord(event.offsetX, event.offsetY);
            return true;
        }

        onMouseMove(event: MouseEvent, vp: ViewPort): boolean {
            if (event.buttons && 1) {
                if (this.grabbedPoint != null) {
                    let [wx, wy] = this.viewPort.toWorldCoord(event.offsetX, event.offsetY);

                    this.viewPort.centerX += this.grabbedPoint[0] - wx;
                    this.viewPort.centerY += this.grabbedPoint[1] - wy;
                    this.draw();
                    return true;
                } else {
                    return false;
                }
            } else {
                this.grabbedPoint = null;
                return false;
            }
        }

        onMouseUp(event: MouseEvent, vp: ViewPort): boolean {
            this.grabbedPoint = null;
            return false;
        }

        onWheel(event: WheelEvent) {
            event.preventDefault();
            const [wx, wy] = this.viewPort.toWorldCoord(event.offsetX, event.offsetY);
            console.log("Wheel event " + wx + " " + wy);
            this.viewPort.rescale(this.viewPort.scale * (1 - event.deltaY / 500), wx, wy);
            this.draw();
        }
    }

</script>

<style lang="less">
    body {
        height: 100%;
    }
</style>
