<template>
    <div ref="canvasFrame" style="width:100%">
        <canvas ref="previewCanvas" style="background-color: aliceblue;">

        </canvas>
        <resize-observer @notify="draw"/>
    </div>
</template>

<script lang="ts">
    import Vue from "vue";
    import Component from "vue-class-component";
    import {Watch} from "vue-property-decorator";
    import {PaperSize} from "@/config";
    import {drawPaperScale} from "@/Drawings/Scale";
    import {BackgroundImage} from "@/Drawings/BackgroundImage";
    import {ViewPort} from "@/Drawings/2DViewport";
    import * as Drawing from '@/Drawings/ViewportDrawing';
    import {ResizeControl} from "@/Drawings/ResizeControl";
    import {createViewportForPaper, parseScale} from "@/Drawings/Utils";

    @Component ({
        props: {
            paperSize: Object,
            backgroundUri: String,
            paperScale: String,
            pdfScale: String,
            pdfSize: Object,

            initialBackgroundCenterX: Number,
            initialBackgroundCenterY: Number,
            initialCrop: Object,

            onBackgroundUpdate: Function,
        }
    })
    export default class PreviewCanvas extends Vue {
        ctx: CanvasRenderingContext2D | null =  null;
        INNER_PADDING: number = 20;

        mounted() {
            console.log("This canvas is at " + this.$refs["previewCanvas"]);
            console.log("Paper size is " + this.$props.paperSize.width + " " + this.$props.paperSize.height);
            this.ctx = (this.$refs["previewCanvas"] as any).getContext("2d");

            (this.$refs["previewCanvas"] as any).onmousedown = this.onMouseDown;
            (this.$refs["previewCanvas"] as any).onmousemove = this.onMouseMove;
            (this.$refs["previewCanvas"] as any).onmouseup = this.onMouseUp;

            this.loadBackground();

            window.addEventListener('resize', this.draw);
        }

        scale: number = parseScale((this as any).paperScale);

        @Watch("paperSize")
        onPaperSizeChange(val: PaperSize, old: PaperSize) {
            // maintain crop size
            if (this.lastViewport != null && this.ctx != null) {
                let [thisViewport, pxPerMm] = createViewportForPaper(this.ctx, this.$props.paperSize.width, this.$props.paperSize.height);
                this.crop.w *= this.lastViewport.scale / thisViewport.scale;
                this.crop.h *= this.lastViewport.scale / thisViewport.scale;

                let [sx, sy] = this.lastViewport.toScreenCoord(this.crop.x, this.crop.y);
                [this.crop.x, this.crop.y] = thisViewport.toWorldCoord(sx, sy);
            }
            this.draw();
        }

        @Watch("paperScale")
        onScaleChange(val: string, old: string) {
            this.scale = parseScale(val);

            this.draw();
        }

        @Watch("pdfSize")
        onPdfSizeChange(val: PaperSize, old: PaperSize) {
            this.draw();
        }

        @Watch("pdfScale")
        onPdfScaleLChange(val: string, old: string) {
            this.draw();
        }

        @Watch("backgroundUri")
        onBackgroundUriChange(val: string, old: string) {
            if (val !== "" && val !== old) {
                this.loadBackground();
            }
        }

        loadBackground() {
            if (this.$props.backgroundUri && this.$props.backgroundUri != "") {
                this.backgroundImage = new BackgroundImage(this.$props.backgroundUri, this.handleImageLoad, (result: BackgroundImage) => {
                    this.draw()
                });
            }
        }

        emitChange() {
            if (this.$props.onBackgroundUpdate) {
                const payload: BackgroundState = {
                    centerX: this.backgroundImage ? this.backgroundImage.centerX : 0,
                    centerY: this.backgroundImage ? this.backgroundImage.centerY : 0,
                    crop: this.backgroundImage
                        ? {x: this.crop.x, y: this.crop.y, w: this.crop.w, h: this.crop.h}
                        : {x: 0, y: 0, w: 0, h: 0},
                    paper: this.$props.pdfSize ? this.$props.pdfSize.name : "",
                    scale: this.backgroundImage ? this.backgroundImage.scale : 1,
                    paperScale: this.$props.pdfScale,
                    uri: this.backgroundImage ? this.backgroundImage.uri : "",
                };
                this.$props.onBackgroundUpdate(payload);
            }
        }

        backgroundImage: BackgroundImage | null = null;

        handleImageLoad(target: BackgroundImage) {
            this.crop = new ResizeControl(50, 50, (this as any).paperSize.width-100, (this as any).paperSize.height-100, () => this.draw());
            console.log("Initial crop: " + JSON.stringify(this.$props.initialCrop));
            if (this.$props.initialCrop) {
                this.crop.x = this.$props.initialCrop.x;
                this.crop.y = this.$props.initialCrop.y;
                this.crop.w = this.$props.initialCrop.w;
                this.crop.h = this.$props.initialCrop.h;
            }

            this.draw(); // this is just to get the background scales right.

            if (this.$props.initialBackgroundCenterX != undefined && this.$props.initialBackgroundCenterY != undefined) {
                target.centerX = this.$props.initialBackgroundCenterX;
                target.centerY = this.$props.initialBackgroundCenterY;
            } else {
                target.centerX = this.$props.paperSize.width / 2;
                target.centerY = this.$props.paperSize.height / 2;
            }

            this.draw();
        }

        onMouseDown(event: MouseEvent) {
            let handled = false;
            if (this.lastViewport != null) {
                if (this.crop.onMouseDown(event, this.lastViewport)) {
                    handled = true;
                }
            }

            if (!handled && this.lastViewport != null && this.backgroundImage != null) {
                if (this.backgroundImage.onMouseDown(event, this.lastViewport)) {
                    handled = true;
                }
            }
        }

        onMouseMove(event: MouseEvent) {
            let handled = false;
            if (this.lastViewport) {
                if (this.crop.onMouseMove(event, this.lastViewport)) {
                    handled = true;
                }
            }

            if (!handled && this.lastViewport != null && this.backgroundImage != null) {
                if (this.backgroundImage.onMouseMove(event, this.lastViewport)) {
                    handled = true;
                }
            }
        }

        onMouseUp(event: MouseEvent) {
            let handled = false;
            if (this.crop.onMouseUp(event)) {
                handled = true;
            }

            if (!handled && this.lastViewport != null && this.backgroundImage != null) {
                if (this.backgroundImage.onMouseUp(event, this.lastViewport)) {
                    handled = true;
                }
            }
        }

        crop = new ResizeControl(50, 50, (this as any).paperSize.width-100, (this as any).paperSize.height-100, () => this.draw());
        lastViewport: ViewPort | null = null;
        draw() {
            this.emitChange(); // We draw roughly every time we change, so nothing can go too wrong by putting it here.

            if (this.ctx != null && (this.$refs["canvasFrame"] as any) != null) {
                let ctx: CanvasRenderingContext2D = this.ctx;

                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                // auto scale the current paper size to fit.
                let width = (this.$refs["canvasFrame"] as any).clientWidth;
                let height = width * 0.5;
                ctx.canvas.width = width;
                ctx.canvas.height = height;

                // scale defined as pxPerMm
                let [viewPort, pxPerMm] = createViewportForPaper(ctx, this.$props.paperSize.width, this.$props.paperSize.height);
                this.lastViewport = viewPort;

                ctx.fillStyle = "black";
                ctx.globalAlpha = 0.5;
                Drawing.fillRect(ctx, viewPort, 7, this.$props.paperSize.height-7, this.$props.paperSize.width, this.$props.paperSize.height);

                ctx.globalAlpha = 1;
                ctx.fillStyle = "white";
                Drawing.fillRect(ctx, viewPort, 0, this.$props.paperSize.height, this.$props.paperSize.width, this.$props.paperSize.height);
                ctx.strokeStyle = "#CCCCCC";
                Drawing.rect(ctx, viewPort, 0, this.$props.paperSize.height, this.$props.paperSize.width, this.$props.paperSize.height);


                // Now draw background image
                if (this.backgroundImage === null) {

                } else {
                    // find the real life size of the image in meters.
                    const realWidth = this.$props.pdfSize.width / parseScale(this.$props.pdfScale);
                    const desiredWidth = realWidth * this.scale;

                    this.backgroundImage.rescale(desiredWidth / this.backgroundImage.image.naturalWidth,
                        this.$props.paperSize.width/2,
                        this.$props.paperSize.height/2,
                    );

                    this.backgroundImage.draw(ctx, viewPort, 0.2);

                    this.backgroundImage.worldClipDraw(ctx, viewPort, 1.0, this.crop.x, this.crop.y, this.crop.w, this.crop.h);

                    // draw crop controls
                    this.crop.draw(ctx, viewPort);
                }

                // Now draw scale bars
                drawPaperScale(ctx, pxPerMm * this.scale);

            } else {
                console.log("Context is null, cannot render");
            }
        }
    }

    export interface BackgroundState {
        uri: string;
        centerX: number;
        centerY: number;
        scale: number;
        paperScale: string;
        paper: string;
        crop: {
            x: number;
            y: number;
            w: number;
            h: number;
        }
    }
</script>
