import {Matrix} from 'transformation-matrix';
import * as TM from 'transformation-matrix';
import {Coord} from '@/store/document/types';
import assert from 'assert';
import {decomposeMatrix} from '@/htmlcanvas/utils';

export const EPS = 1e-5;

/*
 * A transformation specifically for the screen, with a center co-ordinate, rotation, and scale.
 */
export class ViewPort {
    position: Matrix;
    width: number;
    height: number;

    constructor(position: Matrix, width: number, height: number) {
        this.width = width;
        this.height = height;
        this.position = TM.transform(position);
    }

    /**
     * Rescales with anchorX and anchorY as screen coordinates
     */
    rescale(factor: number, sx: number, sy: number) {
        const world = this.toWorldCoord({x: sx, y: sy});
        // Move, then scale, then move again
        this.position = TM.transform(
            this.position,
            TM.scale(factor),
        );
        const finish = this.toScreenCoord(world);
        this.position = TM.transform(
            this.position,
            TM.translate(finish.x - sx, finish.y - sy),
        )
    }

    /**
     * Pans the given screen pixels. Note the y coordinates are inverted
     * @param dx
     * @param dy
     */
    panAbs(dx: number, dy: number) {
        this.position = TM.transform(this.position, TM.translate(dx, dy));
    }

    /**
     * Take a world coordinate and project to the screen
     * @param x
     * @param y
     */
    toScreenCoord(point: Coord): Coord {
        const inv: Matrix = TM.inverse(TM.transform(this.position, TM.translate(-this.width / 2, -this.height / 2)));
        return TM.applyToPoint(inv, point);
    }

    toScreenLength(len: number) {
        const t = decomposeMatrix(this.position);
        assert(Math.abs(t.sx - t.sy) < EPS);
        return len / t.sx;
    }

    /**
     * Prepares the context so that drawing to it with real world coordinates will draw to screen
     * appropriately.
     *
     *
     */
    prepareContext(ctx: CanvasRenderingContext2D, ...transform: Matrix[]) {
        console.log(JSON.stringify(this.position) + " " + JSON.stringify(transform));


        transform.forEach((t) => {
            console.log("applying transform: " + JSON.stringify(t));
        });

        const m = (transform.length > 0 ?
                        TM.transform(TM.translate(this.width / 2, this.height / 2), TM.inverse(this.position), ...transform)
                        : TM.transform(TM.translate(this.width / 2, this.height / 2), TM.inverse(this.position))
        );

        console.log("Preparing context to matrix with transforms: " + JSON.stringify(decomposeMatrix(m)));
        ctx.setTransform(m);
    }

    /**
     * Takes a screen coordinate and finds the world coordinate
     * @param x
     * @param y
     */
    toWorldCoord(point: Coord): Coord {
        return TM.applyToPoint(TM.transform(this.position, TM.translate(-this.width / 2, -this.height / 2)), point);
    }
}
