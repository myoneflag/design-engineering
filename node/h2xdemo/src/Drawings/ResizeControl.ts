import {ViewPort} from '@/Drawings/2DViewport';
import {rect} from '@/Drawings/ViewportDrawing';
import DrawableObject from '@/Drawings/Object';

enum Sides {
    Left,
    Top,
    Right,
    Bottom,
}

type Handle = [number, number, Sides[], string];

export class ResizeControl extends DrawableObject {

    onChange: ((_: ResizeControl) => any) | null;
    onCommit: ((_: ResizeControl) => any) | null;
    handles: Handle[];

    private x_: number;
    private y_: number;
    private w_: number;
    private h_: number;

    constructor(x: number, y: number, w: number, h: number, onChange: ((_: ResizeControl) => any), onCommit: ((_: ResizeControl) => any)) {
        super();
        this.x_ = x;
        this.y_ = y;
        this.w_ = w;
        this.h_ = h;
        this.handles = this.getHandles();
        this.onChange = onChange;
        this.onCommit = onCommit;
    }


    get x() {
        return this.x_;
    }
    set x(val: number) {
        this.x_ = val;
        this.handles = this.getHandles();
    }

    get y() {
        return this.y_;
    }
    set y(val: number) {
        this.y_ = val;
        this.handles = this.getHandles();
    }

    get w() {
        return this.w_;
    }
    set w(val: number) {
        this.w_ = val;
        this.handles = this.getHandles();
    }

    get h() {
        return this.h_;
    }
    set h(val: number) {
        this.h_ = val;
        this.handles = this.getHandles();
    }

    getHandles(): Handle[] {
        return [
            [this.x, this.y, [Sides.Bottom, Sides.Left], 'sw-resize'],
            [this.x, this.y + this.h / 2, [Sides.Left], 'w-resize'],
            [this.x, this.y + this.h, [Sides.Top, Sides.Left], 'nw-resize'],
            [this.x + this.w / 2, this.y, [Sides.Bottom], 's-resize'],
            [this.x + this.w, this.y, [Sides.Bottom, Sides.Right], 'se-resize'],
            [this.x + this.w, this.y + this.h / 2, [Sides.Right], 'e-resize'],
            [this.x + this.w, this.y + this.h, [Sides.Top, Sides.Right], 'ne-resize'],
            [this.x + this.w / 2, this.y + this.h, [Sides.Top], 'n-resize'],
        ];
    }

    getHandleAtScreenCoord(sx: number, sy: number, vp: ViewPort): Handle | null {
        for (const [x, y, sides, cursor] of this.handles) {
            let [cx, cy] = vp.toScreenCoord(x, y);
            if (Math.abs(cx - sx) < 10 && Math.abs(cy - sy) < 10) {
                return [x, y, sides, cursor];
            }
        }
        return null;
    }

    selectedHandle: Handle | null = null;

    onMouseDown(event: MouseEvent, vp: ViewPort): boolean {
        this.selectedHandle = this.getHandleAtScreenCoord(event.offsetX, event.offsetY, vp);
        return this.selectedHandle != null;
    }

    onMouseMove(event: MouseEvent, vp: ViewPort): boolean {
        // do mouse changes
        if (event.buttons & 1) {
            if (this.selectedHandle != null) {
                const [wx, wy] = vp.toWorldCoord(event.offsetX, event.offsetY);
                console.log(this.selectedHandle[2]);
                // start resizing shit
                if (this.selectedHandle[2].indexOf(Sides.Left) != -1) {
                    this.w += this.x - wx;
                    this.x = wx;
                }
                if (this.selectedHandle[2].indexOf(Sides.Right) != -1) {
                    this.w = wx - this.x;
                }
                if (this.selectedHandle[2].indexOf(Sides.Bottom) != -1) {
                    this.h += this.y - wy;
                    this.y = wy;
                }
                if (this.selectedHandle[2].indexOf(Sides.Top) != -1) {
                    this.h = wy - this.y;
                }

                if (this.onChange != null) {
                    this.onChange(this);
                }
                return true;
            }
            return false;
        } else {
            // No buttons are pressed.
            if (this.selectedHandle) {
                this.selectedHandle = null;

                if (this.onCommit) {
                    this.onCommit(this);
                }
            }
            const at: Handle | null = this.getHandleAtScreenCoord(event.offsetX, event.offsetY, vp);
            const target = (event.target as HTMLElement);
            if (at == null) {
                target.style.cursor = 'auto';
                return false;
            } else {
                target.style.cursor = at[3];
                return true;
            }
        }
    }

    onMouseUp(event: MouseEvent, vp: ViewPort): boolean {
        if (this.selectedHandle) {
            this.selectedHandle = null;
            if (this.onCommit) {
                this.onCommit(this);
            }
            console.log("Resize control took the up event");
            return true;
        }
        return false;
    }

    draw(ctx: CanvasRenderingContext2D, vp: ViewPort) {
        const prevDash = ctx.getLineDash();
        ctx.strokeStyle = '#666666';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        rect(ctx, vp, this.x, this.y + this.h, this.w, this.h);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.strokeStyle = '#333333';
        ctx.beginPath()
        for (const [x, y] of this.handles) {
            const [cx, cy] = vp.toScreenCoord(x, y);
            ctx.rect(cx - 5, cy - 5, 10, 10);
        }
        ctx.stroke();

        ctx.setLineDash(prevDash);
    }
}
