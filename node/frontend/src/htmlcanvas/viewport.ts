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
    surfaceToWorld: Matrix;
    width: number;
    height: number;
    screenScale: number;

    constructor(position: Matrix, width: number, height: number, screenScale: number = 1) {
        this.width = width;
        this.height = height;
        this.surfaceToWorld = TM.transform(position);
        this.screenScale = screenScale;
    }

    get screenToSurface() {
        return TM.transform(TM.scale(this.screenScale), TM.translate( -this.width / 2, -this.height / 2));
    }

    copy(): ViewPort {
        return new ViewPort(this.surfaceToWorld, this.width, this.height, this.screenScale);
    }

    /**
     * Rescales with anchorX and anchorY as screen coordinates
     * Only works if screenToSurface is original scale (lol) but there's currently no use case for otherwise.
     */
    rescale(factor: number, sx: number, sy: number) {
        const world = this.toWorldCoord({ x: sx, y: sy });
        // Move, then scale, then move again
        this.surfaceToWorld = TM.transform(this.surfaceToWorld, TM.scale(factor));
        const world2 = this.toWorldCoord({ x: sx, y: sy });
        this.surfaceToWorld = TM.transform(TM.translate(-(world2.x - world.x), -(world2.y - world.y)), this.surfaceToWorld);
    }

    /**
     * Pans the given screen pixels. Note the y coordinates are inverted
     * @param dx
     * @param dy
     */
    panAbs(dsx: number, dsy: number) {
        const world1 = this.toWorldCoord({x: 0, y: 0});
        const world2 = this.toWorldCoord({x: dsx, y: dsy});

        this.surfaceToWorld = TM.transform(TM.translate(world2.x - world1.x, world2.y - world1.y), this.surfaceToWorld);
    }

    panToWc(point: Coord) {
        const toCenter = TM.applyToPoint(TM.inverse(this.surfaceToWorld), point);
        this.panAbs(toCenter.x, toCenter.y);
    }

    /**
     * Take a world coordinate and project to the screen
     */
    toScreenCoord(world: Coord): Coord {
        const inv: Matrix = TM.inverse(TM.transform(this.surfaceToWorld, this.screenToSurface));
        return TM.applyToPoint(inv, world);
    }

    toSurfaceCoord(world: Coord): Coord {
        const inv: Matrix = TM.inverse(TM.transform(this.surfaceToWorld));
        return TM.applyToPoint(inv, world);
    }

    toScreenLength(worldLen: number): number {
        return worldLen / matrixScale(this.surfaceToWorld) / matrixScale(this.screenToSurface);
    }

    toSurfaceLength(worldLen: number): number {
        return worldLen / matrixScale(this.surfaceToWorld);
    }

    surfaceToWorldLength(surfaceLen: number): number {
        return surfaceLen * matrixScale(this.surfaceToWorld);
    }

    toWorldLength(screenLen: number): number {
        return screenLen * matrixScale(this.screenToSurface) * matrixScale(this.surfaceToWorld);
    }

    /**
     * Prepares the context so that drawing to it with real world coordinates will draw to screen
     * appropriately.
     *
     */
    prepareContext(ctx: CanvasRenderingContext2D, ...transform: Matrix[]) {
        const m =
            transform.length > 0
                ? TM.transform(TM.inverse(this.screenToSurface), TM.inverse(this.surfaceToWorld), ...transform)
                : TM.transform(TM.inverse(this.screenToSurface), TM.inverse(this.surfaceToWorld));
        console.log('preparing context, m scale: ' + matrixScale(m));
        ctx.setTransform(m);
    }

    get world2ScreenMatrix(): Matrix {
        return TM.transform(TM.inverse(this.screenToSurface), TM.inverse(this.surfaceToWorld));
    }

    get screen2worldMatrix(): Matrix {
        return TM.transform(this.surfaceToWorld, this.screenToSurface);
    }

    /**
     * Takes a screen coordinate and finds the world coordinate
     */
    toWorldCoord(screen: Coord): Coord {
        return TM.applyToPoint(TM.transform(this.surfaceToWorld, this.screenToSurface), screen);
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

    currToScreenScale(ctx: CanvasRenderingContext2D): number {
        return matrixScale(this.currToScreenTransform(ctx));
    }

    currToSurfaceScale(ctx: CanvasRenderingContext2D): number {
        return matrixScale(this.currToSurfaceTransform(ctx));
    }

    currToScreenTransform(ctx: CanvasRenderingContext2D): Matrix {
        return ctx.getTransform();
    }

    currToSurfaceTransform(ctx: CanvasRenderingContext2D) {
        return TM.transform(ctx.getTransform(), this.screenToSurface);
    }

    resetCtxTransformToScreen(ctx: CanvasRenderingContext2D) {
        ctx.resetTransform();
    }
}
