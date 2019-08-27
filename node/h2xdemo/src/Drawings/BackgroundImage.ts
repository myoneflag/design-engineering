import {ViewPort} from '@/Drawings/2DViewport';
import {Dimensions, Coord, Rectangle, Background} from '@/store/document/types';
import DrawableObject from '@/Drawings/Object';
import axios from 'axios';
import {parseScale} from '@/Drawings/Utils';

export class BackgroundImage extends DrawableObject{
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
        super();
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

    /**
     * Draw with natural clip
     */
    naturalClipDraw(ctx: CanvasRenderingContext2D, vp: ViewPort, alpha: number, l: number, t: number, w: number, h: number, active: boolean) {
        if (this.image) {
            console.log("this scale: " + this.imgScale.x + " " + this.imgScale.y);
            let oldAlpha = ctx.globalAlpha;
            ctx.globalAlpha = alpha;
            let [x, y] = vp.toScreenCoord(
                this.center.x + (l - this.image.naturalWidth / 2) * this.imgScale.x,
                this.center.y - (t - this.image.naturalHeight / 2) * this.imgScale.y,
            );
            let oldCompositeOperation = ctx.globalCompositeOperation;


            let sw = vp.toScreenLength(w * this.imgScale.x);
            let sh = vp.toScreenLength(h * this.imgScale.y);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(x, y, sw, sh);


            // Draw a potentially rotated image

            ctx.translate(x + sw / 2, y + sh / 2);
            ctx.rotate(this.background.rotation / 180 * Math.PI);
            ctx.drawImage(this.image,
                l, t, w, h,
                -sw / 2, -sh / 2,
                sw, sh,
            );
            ctx.rotate(-this.background.rotation / 180 * Math.PI);
            ctx.translate(-(x + sw / 2), -(y + sh / 2));


            if (!active) {
                ctx.fillStyle = '#f0f8ff';
                ctx.globalCompositeOperation = 'color';
                ctx.fillRect(
                    x,
                    y,
                    vp.toScreenLength(w * this.imgScale.x),
                    vp.toScreenLength(h * this.imgScale.y),
                );
            }

            ctx.strokeStyle = '#AAAAAA';
            ctx.beginPath();
            ctx.strokeRect(
                x, y,
                vp.toScreenLength(w * this.imgScale.x),
                vp.toScreenLength(h * this.imgScale.y),
            );
            ctx.stroke();
            ctx.globalAlpha = oldAlpha;
            ctx.globalCompositeOperation = oldCompositeOperation;
        } else {
            console.log('Trying to draw natural image without a loaded image');
        }
    }

    worldClipDraw(ctx: CanvasRenderingContext2D, vp: ViewPort, alpha: number, x: number, y: number, w: number, h: number, selected: boolean, active: boolean) {
        // We use an inverse viewport to find the appropriate clip bounds.
        if (this.image) {
            if (selected) {
                this.image
            }
            let ivp_x = new ViewPort(this.center.x, this.center.y, this.image.naturalWidth, this.image.naturalHeight, 1 / this.imgScale.x);
            let ivp_y = new ViewPort(this.center.x, this.center.y, this.image.naturalWidth, this.image.naturalHeight, 1 / this.imgScale.y);
            // Remember that when going from world view to image coordinate view, we must invert the y axis about the center.
            let [l, _d1] = ivp_x.toScreenCoord(x, y + h);
            let [_d2, t] = ivp_y.toScreenCoord(x, y + h);

            console.log("l and t: " + l + " " + t);
            this.naturalClipDraw(ctx, vp, alpha, l, t,
                w / this.imgScale.x,
                h / this.imgScale.y,
                active,
            );


        } else {

            let oldAlpha = ctx.globalAlpha;
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#AAAAAA';
            const [sx, sy] = vp.toScreenCoord(x, y);
            ctx.fillRect(
                sx, sy - vp.toScreenLength(h),
                vp.toScreenLength(w),
                vp.toScreenLength(h),
            );
            ctx.font = '20pt Helvetica';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('Loading...', sx + vp.toScreenLength(w) / 2 - 50, sy + vp.toScreenLength(h) / 2);
            ctx.globalAlpha = oldAlpha;
        }
    }


    // Draw without world space concerns
    draw(ctx: CanvasRenderingContext2D, vp: ViewPort, selected: boolean = false, active: boolean = true) {
        if (selected && active && this.image) {
            this.naturalClipDraw(ctx, vp, 0.2, 0, 0, this.image.naturalWidth, this.image.naturalHeight, active);
        }
        const corner = this.toWorldCoord({x: this.background.crop.x, y: this.background.crop.y});
        let alpha = 1;
        if (selected && this.hasDragged) {
            alpha = 0.6
        }
        this.worldClipDraw(ctx, vp, alpha, corner.x, corner.y, this.background.crop.w, this.background.crop.h, selected, active);
    }

    /**
     * Event Handlers
     */


    inBounds(wx: number, wy: number): boolean {
        let clipP = this.toWorldCoord(this.background.crop);

        if (wx < clipP.x || wy < clipP.y) {
            return false;
        } else if (wx <= clipP.x + this.background.crop.w
            && wy <= clipP.y + this.background.crop.h) {
            return true;
        }
        return false;
    }

    grabbedPoint: [number, number] | null = null;
    grabbedCenterState: [number, number] | null = null;
    hasDragged: boolean = false;

    onMouseDown(event: MouseEvent, vp: ViewPort): boolean {
        let [wx, wy] = vp.toWorldCoord(event.offsetX, event.offsetY);
        if (this.inBounds(wx, wy)) {
            this.grabbedPoint = [wx, wy];
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
                let [wx, wy] = vp.toWorldCoord(event.offsetX, event.offsetY);
                // Drag move
                this.center.x = this.grabbedCenterState[0] + wx - this.grabbedPoint[0];
                this.center.y = this.grabbedCenterState[1] + wy - this.grabbedPoint[1];
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
