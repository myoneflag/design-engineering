import {Coord, Dimensions, Rectangle} from '@/store/document/types';
import {ViewPort} from '@/htmlcanvas/viewport';
import {Matrix} from 'transformation-matrix';
import * as TM from 'transformation-matrix';

export default abstract class DrawableObject {
    position!: Matrix;
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

    toParentCoord(object: Coord): Coord {
        return TM.applyToPoint(this.position, object);
    }

    toWorldCoord(object: Coord): Coord {
        if (this.parent == null) {
            return TM.applyToPoint(this.position, object);
        }
        return this.parent.toWorldCoord(this.toParentCoord(object));
    }

    abstract drawInternal(ctx: CanvasRenderingContext2D, ...args: any[]): void;

    draw(ctx: CanvasRenderingContext2D, vp: ViewPort, ...args: any[]) {
        // get parent positions
        const transforms: Matrix[] = [this.position];
        let parent = this.parent;
        while (parent != null) {
            transforms.unshift(parent.position);
            parent = parent.parent;
        }

        vp.prepareContext(ctx, ...transforms);

        this.drawInternal(ctx, ...args);
    }
}
