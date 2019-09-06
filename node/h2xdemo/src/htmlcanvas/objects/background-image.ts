import {ViewPort} from '@/htmlcanvas/viewport';
import {Dimensions, Coord, Rectangle, Background} from '@/store/document/types';
import DrawableObject from '@/htmlcanvas/lib/drawable-object';
import axios from 'axios';
import * as TM from 'transformation-matrix';
import {decomposeMatrix, matrixScale, parseScale} from '@/htmlcanvas/utils';
import SizeableObject from '@/htmlcanvas/lib/sizeable-object';
import {scale} from 'transformation-matrix/scale';
import {translate} from 'transformation-matrix/translate';
import {MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';

// TODO: Convert into backed drawable object.
export class BackgroundImage extends SizeableObject {

    image: HTMLImageElement | null = null;
    imgScale: {x: number, y: number} = {x: 1, y: 1};

    background: Background;

    onMove: (image: BackgroundImage) => any;
    onSelect: (image: BackgroundImage) => any;
    onCommit: (image: BackgroundImage) => any;

    constructor(background: Background,
                onLoad: (image: BackgroundImage) => any,
                onMove: (image: BackgroundImage) => any,
                onSelect: (image: BackgroundImage) => any,
                onCommit: (image: BackgroundImage) => any,
    ) {
        super(null);
        this.background = background;

        this.onMove = onMove;
        this.onSelect = onSelect;
        this.onCommit = onCommit;

        this.initializeImage(onLoad);
    }

    initializeImage(onLoad: (image: BackgroundImage) => any) {
        this.image = null;
        // Try to load the image. If we can't, then show a loading screen.
        const retry = (expectedUri: string) => {
            if (expectedUri != this.background.uri) {
                // Sometimes, there are a lot of URI switches. We just want to keep the latest one.
                return;
            }

            axios.head(this.background.uri).then((res) => {
                    console.log('background loaded. Resp: ' + res.status);
                    const image = new Image();
                    image.src = this.background.uri;

                    image.onload = () => {
                        this.imgScale = {
                            x: this.width / image.naturalWidth,
                            y: this.height / image.naturalHeight,
                        };

                        // Now now, we all know the scales better be the same
                        if (Math.abs(this.imgScale.x / this.imgScale.y - 1) > 0.05) {
                            console.log('Warning: Image aspect ratio differs from paper aspect ratio by more than 5%');
                        }

                        this.imgScale.y = this.imgScale.x;

                        this.image = image;
                        onLoad(this);
                    };
                    image.src = this.background.uri;
                },
            ).catch((err) => {
                console.log('Resource not loaded. ' + err);
                setTimeout(() => {
                    console.log("retrying...");
                    retry(expectedUri);
                }, 1000);
            });
        };

        retry(this.background.uri);
    }

    get position() {
        const mat = TM.transform(
            TM.translate(this.background.center.x, this.background.center.y),
            TM.rotateDEG(this.background.rotation),//, this.background.center.x, this.background.center.y),
            TM.scale(this.background.scaleFactor),
        );
        return mat;
    }

    get width() {
        return this.background.paperSize.widthMM / parseScale(this.background.scaleName);
    }

    get height() {
        return this.background.paperSize.heightMM / parseScale(this.background.scaleName);
    }

    get center() {
        return this.background.center;
    }

    set center(value) {
        this.background.center = value;
    }

    get boundary() {
        return this.background.crop;
    }

    set boundary(value: Rectangle) {
        this.background.crop = value;
    }


    /**
     * Draw with natural clip
     */
    naturalClipDraw(ctx: CanvasRenderingContext2D, alpha: number, l: number, t: number, w: number, h: number, active: boolean) {
        if (this.image) {

            const sx = matrixScale(ctx.getTransform());
            let oldAlpha = ctx.globalAlpha;
            ctx.globalAlpha = alpha;
            let {x, y} = {x: (l - this.image.naturalWidth / 2) * this.imgScale.x,
                y: (t - this.image.naturalHeight / 2) * this.imgScale.y};
            let oldCompositeOperation = ctx.globalCompositeOperation;


            let sw = w * this.imgScale.x;
            let sh = h * this.imgScale.y;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(x, y, sw, sh);


            // Draw a potentially rotated image
            ctx.drawImage(
                this.image,
                l - this.background.offset.x / this.imgScale.x,
                t - this.background.offset.y / this.imgScale.y,
                w, h,
                x, y,
                sw, sh,
            );

            if (!active) {
                ctx.fillStyle = '#f0f8ff';
                ctx.globalCompositeOperation = 'color';
                ctx.fillRect(
                    x,
                    y,
                    sw,
                    sh,
                );
            }

            ctx.lineWidth = 1 / sx;
            ctx.strokeStyle = '#AAAAAA';
            ctx.beginPath();
            ctx.strokeRect(
                x, y,
                sw,
                sh,
            );
            ctx.stroke();
            ctx.globalAlpha = oldAlpha;
            ctx.globalCompositeOperation = oldCompositeOperation;
        } else {
            console.log('Trying to draw natural image without a loaded image');
        }
    }

    objectClipDraw(ctx: CanvasRenderingContext2D, alpha: number, x: number, y: number, w: number, h: number, selected: boolean, active: boolean) {
        // We use an inverse viewport to find the appropriate clip bounds.
        if (this.image) {
            let ivp = new ViewPort(TM.transform(
                TM.scale(this.imgScale.x, this.imgScale.y),
                ),
                this.image.naturalWidth,
                this.image.naturalHeight,
            );

            // Remember that when going from world view to image coordinate view, we must invert the y axis about the center.
            let l = ivp.toScreenCoord({x, y});
            let t = ivp.toScreenCoord({x, y});

            this.naturalClipDraw(ctx, alpha, l.x, t.y,
                w / this.imgScale.x,
                h / this.imgScale.y,
                active,
            );


        } else {

            let oldAlpha = ctx.globalAlpha;
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#AAAAAA';
            ctx.fillRect(
                x, y, w, h,
            );
            ctx.font = '20pt Helvetica';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('Loading...', x + (w) / 2, y + (h) / 2 - 20);
            ctx.globalAlpha = oldAlpha;
        }
    }

    drawPoint(ctx: CanvasRenderingContext2D, point: Coord, label: string) {
        const scale = matrixScale(ctx.getTransform());


        ctx.fillStyle = '#ff0000';
        ctx.beginPath();

        ctx.arc(point.x, point.y, 12 / scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = Math.floor(14/scale) + "pt Helvetica";
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(label, point.x-5/scale, point.y+7/scale);
    }

    // Draw without world space concerns
    drawInternal(ctx: CanvasRenderingContext2D, selected: boolean, active: boolean) {
        if ((selected && active) && this.image) {
            this.naturalClipDraw(
                ctx,
                0.2,
                this.background.offset.x / this.imgScale.x,
                this.background.offset.y / this.imgScale.y,
                this.image.naturalWidth,
                this.image.naturalHeight,
                active
            );
        }

        let alpha = 1;
        if (selected && this.hasDragged) {
            alpha = 0.6;
        }

        this.objectClipDraw(ctx, alpha, this.boundary.x, this.boundary.y, this.boundary.w, this.boundary.h, selected, active);

        if ((selected && active)) {
            if (this.background.pointA) {
                this.drawPoint(ctx, this.background.pointA, 'A');
            }
            if (this.background.pointB) {
                this.drawPoint(ctx, this.background.pointB, 'B');
            }
        }
    }

    /**
     * Event Handlers
     */


    inBounds(ox: number, oy: number): boolean {
        // let clipP = this.toWorldCoord(this.background.crop);

        if (ox < this.background.crop.x || oy < this.background.crop.y) {
            return false;
        } else if (ox <= this.background.crop.x + this.background.crop.w
            && oy <= this.background.crop.y + this.background.crop.h) {
            return true;
        }
        return false;
    }

    grabbedPoint: [number, number] | null = null;
    grabbedCenterState: [number, number] | null = null;
    grabbedOffsetState: Coord | null = null;
    hasDragged: boolean = false;
    shiftKey: boolean = false;

    onMouseDown(event: MouseEvent, vp: ViewPort): boolean {
        this.shiftKey = event.shiftKey; // shift click moves the pdf but not the crop box or child points.
        const w = vp.toWorldCoord({x: event.offsetX, y: event.offsetY});
        const o = this.toObjectCoord(w);
        if (this.inBounds(o.x, o.y)) {
            this.grabbedPoint = [w.x, w.y];
            this.grabbedCenterState = [this.center.x, this.center.y];
            this.grabbedOffsetState = Object.assign({}, this.background.offset);
            this.hasDragged = false;
            if (this.onSelect) {
                this.onSelect(this);
            }
            return true;
        }
        return false;
    }

    onMouseMove(event: MouseEvent, vp: ViewPort): MouseMoveResult {
        if (event.buttons && 1) {
            if (this.grabbedPoint != null && this.grabbedCenterState != null && this.grabbedOffsetState != null) {

                if (!this.hasDragged) {
                    if (event.shiftKey) this.shiftKey = true; // Give the user the change to click then shift then drag.
                }
                this.hasDragged = true;

                let w = vp.toWorldCoord({x: event.offsetX, y: event.offsetY});
                if (this.shiftKey) {
                    // Move the offset, not the object
                    let o = this.toObjectCoord(w);
                    let grabbedO = this.toObjectCoord({x: this.grabbedPoint[0], y: this.grabbedPoint[1]});

                    this.background.offset.x  = this.grabbedOffsetState.x + o.x - grabbedO.x;
                    this.background.offset.y = this.grabbedOffsetState.y + o.y - grabbedO.y;
                } else {

                    // Move the object
                    this.center.x = this.grabbedCenterState[0] + w.x - this.grabbedPoint[0];
                    this.center.y = this.grabbedCenterState[1] + w.y - this.grabbedPoint[1];
                }


                if (this.onMove != null) {
                    this.onMove(this);
                }
                return {handled: true, cursor: "Move"};
            } else {
                return UNHANDLED;
            }
        } else {
            if (this.grabbedCenterState != null || this.grabbedPoint != null) {
                this.onCommit(this);
            }
            this.grabbedCenterState = null;
            this.grabbedPoint = null;
            this.grabbedOffsetState = null;
            this.hasDragged = false;
            return UNHANDLED;
        }
    }

    onMouseUp(event: MouseEvent, vp: ViewPort): boolean {
        if (this.grabbedPoint || this.grabbedCenterState) {
            this.grabbedPoint = null;
            this.grabbedCenterState = null;
            this.hasDragged = false;
            this.onMove(this);
            this.onCommit(this);
            return true;
        }
        return false;
    }
}
