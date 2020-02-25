import Flatten from "@flatten-js/core";
import { polygonOverlapsShapeApprox, polygonsOverlap } from "../utils";
import { BoxableShape } from "./drawable-object";

/**
 * This class quickly allocates and queries spaces on screen for rendering non-overlapping and fluid items.
 */
export default class LayoutAllocator<T> {
    cache = new Map<number, Map<number, Array<[BoxableShape, number, T | null]>>>();
    resolution: number;
    result: T[] = [];

    constructor(resolution: number) {
        this.resolution = resolution;
    }

    toKey(coord: number) {
        return Math.floor(coord / this.resolution);
    }

    getOrInit(x: number, y: number): Array<[BoxableShape, number, T | null]> {
        const xK = this.toKey(x);
        const yK = this.toKey(y);
        return this.getOrInitK(xK, yK);
    }

    getOrInitK(xK: number, yK: number): Array<[BoxableShape, number, T | null]> {
        if (!this.cache.has(xK)) {
            this.cache.set(xK, new Map<number, Array<[BoxableShape, number, T | null]>>());
        }
        if (!this.cache.get(xK)!.has(yK)) {
            this.cache.get(xK)!.set(yK, []);
        }
        return this.cache.get(xK)!.get(yK)!;
    }

    getBoxes(shape: BoxableShape) {
        const box = shape.box;
        const l = this.toKey(box.xmin);
        const r = this.toKey(box.xmax);
        const t = this.toKey(box.ymin);
        const b = this.toKey(box.ymax);

        const res: Array<Array<[BoxableShape, number, T | null]>> = [];

        for (let x = l; x <= r; x++) {
            for (let y = t; y <= b; y++) {
                res.push(this.getOrInitK(x, y));
            }
        }

        return res;
    }

    canPlace(shape: Flatten.Polygon): boolean {
        const checked = new Set<number>();
        for (const record of this.getBoxes(shape).flat()) {
            if (checked.has(record[1])) {
                continue;
            }

            if (polygonOverlapsShapeApprox(shape, record[0])) {
                return false;
            }

            checked.add(record[1]);
        }

        return true;
    }

    place(shape: BoxableShape, value: T) {
        const box = shape.box;
        const l = this.toKey(box.xmin);
        const r = this.toKey(box.xmax);
        const t = this.toKey(box.ymin);
        const b = this.toKey(box.ymax);

        this.getBoxes(shape).forEach((a) => {
            // cheap optimization
            // if (a.length < 20) {
            a.push([shape, a.length, value]);
            // }
        });

        this.result.push(value);
    }

    placeBlock(shape: BoxableShape) {
        this.getBoxes(shape).forEach((a) => {
            if (a.length < 2) {
                a.push([shape, -a.length - 1, null]);
            }
        });
    }

    tryPlace(shape: Flatten.Polygon, position: T): boolean {
        if (this.canPlace(shape)) {
            this.place(shape, position);
            return true;
        }
        return false;
    }

    getLabels(): T[] {
        return this.result;
    }
}
