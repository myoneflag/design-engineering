import {ViewPort} from '@/htmlcanvas/viewport';
import DrawableObject from '@/htmlcanvas/lib/drawable-object';
import SizeableObject from '@/htmlcanvas/lib/sizeable-object';
import * as TM from 'transformation-matrix';
import {matrixScale} from '@/htmlcanvas/utils';
import {MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';
import {Coord} from '@/store/document/types';

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

    selectedHandle: Handle | null = null;

    constructor(parent: SizeableObject, onChange: ((_: ResizeControl) => any), onCommit: ((_: ResizeControl) => any)) {
        super(parent);
        this.handles = this.getHandles();
        this.onChange = onChange;
        this.onCommit = onCommit;
    }

    get position() {
        return TM.identity();
    }

    get x() {
        return (this.parent as SizeableObject).boundary.x;
    }
    set x(val: number) {
        (this.parent as SizeableObject).boundary.x = val;
        this.handles = this.getHandles();
    }

    get y() {
        return (this.parent as SizeableObject).boundary.y;
    }
    set y(val: number) {
        (this.parent as SizeableObject).boundary.y = val;
        this.handles = this.getHandles();
    }

    get w() {
        return (this.parent as SizeableObject).boundary.w;
    }
    set w(val: number) {
        (this.parent as SizeableObject).boundary.w = val;
        this.handles = this.getHandles();
    }

    get h() {
        return (this.parent as SizeableObject).boundary.h;
    }
    set h(val: number) {
        (this.parent as SizeableObject).boundary.h = val;
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
            const c = vp.toScreenCoord(this.toWorldCoord({x, y}));
            if (Math.abs(c.x - sx) < 10 && Math.abs(c.y - sy) < 10) {
                return [x, y, sides, cursor];
            }
        }
        return null;
    }


    onMouseDown(event: MouseEvent, vp: ViewPort): boolean {
        this.selectedHandle = this.getHandleAtScreenCoord(event.offsetX, event.offsetY, vp);
        return this.selectedHandle != null;
    }

    onMouseMove(event: MouseEvent, vp: ViewPort): MouseMoveResult {
        // do mouse changes
        // tslint:disable-next-line:no-bitwise
        if (event.buttons & 1) {
            if (this.selectedHandle != null) {
                const w = this.toObjectCoord(vp.toWorldCoord({x: event.offsetX, y: event.offsetY}));
                // start resizing shit
                if (this.selectedHandle[2].indexOf(Sides.Left) !== -1) {
                    this.w += this.x - w.x;
                    this.x = w.x;
                }
                if (this.selectedHandle[2].indexOf(Sides.Right) !== -1) {
                    this.w = w.x - this.x;
                }
                if (this.selectedHandle[2].indexOf(Sides.Bottom) !== -1) {
                    this.h += this.y - w.y;
                    this.y = w.y;
                }
                if (this.selectedHandle[2].indexOf(Sides.Top) !== -1) {
                    this.h = w.y - this.y;
                }

                if (this.onChange != null) {
                    this.onChange(this);
                }
                return {handled: true, cursor: 'move'};
            }
            return UNHANDLED;
        } else {
            // No buttons are pressed.
            if (this.selectedHandle) {
                this.selectedHandle = null;

                if (this.onCommit) {
                    this.onCommit(this);
                }
            }
            const at: Handle | null = this.getHandleAtScreenCoord(event.offsetX, event.offsetY, vp);
            if (at == null) {
                return UNHANDLED;
            } else {
                return {handled: true, cursor: at[3]};
            }
        }
    }

    onMouseUp(event: MouseEvent, vp: ViewPort): boolean {
        if (this.selectedHandle) {
            this.selectedHandle = null;
            if (this.onCommit) {
                this.onCommit(this);
            }
            return true;
        }
        return false;
    }

    drawInternal(ctx: CanvasRenderingContext2D) {
        const prevDash = ctx.getLineDash();

        const scale = matrixScale(ctx.getTransform());


        ctx.lineWidth = 1 / scale;
        ctx.beginPath();
        ctx.strokeStyle = '#666666';

        ctx.setLineDash([5 / scale, 5 / scale]);
        ctx.rect(this.x, this.y, this.w, this.h);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.strokeStyle = '#333333';
        ctx.beginPath();
        for (const [x, y] of this.handles) {
            ctx.rect(x - 5 / scale, y - 5 / scale, 10 / scale, 10 / scale);
        }
        ctx.stroke();

        ctx.setLineDash(prevDash);
    }

    inBounds(objectCoord: Coord): boolean {
        return false;
    }
}
