import { ViewPort } from "../../../src/htmlcanvas/viewport";
import DrawableObject from "../../../src/htmlcanvas/lib/drawable-object";
import { SizeableObject } from "../../../src/htmlcanvas/lib/object-traits/sizeable-object";
import * as TM from "transformation-matrix";
import { matrixScale } from "../../../src/htmlcanvas/utils";
import { MouseMoveResult, UNHANDLED } from "../../../src/htmlcanvas/types";
import { DrawingContext } from "../../../src/htmlcanvas/lib/types";
import Layer from "../../../src/htmlcanvas/layers/layer";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import { Coord } from "../../../../common/src/api/document/drawing";

enum Sides {
    Left,
    Top,
    Right,
    Bottom
}

type Handle = [number, number, Sides[], string];

export class ResizeControl extends DrawableObject {
    onCommit: ((_: ResizeControl) => any) | null;
    onRedrawNeeded: () => any;
    handles: Handle[];

    selectedHandle: Handle | null = null;

    constructor(
        parent: SizeableObject,
        onCommit: (_: ResizeControl) => any,
        onRedrawNeeded: () => any,
    ) {
        super(parent);
        console.log('constructed');
        console.trace();
        this.handles = this.getHandles();
        this.onCommit = onCommit;
        this.onRedrawNeeded = onRedrawNeeded;
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
            [this.x, this.y, [Sides.Bottom, Sides.Left], "nw-resize"],
            [this.x, this.y + this.h / 2, [Sides.Left], "w-resize"],
            [this.x, this.y + this.h, [Sides.Top, Sides.Left], "sw-resize"],
            [this.x + this.w / 2, this.y, [Sides.Bottom], "n-resize"],
            [this.x + this.w, this.y, [Sides.Bottom, Sides.Right], "ne-resize"],
            [this.x + this.w, this.y + this.h / 2, [Sides.Right], "e-resize"],
            [this.x + this.w, this.y + this.h, [Sides.Top, Sides.Right], "se-resize"],
            [this.x + this.w / 2, this.y + this.h, [Sides.Top], "s-resize"]
        ];
    }

    getHandleAtScreenCoord(sx: number, sy: number, vp: ViewPort): Handle | null {
        for (const [x, y, sides, cursor] of this.handles) {
            const c = vp.toScreenCoord(this.toWorldCoord({ x, y }));
            if (Math.abs(c.x - sx) < 10 && Math.abs(c.y - sy) < 10) {
                return [x, y, sides, cursor];
            }
        }
        return null;
    }

    onMouseDown(event: MouseEvent, context: CanvasContext): boolean {
        this.selectedHandle = this.getHandleAtScreenCoord(event.offsetX, event.offsetY, context.viewPort);
        return this.selectedHandle != null;
    }

    onMouseMove(event: MouseEvent, context: CanvasContext): MouseMoveResult {
        // do mouse changes
        // tslint:disable-next-line:no-bitwise
        if (event.buttons & 1) {
            console.log("dragging down. " + this.selectedHandle);
            if (this.selectedHandle != null) {
                const w = this.toObjectCoord(context.viewPort.toWorldCoord({ x: event.offsetX, y: event.offsetY }));
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

                this.onRedrawNeeded();
                return { handled: true, cursor: "move" };
            }
            return UNHANDLED;
        } else {
            console.log('dragging up');
            // No buttons are pressed.
            if (this.selectedHandle) {
                this.selectedHandle = null;

                if (this.onCommit) {
                    this.onCommit(this);
                }
            }
            const at: Handle | null = this.getHandleAtScreenCoord(event.offsetX, event.offsetY, context.viewPort);
            if (at == null) {
                return UNHANDLED;
            } else {
                return { handled: true, cursor: at[3] };
            }
        }
    }

    onMouseUp(event: MouseEvent, context: CanvasContext): boolean {
        if (this.selectedHandle) {
            this.selectedHandle = null;
            if (this.onCommit) {
                this.onCommit(this);
            }
            return true;
        }
        return false;
    }

    drawInternal(context: DrawingContext) {
        const { ctx } = context;
        const prevDash = ctx.getLineDash();

        const scale = context.vp.currToScreenScale(ctx);

        ctx.lineWidth = 1 / scale;
        ctx.beginPath();
        ctx.strokeStyle = "#666666";

        ctx.setLineDash([5 / scale, 5 / scale]);
        ctx.rect(this.x, this.y, this.w, this.h);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.strokeStyle = "#333333";
        ctx.beginPath();
        for (const [x, y] of this.handles) {
            this.withScreen(context, { x, y }, () => {
                ctx.rect(-5, -5, 10, 10);
            });
        }
        ctx.stroke();

        ctx.setLineDash(prevDash);
    }

    inBounds(objectCoord: Coord): boolean {
        return false;
    }
}
