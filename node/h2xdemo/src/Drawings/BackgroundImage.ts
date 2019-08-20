import {ViewPort} from '@/Drawings/2DViewport';
import {rescaleAnchor} from '@/Drawings/Utils';

export class BackgroundImage {
    image: HTMLImageElement = new Image();
    centerX: number = 0;
    centerY: number = 0;
    scale: number = 1;
    uri: string;

    onMove: ((_: BackgroundImage) => any) | null;

    constructor(uri: string, onLoad: (image: BackgroundImage) => any, onMove: ((_: BackgroundImage) => any) | null = null) {
        this.image.onload = () => {
            this.centerX = this.image.naturalWidth / 2;
            this.centerY = this.image.naturalHeight / 2;
            onLoad(this);
        };
        this.image.src = uri;
        this.uri = uri;
        this.onMove = onMove;
    }

    /**
     * World X coordinate
     */
    get x() {
        return this.centerX - this.scale * this.image.naturalWidth / 2;
    }

    /**
     * World Y coordinate
     */
    get y() {
        return this.centerY - this.scale * this.image.naturalHeight / 2;
    }

    /**
     * Draw with natural clip
     * @param ctx
     * @param vp
     * @param alpha
     * @param x
     * @param y
     * @param w
     * @param h
     */
    naturalClipDraw(ctx: CanvasRenderingContext2D, vp: ViewPort, alpha: number, l: number, t: number, w: number, h: number) {
        let oldAlpha = ctx.globalAlpha;
        ctx.globalAlpha = alpha;
        let [x, y] = vp.toScreenCoord(this.centerX + (l - this.image.naturalWidth / 2) * this.scale, this.centerY - (t - this.image.naturalHeight / 2) * this.scale);
        ctx.drawImage(this.image,
            l, t, w, h,
            x, y, vp.toScreenLength(w * this.scale), vp.toScreenLength(h * this.scale),
        );
        ctx.globalAlpha = oldAlpha;
    }

    worldClipDraw(ctx: CanvasRenderingContext2D, vp: ViewPort, alpha: number, x: number, y: number, w: number, h: number) {
        // We use an inverse viewport to find the appropriate clip bounds.
        let ivp = new ViewPort(this.centerX, this.centerY, this.image.naturalWidth, this.image.naturalHeight, 1 / this.scale);
        // Remember that when going from world view to image coordinate view, we must invert the y axis about the center.
        let [l, t] = ivp.toScreenCoord(x, y + h);
        this.naturalClipDraw(ctx, vp, alpha, l, t, w / this.scale, h / this.scale);
    }

    // Draw without world space concerns
    draw(ctx: CanvasRenderingContext2D, vp: ViewPort, alpha: number = 1.0) {
        this.naturalClipDraw(ctx, vp, alpha, 0, 0, this.image.naturalWidth, this.image.naturalHeight);
    }

    rescale(newScale: number, anchorX: number, anchorY: number) {
        rescaleAnchor(this, newScale, anchorX, anchorY);
    }

    inBounds(x: number, y: number): boolean {
        if (x < this.x || y < this.y) {
            return false;
        } else if (x <= this.x + this.image.naturalWidth * this.scale
            && y <= this.y + this.image.naturalHeight * this.scale) {
            return true;
        }
        return false;
    }

    grabbedPoint: [number, number] | null = null;
    grabbedCenterState: [number, number] | null = null;
    onMouseDown(event: MouseEvent, vp: ViewPort): boolean {
        this.grabbedPoint = vp.toWorldCoord(event.offsetX, event.offsetY);
        if (this.inBounds(this.grabbedPoint[0], this.grabbedPoint[1])) {
            this.grabbedCenterState = [this.centerX, this.centerY];
            return true;
        } else {
            this.grabbedPoint = null;
            return false;
        }
    }

    onMouseMove(event: MouseEvent, vp: ViewPort): boolean {
        if (event.buttons && 1) {
            if (this.grabbedPoint != null && this.grabbedCenterState != null) {
                let [wx, wy] = vp.toWorldCoord(event.offsetX, event.offsetY);
                // Drag move
                this.centerX = this.grabbedCenterState[0] + wx - this.grabbedPoint[0];
                this.centerY = this.grabbedCenterState[1] + wy - this.grabbedPoint[1];

                if (this.onMove != null) {
                    this.onMove(this);
                }
                return true;
            } else {
                return false;
            }
        } else {
            this.grabbedCenterState = null;
            this.grabbedPoint = null;
            return false;
        }
    }

    onMouseUp(event: MouseEvent, vp: ViewPort): boolean {
        this.grabbedPoint = null;
        this.grabbedCenterState = null;
        return false;
    }

}
