import { CalculationFilters} from "../../../src/store/document/types";
import { ViewPort } from "../../../src/htmlcanvas/viewport";
import { Matrix } from "transformation-matrix";
import * as TM from "transformation-matrix";
import { DrawingMode, MouseMoveResult, UNHANDLED } from "../../../src/htmlcanvas/types";
import { decomposeMatrix, matrixScale } from "../../../src/htmlcanvas/utils";
import { DrawingContext } from "../../../src/htmlcanvas/lib/types";
import Flatten from "@flatten-js/core";
import Layer from "../../../src/htmlcanvas/layers/layer";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import { Coord, Rectangle } from "../../../../common/src/api/document/drawing";

export type BoxableShape = Flatten.Segment | Flatten.Point | Flatten.Polygon | Flatten.Circle;

export default abstract class DrawableObject {
    abstract position: Matrix;
    parentInternal: DrawableObject | null; // null parents mean root objects
    layer: Layer;

    selectable: boolean = false;
    draggable: boolean = false;
    centered: boolean = false;
    calculated: boolean = false;

    constructor(parent: DrawableObject | null) {
        this.parentInternal = parent;
    }

    get parent(): DrawableObject | null {
        return this.parentInternal;
    }

    fromParentToObjectCoord(parent: Coord): Coord {
        return TM.applyToPoint(TM.inverse(this.position), parent);
    }

    toObjectCoord(world: Coord): Coord {
        if (this.parent == null) {
            return this.fromParentToObjectCoord(world);
        }
        return this.fromParentToObjectCoord(this.parent.toObjectCoord(world));
    }

    fromParentToObjectLength(parentLength: number): number {
        return matrixScale(TM.inverse(this.position)) * parentLength;
    }

    toObjectLength(worldLength: number): number {
        if (this.parent == null) {
            return this.fromParentToObjectLength(worldLength);
        }
        return this.fromParentToObjectLength(this.parent.toObjectLength(worldLength));
    }

    toParentCoord(object: Coord): Coord {
        return TM.applyToPoint(this.position, object);
    }

    toWorldCoord(object: Coord = { x: 0, y: 0 }): Coord {
        if (this.parent == null) {
            return TM.applyToPoint(this.position, object);
        }
        return this.parent.toWorldCoord(this.toParentCoord(object));
    }

    fromParentToWorldCoord(parent: Coord) {
        if (this.parent == null) {
            return parent;
        }
        return this.parent.toWorldCoord(parent);
    }

    fromParentToWorldLength(parent: number) {
        if (this.parent == null) {
            return parent;
        }
        return this.parent.toWorldLength(parent);
    }

    toParentLength(object: number): number {
        return matrixScale(this.position) * object;
    }

    toWorldLength(object: number): number {
        if (this.parent == null) {
            return this.toParentLength(object);
        }
        return this.parent.toWorldLength(this.toParentLength(object));
    }

    toParentAngleDeg(object: number) {
        return object + (decomposeMatrix(this.position).a / Math.PI) * 180;
    }

    toWorldAngleDeg(object: number): number {
        if (this.parent == null) {
            return this.toParentAngleDeg(object);
        }
        return this.parent.toWorldAngleDeg(this.toParentAngleDeg(object));
    }

    abstract drawInternal(context: DrawingContext, args: DrawingArgs): void;

    draw(context: DrawingContext, args: DrawingArgs) {
        const { ctx, vp } = context;
        // get parent positions
        vp.prepareContext(ctx, ...this.world2object);

        this.drawInternal(context, args);

        /*
        vp.prepareContext(ctx, ...transforms);
        this.drawOwnShape(context);*/
    }

    get world2object(): TM.Matrix[] {
        const transforms: Matrix[] = [this.position];
        let parent = this.parent;
        while (parent != null) {
            transforms.unshift(parent.position);
            parent = parent.parent;
        }

        return transforms;
    }

    drawOwnShape(context: DrawingContext) {
        const { ctx } = context;
        const currentWC00 = this.toObjectCoord({ x: 0, y: 0 });
        this.withWorld(context, currentWC00, () => {
            const s = this.shape();
            if (s instanceof Flatten.Polygon) {
                ctx.beginPath();
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 5;
                s.edges.forEach((f: Flatten.Segment) => {
                    ctx.moveTo(f.start.x, f.start.y);
                    ctx.lineTo(f.end.x, f.end.y);
                });
                ctx.stroke();
            }
        });
    }

    withScreen({ ctx }: DrawingContext, current: Coord, fun: () => void) {
        const oldTransform = ctx.getTransform();
        const sc = TM.applyToPoint(ctx.getTransform(), current);
        ctx.resetTransform();
        ctx.setTransform(TM.translate(sc.x, sc.y));

        fun();

        ctx.setTransform(oldTransform);
    }

    withScreenScale({ ctx }: DrawingContext, current: Coord, fun: () => void) {
        const oldTransform = ctx.getTransform();
        const t = decomposeMatrix(ctx.getTransform());
        const sc = TM.applyToPoint(ctx.getTransform(), current);
        ctx.resetTransform();
        ctx.translate(sc.x, sc.y);

        ctx.rotate(t.a);

        fun();
        ctx.setTransform(oldTransform);
    }

    withWorld({ ctx, vp }: DrawingContext, current: Coord, fun: () => void) {
        const oldTransform = ctx.getTransform();
        const sc = TM.applyToPoint(ctx.getTransform(), current);

        const wc = vp.toWorldCoord(sc);
        vp.prepareContext(ctx);
        ctx.translate(wc.x, wc.y);

        fun();

        ctx.setTransform(oldTransform);
    }

    // Assumes uniform x/y scale
    withWorldScale({ ctx, vp }: DrawingContext, current: Coord, fun: () => void) {
        const oldTransform = ctx.getTransform();
        const sc = TM.applyToPoint(ctx.getTransform(), current);

        const t = decomposeMatrix(ctx.getTransform());

        const wc = vp.toWorldCoord(sc);
        vp.prepareContext(ctx);
        ctx.translate(wc.x, wc.y);
        ctx.rotate(t.a);

        fun();
        ctx.setTransform(oldTransform);
    }

    // Assumes uniform x/y scale
    withWorldAngle({ ctx, vp }: DrawingContext, current: Coord, fun: () => void) {
        const oldTransform = ctx.getTransform();
        const sc = TM.applyToPoint(ctx.getTransform(), current);

        const t = decomposeMatrix(ctx.getTransform());

        ctx.translate(current.x, current.y);
        ctx.rotate(-t.a);

        fun();
        ctx.setTransform(oldTransform);
    }

    abstract inBounds(objectCoord: Coord, objectRadius?: number): boolean;

    onMouseDown(event: MouseEvent, context: CanvasContext): boolean {
        return false;
    }

    onMouseMove(event: MouseEvent, context: CanvasContext): MouseMoveResult {
        return UNHANDLED;
    }

    onMouseUp(event: MouseEvent, context: CanvasContext): boolean {
        return false;
    }

    // For figuring out how to fit the view.
    shape(): BoxableShape | null {
        const point = this.toWorldCoord({ x: 0, y: 0 });
        return Flatten.point(point.x, point.y);
    }
}

export interface DrawingArgs {
    selected: boolean;
    active: boolean;
    calculationFilters: CalculationFilters | null;
}
