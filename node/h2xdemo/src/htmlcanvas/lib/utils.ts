import CanvasContext from '@/htmlcanvas/lib/canvas-context';
import {Coord, DocumentState, DrawableEntity} from '@/store/document/types';
import * as _ from 'lodash';
import {ObjectStore} from '@/htmlcanvas/lib/types';
import doc = Mocha.reporters.doc;
import * as webpack from 'webpack';
import numberToIdentifer = webpack.Template.numberToIdentifer;
import {cloneSimple} from '@/lib/utils';
import {ConnectableEntityConcrete} from '@/store/document/entities/concrete-entity';
import {EntityType} from '@/store/document/entities/types';


export function getInsertCoordsAt(context: CanvasContext, wc: Coord): [string | null, Coord] {
    const floor = context.backgroundLayer.getBackgroundAt(wc, context.objectStore);
    let parentUid: string | null = null;
    let oc = cloneSimple(wc);
    if (floor != null) {
        parentUid = floor.entity.uid;
        oc = floor.toObjectCoord(wc);
    }
    return [parentUid, oc];
}

export function getBoundingBox(objectStore: ObjectStore, document: DocumentState) {
    let l = Infinity;
    let r = -Infinity;
    let t = Infinity;
    let b = -Infinity;

    const look = (e: DrawableEntity) => {
        const obj = objectStore.get(e.uid);
        if (obj) {
            const bb = obj.shape();
            if (bb) {
                l = Math.min(l, bb.box.xmin);
                r = Math.max(r, bb.box.xmax);
                t = Math.min(t, bb.box.ymin);
                b = Math.max(b, bb.box.ymax);
            }
        }
    };

    document.drawing.backgrounds.forEach(look);
    document.drawing.entities.forEach(look);

    return {l, r, t, b};
}

export function getDocumentCenter(objectStore: ObjectStore, document: DocumentState): Coord {
    const {l, r, t, b} = getBoundingBox(objectStore, document);
    return {x: (l + r) / 2, y: (t + b) / 2};
}

export function resolveProperty(prop: string, obj: any): any {
    if (prop.indexOf('.') === -1) {
        return obj[prop];
    }

    return resolveProperty(
        prop.split('.').splice(1).join('.'),
        obj[prop.split('.')[0]],
    );
}

export function parseCatalogNumberOrMin(str: string | number | null): number | null {
    if (typeof str === 'number') {
        return str;
    }
    if (str === null) {
        return null;
    }
    if (str.indexOf('-') !== -1) {
        const arr = str.split('-');
        if (arr.length > 2) {
            throw new Error('Dunno');
        }
        const n = Number(str.split('-')[0]);
        return isNaN(n) ? null : n;
    } else {
        const n = Number(str);
        return isNaN(n) ? null : n;
    }
}

export function parseCatalogNumberOrMax(str: string | number | null): number | null {
    if (typeof str === 'number') {
        return str;
    }
    if (str === null) {
        return null;
    }
    if (str.indexOf('-') !== -1) {
        const arr = str.split('-');
        if (arr.length > 2) {
            throw new Error('Dunno');
        }
        const n = Number(str.split('-')[1]);
        return isNaN(n) ? null : n;
    } else {
        const n = Number(str);
        return isNaN(n) ? null : n;
    }
}

export function parseCatalogNumberExact(str: string | number | null): number | null {
    if (typeof str === 'number') {
        return str;
    }
    if (str === null) {
        return null;
    }
    const n = Number(str);
    return isNaN(n) ? null : n;
}

export function interpolateTable<T>(
    table: {[key: string]: string | number},
    index: number,
    strict?: boolean,
): number | null;

export function interpolateTable<T>(
    table: {[key: string]: T},
    index: number,
    strict: boolean,
    fn: (entry: T) => string | number,
): number | null;

// assumes keys in table are non overlapping
export function interpolateTable<T>(
    table: {[key: string]: T},
    index: number,
    strict: boolean = false,
    fn?: (entry: T) => string | number,
): number | null {
    let lowKey = -Infinity;
    let highKey = Infinity;
    let lowValue = null;
    let highValue = null;

    for (const key of Object.keys(table)) {
        const min = parseCatalogNumberOrMin(key);
        const max = parseCatalogNumberOrMax(key);
        const value = fn ? parseCatalogNumberExact(fn(table[key])) : parseCatalogNumberExact(table[key] as any);
        if (value !== null) {
            if (min !== null && max !== null) {
                if (index >= min && index <= max) {
                    if (value !== null) {
                        return value;
                    }
                } else {
                    if (min > index && min < highKey) {
                        highKey = min;
                        highValue = value;
                    }
                    if (max < index && max >= lowKey) {
                        lowKey = max;
                        lowValue = value;
                    }
                }
            } else {
                throw new Error('table key not a number or range');
            }
        } else {
            throw new Error('table value not a number, cannot interpolate');
        }
    }

    if (lowValue === null) {
        if (highValue !== null) {
            return strict ? null : highValue;
        } else {
            return null;
        }
    } else if (highValue === null) {
        if (lowValue !== null) {
            return strict ? null : lowValue;
        } else {
            return null;
        }
    }

    const lw = (highKey - index) / (highKey - lowKey);
    const hw = (index - lowKey) / (highKey - lowKey);
    return lw * lowValue + hw * highValue;
}

// assumes keys in table are non overlapping
export function lowerBoundTable<T>(table: {[key: string]: T}, index: number, getVal?: (t: T) => number): T | null {
    let highKey = Infinity;
    let highValue: T | null = null;

    for (const key of Object.keys(table)) {
        const min = getVal ? getVal(table[key]) : parseCatalogNumberOrMin(key);
        const max = getVal ? getVal(table[key]) : parseCatalogNumberOrMax(key);
        const value = table[key];

        if (min === null || max === null) {
            throw new Error('key is not a number');
        }

        if (min <= index && max >= index) {
            return value;
        }

        if (min < highKey && min > index) {
            highKey = min;
            highValue = value;
        }
    }

    return highValue;
}

// assumes keys in table are non overlapping
export function upperBoundTable<T>(table: {[key: string]: T}, index: number, getVal?: (t: T) => number): T | null {
    let lowKey = -Infinity;
    let lowValue: T | null = null;

    for (const key of Object.keys(table)) {
        const min = getVal ? getVal(table[key]) : parseCatalogNumberOrMin(key);
        const max = getVal ? getVal(table[key]) : parseCatalogNumberOrMax(key);
        const value = table[key];

        if (min === null || max === null) {
            throw new Error('key is not a number');
        }

        if (min <= index && max >= index) {
            return value;
        }

        if (max < index && max > lowKey) {
            lowKey = max;
            lowValue = value;
        }
    }

    return lowValue;
}

export function maxHeightOfConnection(entity: ConnectableEntityConcrete, context: CanvasContext) {
    let height = -Infinity;
    entity.connections.forEach((cuid) => {
        const o = context.objectStore.get(cuid)!;
        if (o.entity.type === EntityType.PIPE) {
            height = Math.max(o.entity.heightAboveFloorM, height);
        }
    });
    if (height !== -Infinity) {
        return height;
    }
    return null;
}

export function minHeightOfConnection(entity: ConnectableEntityConcrete, context: CanvasContext) {
    let height = Infinity;
    entity.connections.forEach((cuid) => {
        const o = context.objectStore.get(cuid)!;
        if (o.entity.type === EntityType.PIPE) {
            height = Math.min(o.entity.heightAboveFloorM, height);
        }
    });
    if (height !== Infinity) {
        return height;
    }
    return null;
}
