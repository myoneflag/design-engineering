import {ViewPort} from '@/Drawings/2DViewport';
import {Dimensions, Coord, Rectangle, Background} from '@/store/document/types';
import DrawableObject from '@/Drawings/DrawableObject';
import axios from 'axios';
import * as TM from 'transformation-matrix';
import {decomposeMatrix, parseScale} from '@/Drawings/Utils';
import SizeableObject from '@/Drawings/SizeableObject';
import {scale} from 'transformation-matrix/scale';
import {translate} from 'transformation-matrix/translate';

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
        console.log("Constructed background with " + background);
        this.background = background;

        this.onMove = onMove;
        this.onSelect = onSelect;
        this.onCommit = onCommit;

        // Try to load the image. If we can't, then show a loading screen.
        const retry = () => {
            axios.head(this.background.uri).then((res) => {
                    console.log('background loaded. Resp: ' + res.status);
                    const image = new Image();
                    image.src = background.uri;

                    image.onload = () => {
                        this.imgScale = {
                            x: this.width / image.naturalWidth,
                            y: this.height / image.naturalHeight,
                        };
                        this.image = image;
                        onLoad(this);
                    };
                    image.src = background.uri;
                },
            ).catch((err) => {
                console.log('Resource not loaded. ' + err);
                setTimeout(() => {
                    console.log("retrying...");
                    retry();
                }, 1000);
            });
        };

        retry();
    }

    get position() {
        return TM.transform(
            // TM.scale(parseScale(background.scale)), // no scale because we will base the scale on the image size.
            TM.translate(this.background.center.x, this.background.center.y),
            TM.rotateDEG(this.background.rotation),//, this.background.center.x, this.background.center.y),
        );
    }

    get width() {
        return this.background.paperSize.width / parseScale(this.background.scale);
    }

    get height() {
        return this.background.paperSize.height / parseScale(this.background.scale);
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

            const { sx, sy } = decomposeMatrix(ctx.getTransform());

            console.log("this scale: " + this.imgScale.x + " " + this.imgScale.y);
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
            ctx.drawImage(this.image,
                l, t, w, h,
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

            console.log("x and y: " + JSON.stringify(l) + " " + JSON.stringify(t));

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


    // Draw without world space concerns
    drawInternal(ctx: CanvasRenderingContext2D, selected: boolean, active: boolean) {
        if ((selected && active) && this.image) {
            this.naturalClipDraw(ctx, 0.2, 0, 0, this.image.naturalWidth, this.image.naturalHeight, active);
        }

        let alpha = 1;
        if (selected && this.hasDragged) {
            alpha = 0.6;
        }

        console.log("this boundary: " + JSON.stringify(this.boundary));
        this.objectClipDraw(ctx, alpha, this.boundary.x, this.boundary.y, this.boundary.w, this.boundary.h, selected, active);
    }

    /**
     * Event Handlers
     */


    inBounds(ox: number, oy: number): boolean {
        //let clipP = this.toWorldCoord(this.background.crop);

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
    hasDragged: boolean = false;

    onMouseDown(event: MouseEvent, vp: ViewPort): boolean {
        const w = vp.toWorldCoord({x: event.offsetX, y: event.offsetY});
        const o = this.toObjectCoord(w);
        if (this.inBounds(o.x, o.y)) {
            this.grabbedPoint = [w.x, w.y];
            this.grabbedCenterState = [this.center.x, this.center.y];
            this.hasDragged = false;
            if (this.onSelect) {
                this.onSelect(this);
            }
            return true;
        }
        return false;
    }

    onMouseMove(event: MouseEvent, vp: ViewPort): boolean {
        if (event.buttons && 1) {
            if (this.grabbedPoint != null && this.grabbedCenterState != null) {
                let w = vp.toWorldCoord({x: event.offsetX, y: event.offsetY});
                // Drag move
                this.center.x = this.grabbedCenterState[0] + w.x - this.grabbedPoint[0];
                this.center.y = this.grabbedCenterState[1] + w.y - this.grabbedPoint[1];
                this.hasDragged = true;

                if (this.onMove != null) {
                    this.onMove(this);
                }
                return true;
            } else {
                return false;
            }
        } else {
            if (this.grabbedCenterState != null || this.grabbedPoint != null) {
                this.onCommit(this);
            }
            this.grabbedCenterState = null;
            this.grabbedPoint = null;
            this.hasDragged = false;
            return false;
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
