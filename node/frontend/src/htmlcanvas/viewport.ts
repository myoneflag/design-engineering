import { Matrix } from "transformation-matrix";
import * as TM from "transformation-matrix";
import { scale } from "transformation-matrix/scale";
import { matrixScale, polygonsOverlap } from "../../src/htmlcanvas/utils";
import Flatten from "@flatten-js/core";
import { tm2flatten } from "../../src/htmlcanvas/lib/utils";
import { assertUnreachable } from "../../../common/src/api/config";
import { Coord } from "../../../common/src/api/document/drawing";

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

    copy(): ViewPort {
        return new ViewPort(this.position, this.width, this.height);
    }

    /**
     * Rescales with anchorX and anchorY as screen coordinates
     */
    rescale(factor: number, sx: number, sy: number) {
        const world = this.toWorldCoord({ x: sx, y: sy });
        // Move, then scale, then move again
        this.position = TM.transform(this.position, TM.scale(factor));
        const finish = this.toScreenCoord(world);
        this.position = TM.transform(this.position, TM.translate(finish.x - sx, finish.y - sy));
    }

    /**
     * Pans the given screen pixels. Note the y coordinates are inverted
     * @param dx
     * @param dy
     */
    panAbs(dx: number, dy: number) {
        this.position = TM.transform(this.position, TM.translate(dx, dy));
    }

    panToWc(point: Coord) {
        const toCenter = this.toScreenCoord(point);
        this.panAbs(toCenter.x - this.width / 2, toCenter.y - this.height / 2);
    }

    /**
     * Take a world coordinate and project to the screen
     */
    toScreenCoord(point: Coord): Coord {
        const inv: Matrix = TM.inverse(TM.transform(this.position, TM.translate(-this.width / 2, -this.height / 2)));
        return TM.applyToPoint(inv, point);
    }

    toScreenLength(worldLen: number): number {
        return worldLen / matrixScale(this.position);
    }

    toWorldLength(screenLen: number): number {
        return screenLen * matrixScale(this.position);
    }

    /**
     * Prepares the context so that drawing to it with real world coordinates will draw to screen
     * appropriately.
     *
     */
    prepareContext(ctx: CanvasRenderingContext2D, ...transform: Matrix[]) {
        const m =
            transform.length > 0
                ? TM.transform(TM.translate(this.width / 2, this.height / 2), TM.inverse(this.position), ...transform)
                : TM.transform(TM.translate(this.width / 2, this.height / 2), TM.inverse(this.position));
        ctx.setTransform(m);
    }

    get world2ScreenMatrix(): Matrix {
        return TM.transform(TM.translate(this.width / 2, this.height / 2), TM.inverse(this.position));
    }

    /**
     * Takes a screen coordinate and finds the world coordinate
     */
    toWorldCoord(point: Coord): Coord {
        return TM.applyToPoint(TM.transform(this.position, TM.translate(-this.width / 2, -this.height / 2)), point);
    }

    someOnScreen(worldShape: Flatten.Polygon | Flatten.Segment | Flatten.Point | Flatten.Circle): boolean {
        const screen = this.screenWorldShape;
        if (worldShape instanceof Flatten.Polygon) {
            return polygonsOverlap(screen, worldShape);
        } else if (worldShape instanceof Flatten.Segment) {
            return screen.contains(worldShape) || screen.intersect(worldShape).length > 0;
        } else if (worldShape instanceof Flatten.Point) {
            return screen.contains(worldShape);
        } else if (worldShape instanceof Flatten.Circle) {
            return screen.contains(worldShape.center); // TODO: boundaries if we really need dat
        } else {
            throw new Error("unknown shape");
        }
    }

    get screenWorldShape(): Flatten.Polygon {
        const screenBox = new Flatten.Box(0, 0, this.width, this.height);
        let p = new Flatten.Polygon();
        p.addFace(screenBox);
        p = p.transform(tm2flatten(TM.inverse(this.world2ScreenMatrix)));
        return p;
    }
}
