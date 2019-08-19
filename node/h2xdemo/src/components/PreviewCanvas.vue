<template>
    <div ref="canvasFrame" style="width:100%">
        <canvas ref="previewCanvas" style="background-color: lightgray;">

        </canvas>
        <resize-observer @notify="draw"/>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue';
    import Component from "vue-class-component";
    import {Watch} from 'vue-property-decorator';
    import {PaperSize} from "@/config";
    import {drawPaperScale} from "@/Layers/Scale";

    @Component ({
        props: {
            paperSize: Object,
            pdfUri: String,
        }
    })
    export default class PreviewCanvas extends Vue {
        ctx: CanvasRenderingContext2D | null =  null;
        INNER_PADDING: number = 20;

        mounted() {
            console.log("This canvas is at " + this.$refs["previewCanvas"]);
            console.log("Paper size is " + this.$props.paperSize.width + " " + this.$props.paperSize.height);
            this.ctx = (this.$refs["previewCanvas"] as any).getContext("2d");
            window.addEventListener('resize', this.draw);
        }

        @Watch("paperSize")
        onPaperSizeChange(val: PaperSize, old: PaperSize) {
            console.log("Paper size changed to " + val.width + " " + val.height);
            this.draw();
        }

        draw() {
            if (this.ctx != null) {

                let ctx: CanvasRenderingContext2D = this.ctx;

                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                // auto scale the current paper size to fit.
                let width = (this.$refs["canvasFrame"] as any).clientWidth;
                let height = width * 0.5;
                ctx.canvas.width = width;
                ctx.canvas.height = height;
                console.log("w: " + width + " " + height);

                // scale defined as pxPerMm
                let ws = ( width - this.INNER_PADDING * 2 ) / this.$props.paperSize.width;
                let hs = ( height - this.INNER_PADDING * 2 ) / this.$props.paperSize.height;
                let pxPerMm = Math.min(ws, hs);

                // Find TL coord. BR coord follows.
                let tlx = (width - this.$props.paperSize.width * pxPerMm) / 2;
                let tly = (height - this.$props.paperSize.height * pxPerMm) / 2;
                console.log("X " + tlx + " y " + tly + " w " + this.$props.paperSize.height * pxPerMm + " h " + this.$props.paperSize.width * pxPerMm);

                console.log("Render paper size: " + this.$props.paperSize.width + " " + this.$props.paperSize.height);
                ctx.fillStyle = "white";
                ctx.fillRect(tlx, tly, this.$props.paperSize.width * pxPerMm, this.$props.paperSize.height * pxPerMm);

                // Now draw scale bars
                drawPaperScale(ctx, pxPerMm);
            } else {
                console.log("Context is null, cannot render");
            }
        }
    }
</script>
