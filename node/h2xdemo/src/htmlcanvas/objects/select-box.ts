import DrawableObject from '@/htmlcanvas/lib/drawable-object';
import * as TM from 'transformation-matrix';
import {DrawingContext} from '@/htmlcanvas/lib/types';
import {Coord} from '@/store/document/types';
import Layer from '@/htmlcanvas/layers/layer';
import Flatten from '@flatten-js/core';


export default class SelectBox extends DrawableObject {
    pointA: Coord;
    pointB: Coord;

    constructor(parent: DrawableObject | null, layer: Layer, pointA: Coord, pointB: Coord) {
        super(parent, layer);
        this.pointA = pointA;
        this.pointB = pointB;
    }

    get position() {
        return TM.identity();
    }

    drawInternal(context: DrawingContext, ...args: any[]): void {
        const {ctx, vp} = context;
        ctx.fillStyle = 'rgba(50, 50, 100, 0.3)';
        ctx.lineWidth = vp.toWorldLength(1);
        ctx.fillRect(this.tl.x, this.tl.y, this.br.x - this.tl.x, this.br.y - this.tl.y);
        ctx.strokeStyle = 'rgba(50, 50, 100, 1)';
        ctx.beginPath();
        ctx.rect(this.tl.x, this.tl.y, this.br.x - this.tl.x, this.br.y - this.tl.y);
        ctx.stroke();
    }

    get tl() {
        return {x: Math.min(this.pointA.x, this.pointB.x), y: Math.min(this.pointA.y, this.pointB.y)};
    }

    get br() {
        return {x: Math.max(this.pointA.x, this.pointB.x), y: Math.max(this.pointA.y, this.pointB.y)};
    }

    inBounds(objectCoord: Coord, objectRadius?: number): boolean {
        if (objectCoord.x >= this.tl.x && objectCoord.x <= this.br.x) {
            if (objectCoord.y >= this.tl.y && objectCoord.y <= this.br.y) {
                return true;
            }
        }
        return false;
    }

    shape(): Flatten.Polygon {
        const polygon = new Flatten.Polygon();
        const tlp = Flatten.point(this.tl.x, this.tl.y);
        const trp = Flatten.point(this.br.x, this.tl.y);
        const brp = Flatten.point(this.br.x, this.br.y);
        const blp = Flatten.point(this.tl.x, this.br.y);
        polygon.addFace([
            Flatten.segment(tlp, trp),
            Flatten.segment(trp, brp),
            Flatten.segment(brp, blp),
            Flatten.segment(blp, tlp),
        ]);
        return polygon;
    }

    perimeter(): Flatten.Segment[] {
        const tr = Flatten.point(this.br.x, this.tl.y);
        const bl = Flatten.point(this.tl.x, this.br.y);

        return [
            Flatten.segment(Flatten.point(this.tl.x, this.tl.y), tr),
            Flatten.segment(tr, Flatten.point(this.br.x, this.br.y)),
            Flatten.segment(Flatten.point(this.br.x, this.br.y), bl),
            Flatten.segment(bl, Flatten.point(this.tl.x, this.tl.y)),
        ];
    }

    // Unfortunately, flatten-js doesn't support contains checking for polygons.
    pointInside(point: Flatten.Point, padding: number = 0) {
        if (point.x - padding >= this.tl.x && point.x + padding <= this.br.x) {
            if (point.y - padding >= this.tl.y && point.y + padding <= this.br.y) {
                return true;
            }
        }
        return false;
    }

    contains(shape: Flatten.Shape) {
        if (shape instanceof Flatten.Polygon) {
            let allInside = true;
            shape.edges.forEach((s: Flatten.Segment) => {
                if (allInside && (!this.pointInside(s.start) || !this.pointInside(s.end))) {
                    allInside = false;
                }
            });
            return allInside;
        } else if (shape instanceof Flatten.Segment) {
            return this.pointInside(shape.start) && this.pointInside(shape.end);
        } else if (shape instanceof Flatten.Circle) {
            return this.pointInside(shape.center, shape.r);
        } else if (shape instanceof Flatten.Point) {
            return this.pointInside(shape);
        } else {
            throw new Error('Unknown shape type');
        }
    }

    inSelection(objects: DrawableObject[]): DrawableObject[] {
        const ret = objects.filter((o) => {
            if (o.selectable === false) {
                return false;
            }
            if (this.pointB.x > this.pointA.x) {
                // full inclusive

                const os = o.shape();
                if (os) {
                    return this.contains(os);
                }

            } else {
                // inclusive or touching

                const os = o.shape();
                if (os) {
                    if (this.contains(os)) {
                        return true;
                    }

                    return this.perimeter().filter((p) => {
                        return p.intersect(os).length > 0;
                    }).length !== 0;
                }
            }
            return false;
        });
        return ret;
    }
}
