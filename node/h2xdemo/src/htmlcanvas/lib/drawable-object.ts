import {Coord, Rectangle} from '@/store/document/types';
import {ViewPort} from '@/htmlcanvas/viewport';
import {Matrix} from 'transformation-matrix';
import * as TM from 'transformation-matrix';
import {MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';
import {decomposeMatrix, matrixScale} from '@/htmlcanvas/utils';
import {DrawingContext} from '@/htmlcanvas/lib/types';
import Flatten from '@flatten-js/core';
import Layer from '@/htmlcanvas/layers/layer';
import CanvasContext from '@/htmlcanvas/lib/canvas-context';

export default abstract class DrawableObject {
    abstract position: Matrix;
    parentInternal: DrawableObject | null; // null parents mean root objects
    layer: Layer;

    selectable: boolean = false;
    draggable: boolean = false;

    constructor(parent: DrawableObject | null, layer: Layer) {
        this.parentInternal = parent;
        this.layer = layer;
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

    toWorldCoord(object: Coord): Coord {
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

    toParentAngle(object: number) {
        return object + decomposeMatrix(this.position).a / Math.PI * 180;
    }

    toWorldAngle(object: number): number {
        if (this.parent == null) {
            return this.toParentAngle(object);
        }
        return this.parent.toWorldAngle(this.toParentAngle(object));
    }

    abstract drawInternal(context: DrawingContext, ...args: any[]): void;

    draw(context: DrawingContext, ...args: any[]) {
        const {ctx, vp} = context;
        // get parent positions
        const transforms: Matrix[] = [this.position];
        let parent = this.parent;
        while (parent != null) {
            transforms.unshift(parent.position);
            parent = parent.parent;
        }

        vp.prepareContext(ctx, ...transforms);

        this.drawInternal(context, ...args);

        /*
        vp.prepareContext(ctx, ...transforms);
        this.drawOwnShape(context);*/
    }

    drawOwnShape(context: DrawingContext) {
        const {ctx} = context;
        const currentWC00 = this.toObjectCoord({x: 0, y: 0});
        this.withWorld(context, currentWC00, () => {
           const s = this.shape();
           if (s instanceof Flatten.Polygon) {
               ctx.beginPath();
               ctx.strokeStyle = '#000000';
               ctx.lineWidth=5;
               let began = false;
               s.edges.forEach((f: Flatten.Segment) => {
                   ctx.moveTo(f.start.x, f.start.y);
                   ctx.lineTo(f.end.x, f.end.y);
               });
               ctx.stroke();
           } else {

           }
        });
    }

    withScreen({ctx}: DrawingContext, current: Coord, fun: () => void) {
        const oldTransform = ctx.getTransform();
        const sc = TM.applyToPoint(ctx.getTransform(), current);
        ctx.resetTransform();
        ctx.setTransform(TM.translate(sc.x, sc.y));

        fun();

        ctx.setTransform(oldTransform);
    }

    withWorld({ctx, vp}: DrawingContext, current: Coord, fun: () => void) {
        const oldTransform = ctx.getTransform();
        const sc = TM.applyToPoint(ctx.getTransform(), current);

        const wc = vp.toWorldCoord(sc);
        vp.prepareContext(ctx);
        ctx.translate(wc.x, wc.y);

        fun();

        ctx.setTransform(oldTransform);
    }

    // Assumes uniform x/y scale
    withWorldScale({ctx, vp}: DrawingContext, current: Coord, fun: () => void) {

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
    withWorldAngle({ctx, vp}: DrawingContext, current: Coord, fun: () => void) {

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
    shape(): Flatten.Segment | Flatten.Point | Flatten.Polygon | Flatten.Circle | null {
        const point = this.toWorldCoord({x: 0, y: 0});
        return Flatten.point(point.x, point.y);
    }
}
