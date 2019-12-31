import CanvasContext from '../../../src/htmlcanvas/lib/canvas-context';
import {Coord, DocumentState, DrawableEntity, Level} from '../../../src/store/document/types';
import {GlobalStore, ObjectStore} from '../../../src/htmlcanvas/lib/types';
import {cloneSimple} from '../../../src/lib/utils';
import {
    ConnectableEntityConcrete,
    DrawableEntityConcrete,
    EdgeLikeEntity
} from '../../../src/store/document/entities/concrete-entity';
import {EntityType} from '../../../src/store/document/entities/types';
import {SystemNodeEntity} from '../../store/document/entities/big-valve/big-valve-entity';
import {fillFixtureFields} from '../../../src/store/document/entities/fixtures/fixture-entity';
import * as TM from 'transformation-matrix';
import Flatten from '@flatten-js/core';
import RiserEntity from "../../store/document/entities/riser-entity";
import {LEVEL_HEIGHT_DIFF_M} from "../../lib/types";
import {assertUnreachable} from "../../config";
import {CalculationContext} from "../../calculations/types";
import {ValveType} from "../../store/document/entities/directed-valves/valve-types";
import {getFluidDensityOfSystem, kpa2head} from "../../calculations/pressure-drops";


export function getInsertCoordsAt(context: CanvasContext, wc: Coord): [string | null, Coord] {
    const floor = context.backgroundLayer.getBackgroundAt(wc);
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

    if (document.uiState.levelUid) {

        Object.values(document.drawing.levels[document.uiState.levelUid].entities).forEach(look);
    }


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
    fn: (entry: T) => string | number | null,
): number | null;

// assumes keys in table are non overlapping
export function interpolateTable<T>(
    table: {[key: string]: T},
    index: number,
    strict: boolean = false,
    fn?: (entry: T) => string | number | null,
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
export function lowerBoundTable<T>(
    table: {[key: string]: T},
    index: number,
    getVal?: (t: T, isMax?: boolean) => number,
): T | null {
    let highKey = Infinity;
    let highValue: T | null = null;

    for (const key of Object.keys(table)) {
        console.log('lower bound going through key ' + key);
        const min = getVal ? getVal(table[key], false) : parseCatalogNumberOrMin(key);
        const max = getVal ? getVal(table[key], true) : parseCatalogNumberOrMax(key);
        const value = table[key];

        if (min === null || max === null) {
            throw new Error('key is not a number: ' + key);
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
export function upperBoundTable<T>(
    table: {[key: string]: T},
    index: number,
    getVal?: (t: T, isMax?: boolean) => number,
): T | null {
    let lowKey = -Infinity;
    let lowValue: T | null = null;

    for (const key of Object.keys(table)) {
        const min = getVal ? getVal(table[key], false) : parseCatalogNumberOrMin(key);
        const max = getVal ? getVal(table[key], true) : parseCatalogNumberOrMax(key);
        const value = table[key];

        if (min === null || max === null) {
            throw new Error('key is not a number: ' + key);
        }

        if (min <= index && max >= index) {
            return value;
        }

        if (min <= index && Math.min(max, index) > lowKey) {
            lowKey = Math.min(max, index);
            lowValue = value;
        }
    }

    return lowValue;
}

export function getEdgeLikeHeightAboveFloorM(
    entity: EdgeLikeEntity,
    context: CalculationContext,
): number {
    switch (entity.type) {
        case EntityType.BIG_VALVE:
            return entity.heightAboveFloorM;
        case EntityType.FIXTURE:
            const fe = fillFixtureFields(context.drawing, context.catalog, entity);
            return fe.outletAboveFloorM!;
        case EntityType.PIPE:
            return entity.heightAboveFloorM;
    }
    assertUnreachable(entity);
}

export function getEdgeLikeHeightAboveGroundM(
    entity: EdgeLikeEntity,
    context: CalculationContext,
): number {
    return getEdgeLikeHeightAboveFloorM(entity, context) + getFloorHeight(context.globalStore, context.doc, entity);
}

export function getFloorHeight(globalStore: GlobalStore, doc: DocumentState, entity: DrawableEntityConcrete) {
    const levelUid = globalStore.levelOfEntity.get(entity.uid);
    if (levelUid === null) {
        return 0;
    } else if (levelUid === undefined) {
        throw new Error('entity has no level');
    } else {
        return doc.drawing.levels[levelUid].floorHeightM;
    }
}

export function getSystemNodeHeightM(entity: SystemNodeEntity, context: CanvasContext): number {
    const po = context.objectStore.get(entity.parentUid!)!;
    return getEdgeLikeHeightAboveFloorM(
        po.entity as EdgeLikeEntity,
        {
            drawing: context.document.drawing,
            catalog: context.effectiveCatalog,
            doc: context.document,
            globalStore: context.globalStore,
        },
    );
}

export function maxHeightOfConnection(entity: ConnectableEntityConcrete, context: CanvasContext) {
    let height = -Infinity;
    if (entity.type === EntityType.SYSTEM_NODE) {
        height = getSystemNodeHeightM(entity, context);
    }

    context.objectStore.getConnections(entity.uid).forEach((cuid) => {
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
    if (entity.type === EntityType.SYSTEM_NODE) {
        height = getSystemNodeHeightM(entity, context);
    }
    context.objectStore.getConnections(entity.uid).forEach((cuid) => {
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

export function tm2flatten(m: TM.Matrix): Flatten.Matrix {
    return new Flatten.Matrix(m.a, m.b, m.c, m.d, m.e, m.f);
}

export function levelIncludesRiser(level: Level, riser: RiserEntity, sortedLevels: Level[]): boolean {
    if (riser.bottomHeightM === null && riser.topHeightM === null) {
        return true;
    } else if (riser.bottomHeightM === null) {
        return riser.topHeightM! >= level.floorHeightM;
    } else if (riser.topHeightM === null) {
        const i = sortedLevels.findIndex((l) => l.uid === level.uid);
        const roofheight = i > 0 ? sortedLevels[i-1].floorHeightM : level.floorHeightM + LEVEL_HEIGHT_DIFF_M;
        return riser.bottomHeightM! <= roofheight;
    } else {
        if (riser.topHeightM >= level.floorHeightM) {
            return true;
        }

        const i = sortedLevels.findIndex((l) => l.uid === level.uid);
        const roofheight = i > 0 ? sortedLevels[i-1].floorHeightM : level.floorHeightM + LEVEL_HEIGHT_DIFF_M;
        return riser.bottomHeightM <= roofheight;
    }
}

export function getRpzdHeadLoss(
    context: CalculationContext,
    catalogId: string,
    size: number,
    flowLS: number,
    systemUid: string,
    type: ValveType.RPZD_SINGLE | ValveType.RPZD_DOUBLE_SHARED | ValveType.RPZD_DOUBLE_ISOLATED,
    isolateOneWhenCalculatingHeadLoss: boolean = false,
) {

    const rpzdEntry =
        upperBoundTable(context.catalog.backflowValves[catalogId].valvesBySize, size);
    if (!rpzdEntry) {
        console.log('no entry');
        return null;
    }

    if (type === ValveType.RPZD_DOUBLE_SHARED) {
        flowLS /= 2;
    } else if (type === ValveType.RPZD_DOUBLE_ISOLATED &&
        !isolateOneWhenCalculatingHeadLoss
    ) {
        flowLS /= 2;
    }

    const plKPA = interpolateTable(rpzdEntry.pressureLossKPAByFlowRateLS, flowLS, true);
    if (plKPA === null) {
        console.log('no plKPA');
        return null;
    }

    if (systemUid === undefined) {
        console.log('no systemUID');
        return null;
    }
    const density = getFluidDensityOfSystem(systemUid, context.doc, context.catalog);
    if (density === null) {
        console.log('no density');
        return null;
    }

    return kpa2head(
        plKPA,
        density,
        context.doc.drawing.metadata.calculationParams.gravitationalAcceleration,
    );
}
