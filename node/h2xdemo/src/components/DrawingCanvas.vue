<template>
    <div ref="canvasFrame" style="width:100%; height: -webkit-calc(100vh - 65px);">
        <canvas ref="drawingCanvas" style="background-color: aliceblue;"
        >

        </canvas>
        <resize-observer @notify="draw"/>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue';
    import Component from "vue-class-component";
    import * as OT from '@/store/document/operationTransforms';
    import {ViewPort} from "@/Drawings/2DViewport";
    import {createViewportForPaper, parseScale} from "@/Drawings/Utils";
    import {DocumentState} from "@/store/document/types";
    import {DEFAULT_PAPER_SIZE, PAPER_SIZES, PaperSize} from "@/config";
    import {fillRect, rect} from "@/Drawings/ViewportDrawing";
    import {BackgroundImage} from "@/Drawings/BackgroundImage";
    import {drawPaperScale} from "@/Drawings/Scale";

    @Component({
        props: {

        }
    })
    export default class DrawingCanvas extends Vue {

        ctx: CanvasRenderingContext2D | null = null;
        mounted() {
            console.log("DrawingCanvas Mounted");
            this.ctx = (this.$refs["drawingCanvas"] as any).getContext("2d");
            this.draw();
            OT.OTEventBus.$on('ot-applied', this.otReceived);
            (this.$refs["drawingCanvas"] as any).onmousedown = this.onMouseDown;
            (this.$refs["drawingCanvas"] as any).onmousemove = this.onMouseMove;
            (this.$refs["drawingCanvas"] as any).onmouseup = this.onMouseUp;
            (this.$refs["drawingCanvas"] as any).onwheel = this.onWheel;
            this.centerFrame();
            this.stageBackground();
        }

        viewPort: ViewPort = new ViewPort(0, 0, 100, 100, 1);
        paperSize: PaperSize = DEFAULT_PAPER_SIZE;

        otReceived(ot: OT.OperationTransform) {
            if (ot.type == OT.OPERATION_NAMES.SET_BACKGROUND || ot.type == OT.OPERATION_NAMES.SET_PAPER) {
                this.centerFrame();
                this.stageBackground();
            }
        }

        centerFrame() {
            // We need to re-frame everything.
            for (let s of PAPER_SIZES) {
                if (s.name === this.$store.state.document.drawing.paper.name) {
                    this.paperSize = s;
                }
            }
            if (this.ctx) {
                const doc: DocumentState = this.$store.state;
                let pxPerMm;
                [this.viewPort, pxPerMm] = createViewportForPaper(this.ctx, this.paperSize.width, this.paperSize.height, 50);
            }

            this.draw();
        }

        background: BackgroundImage | null = null;
        crop = {x: 0, y: 0, w: 0, h: 0};
        stageBackground() {
            const state: DocumentState = this.$store.state.document;
            if (state.drawing.background.uri != "") {
                new BackgroundImage(state.drawing.background.uri, this.onBackgroundLoad);
            } else {
                this.background = null;
            }
        }

        onBackgroundLoad(caller: BackgroundImage) {
            const state: DocumentState = this.$store.state.document;
            this.background = caller;
            this.background.centerX = state.drawing.background.centerX;
            this.background.centerY = state.drawing.background.centerY;
            this.background.scale = state.drawing.background.scale;

            this.crop = state.drawing.background.crop;

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

                ctx.fillStyle = "#AAAAAA";
                fillRect(ctx, this.viewPort, 5, this.paperSize.height-5, this.paperSize.width, this.paperSize.height);
                ctx.fillStyle = "#ffffff";
                fillRect(ctx, this.viewPort, 0, this.paperSize.height, this.paperSize.width, this.paperSize.height);
                ctx.strokeStyle = "#CCCCCC";
                rect(ctx, this.viewPort, 0, this.paperSize.height, this.paperSize.width, this.paperSize.height);

                if (this.background) {
                    // Draw cropped pdf.
                    this.background.worldClipDraw(ctx, this.viewPort, 1.0, this.crop.x, this.crop.y, this.crop.w, this.crop.h);
                }

                drawPaperScale(ctx, this.viewPort.scale * parseScale(state.drawing.paper.scale));
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
