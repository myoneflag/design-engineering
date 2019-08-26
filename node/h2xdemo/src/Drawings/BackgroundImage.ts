import {ViewPort} from '@/Drawings/2DViewport';
import {Dimensions, Coord, Rectangle} from '@/store/document/types';
import DrawableObject from '@/Drawings/Object';

export class BackgroundImage extends DrawableObject{
    image: HTMLImageElement = new Image();
    center: Coord;
    dimensions: Dimensions;
    clipOs: Rectangle;
    uri: string;

    scale: {x: number, y: number} = {x: 1, y: 1};

    constructor(uri: string, center: Coord, bounds: Dimensions, onLoad: (image: BackgroundImage) => any) {
        super();
        this.center = Object.assign({}, center);
        this.dimensions = Object.assign({}, bounds);
        this.image.onload = () => {
            this.scale = {
                x: bounds.w / this.image.naturalWidth,
                y: bounds.h / this.image.naturalHeight,
            };
            onLoad(this);
        };
        this.image.src = uri;
        this.uri = uri;
        this.clipOs = {
            x: - bounds.w / 2,
            y: - bounds.h / 2,
            w: bounds.w,
            h: bounds.h,
        };
    }

    /**
     * World X coordinate
     */
    get x() {
        return this.center.x - this.dimensions.w / 2;
    }

    /**
     * World Y coordinate
     */
    get y() {
        return this.center.y - this.dimensions.h / 2;
    }

    /**
     * Draw with natural clip
     */
    naturalClipDraw(ctx: CanvasRenderingContext2D, vp: ViewPort, alpha: number, l: number, t: number, w: number, h: number) {
        console.log("this scale: " + this.scale.x + " " + this.scale.y);
        let oldAlpha = ctx.globalAlpha;
        ctx.globalAlpha = alpha;
        let [x, y] = vp.toScreenCoord(
            this.center.x + (l - this.image.naturalWidth / 2) * this.scale.x,
            this.center.y - (t - this.image.naturalHeight / 2) * this.scale.y,
        );
        ctx.drawImage(this.image,
            l, t, w, h,
            x, y,
            vp.toScreenLength(w * this.scale.x),
            vp.toScreenLength(h * this.scale.y),
        );

        ctx.strokeStyle = "#888888";
        ctx.beginPath();
        ctx.strokeRect(
            x, y,
            vp.toScreenLength(w * this.scale.x),
            vp.toScreenLength(h * this.scale.y),
            );
        ctx.stroke();
        ctx.globalAlpha = oldAlpha;
    }

    worldClipDraw(ctx: CanvasRenderingContext2D, vp: ViewPort, alpha: number, x: number, y: number, w: number, h: number) {
        // We use an inverse viewport to find the appropriate clip bounds.
        let ivp_x = new ViewPort(this.center.x, this.center.y, this.image.naturalWidth, this.image.naturalHeight, 1/this.scale.x);
        let ivp_y = new ViewPort(this.center.x, this.center.y, this.image.naturalWidth, this.image.naturalHeight, 1/this.scale.y);
        // Remember that when going from world view to image coordinate view, we must invert the y axis about the center.
        let [l, _d1] = ivp_x.toScreenCoord(x, y + h);
        let [_d2, t] = ivp_y.toScreenCoord(x, y + h);

        console.log("l and t: " + l + " " + t);
        this.naturalClipDraw(ctx, vp, alpha, l, t,
            w / this.scale.x,
            h / this.scale.y,
        );
    }


    // Draw without world space concerns
    draw(ctx: CanvasRenderingContext2D, vp: ViewPort, whole: boolean = false) {
        if (whole) {
            this.naturalClipDraw(ctx, vp, 0.2, 0, 0, this.image.naturalWidth, this.image.naturalHeight);
        }
        const corner = this.toWorldCoord({x: this.clipOs.x, y: this.clipOs.y});
        this.worldClipDraw(ctx, vp, 1, corner.x, corner.y, this.clipOs.w, this.clipOs.h);
    }
}
