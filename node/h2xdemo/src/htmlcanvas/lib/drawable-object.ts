import {Coord} from '@/store/document/types';
import {ViewPort} from '@/htmlcanvas/viewport';
import {Matrix} from 'transformation-matrix';
import * as TM from 'transformation-matrix';
import {MouseMoveResult} from '@/htmlcanvas/types';
import {matrixScale} from '@/htmlcanvas/utils';

export default abstract class DrawableObject {
    abstract position: Matrix;
    parent: DrawableObject | null; // null parents mean root objects

    protected constructor(parent: DrawableObject | null) {
        this.parent = parent;
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

    toParentLength(object: number): number {
        return matrixScale(this.position) * object;
    }

    toWorldLength(object: number): number {
        if (this.parent == null) {
            return this.toParentLength(object);
        }
        return this.parent.toWorldLength(this.toParentLength(object));
    }

    abstract drawInternal(ctx: CanvasRenderingContext2D, vp: ViewPort, ...args: any[]): void;

    draw(ctx: CanvasRenderingContext2D, vp: ViewPort, ...args: any[]) {
        // get parent positions
        const transforms: Matrix[] = [this.position];
        let parent = this.parent;
        while (parent != null) {
            transforms.unshift(parent.position);
            parent = parent.parent;
        }

        vp.prepareContext(ctx, ...transforms);

        this.drawInternal(ctx, vp, ...args);
    }

    abstract inBounds(objectCoord: Coord): boolean;

    abstract onMouseDown(event: MouseEvent, vp: ViewPort): boolean;

    abstract onMouseMove(event: MouseEvent, vp: ViewPort): MouseMoveResult;

    abstract onMouseUp(event: MouseEvent, vp: ViewPort): boolean;
}
