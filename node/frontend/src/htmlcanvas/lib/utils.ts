import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import { DocumentState } from "../../../src/store/document/types";
import { DrawingContext } from "../../../src/htmlcanvas/lib/types";
import {
    ConnectableEntityConcrete,
    DrawableEntityConcrete,
    EdgeLikeEntity
} from "../../../../common/src/api/document/entities/concrete-entity";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import { SystemNodeEntity } from "../../../../common/src/api/document/entities/big-valve/big-valve-entity";
import { fillFixtureFields } from "../../../../common/src/api/document/entities/fixtures/fixture-entity";
import * as TM from "transformation-matrix";
import Flatten from "@flatten-js/core";
import RiserEntity from "../../../../common/src/api/document/entities/riser-entity";
import { CalculationContext } from "../../calculations/types";
import { ValveType } from "../../../../common/src/api/document/entities/directed-valves/valve-types";
import { getFluidDensityOfSystem, kpa2head } from "../../calculations/pressure-drops";
import { GlobalStore } from "./global-store";
import { assertUnreachable, LEVEL_HEIGHT_DIFF_M } from "../../../../common/src/api/config";
import { Coord, DrawableEntity, DrawingState, Level } from "../../../../common/src/api/document/drawing";
import { cloneSimple, interpolateTable, upperBoundTable } from "../../../../common/src/lib/utils";
import PlantEntity, { fillPlantDefaults } from "../../../../common/src/api/document/entities/plants/plant-entity";
import { PlantType, PressureMethod } from "../../../../common/src/api/document/entities/plants/plant-types";

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

export function getVisibleBoundingBox(globalStore: GlobalStore, document: DocumentState) {
    let l = Infinity;
    let r = -Infinity;
    let t = Infinity;
    let b = -Infinity;

    const look = (e: DrawableEntity) => {
        const obj = globalStore.get(e.uid);
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

    return { l, r, t, b };
}

export function getDocumentCenter(globalStore: GlobalStore, document: DocumentState): Coord {
    const { l, r, t, b } = getVisibleBoundingBox(globalStore, document);
    return { x: (l + r) / 2, y: (t + b) / 2 };
}

export function resolveProperty(prop: string, obj: any): any {
    if (prop.indexOf(".") === -1) {
        return obj[prop];
    }

    return resolveProperty(
        prop
            .split(".")
            .splice(1)
            .join("."),
        obj[prop.split(".")[0]]
    );
}

export function getEdgeLikeHeightAboveFloorM(entity: EdgeLikeEntity, context: CalculationContext): number {
    switch (entity.type) {
        case EntityType.FIXTURE:
            const fe = fillFixtureFields(context.drawing, context.catalog, entity);
            return fe.outletAboveFloorM!;
        case EntityType.PLANT:
        case EntityType.BIG_VALVE:
        case EntityType.PIPE:
            return entity.heightAboveFloorM;
    }
    assertUnreachable(entity);
}

export function getEdgeLikeHeightAboveGroundM(entity: EdgeLikeEntity, context: CalculationContext): number {
    return getEdgeLikeHeightAboveFloorM(entity, context) + getFloorHeight(context.globalStore, context.doc, entity);
}

export function getFloorHeight(globalStore: GlobalStore, doc: DocumentState, entity: DrawableEntityConcrete) {
    const levelUid = globalStore.levelOfEntity.get(entity.uid);
    if (levelUid === null) {
        return 0;
    } else if (levelUid === undefined) {
        throw new Error("entity has no level");
    } else {
        return doc.drawing.levels[levelUid].floorHeightM;
    }
}

export function getSystemNodeHeightM(entity: SystemNodeEntity, context: CanvasContext): number {
    const po = context.globalStore.get(entity.parentUid!)!;
    return getEdgeLikeHeightAboveFloorM(po.entity as EdgeLikeEntity, {
        drawing: context.document.drawing,
        catalog: context.effectiveCatalog,
        doc: context.document,
        globalStore: context.globalStore
    });
}

export function maxHeightOfConnection(entity: ConnectableEntityConcrete, context: CanvasContext) {
    let height = -Infinity;
    if (entity.type === EntityType.SYSTEM_NODE) {
        height = getSystemNodeHeightM(entity, context);
    } else if (entity.type === EntityType.FLOW_SOURCE) {
        if (entity.heightAboveGroundM !== null) {
            height = entity.heightAboveGroundM - getFloorHeight(context.globalStore, context.document, entity);
        }
    }

    context.globalStore.getConnections(entity.uid).forEach((cuid) => {
        const o = context.globalStore.get(cuid)!;
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
    context.globalStore.getConnections(entity.uid).forEach((cuid) => {
        const o = context.globalStore.get(cuid)!;
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
    if (level == null) {
        return false; // this shouldn't really be a case.
    }
    if (riser.bottomHeightM === null && riser.topHeightM === null) {
        return true;
    } else if (riser.bottomHeightM === null) {
        return riser.topHeightM! >= level.floorHeightM;
    } else if (riser.topHeightM === null) {
        const i = sortedLevels.findIndex((l) => l.uid === level.uid);
        const roofheight = i ? sortedLevels[i - 1].floorHeightM : level.floorHeightM + LEVEL_HEIGHT_DIFF_M;
        return riser.bottomHeightM! < roofheight;
    } else {
        if (riser.topHeightM >= level.floorHeightM) {
            const i = sortedLevels.findIndex((l) => l.uid === level.uid);
            const roofheight = i ? sortedLevels[i - 1].floorHeightM : level.floorHeightM + LEVEL_HEIGHT_DIFF_M;
            return riser.bottomHeightM < roofheight;
        }
        return false;
    }
}

export function getRpzdHeadLoss(
    context: CalculationContext,
    catalogId: string,
    size: number,
    flowLS: number,
    systemUid: string,
    type: ValveType.RPZD_SINGLE | ValveType.RPZD_DOUBLE_SHARED | ValveType.RPZD_DOUBLE_ISOLATED,
    isolateOneWhenCalculatingHeadLoss: boolean = false
) {
    const rpzdEntry = upperBoundTable(context.catalog.backflowValves[catalogId].valvesBySize, size);
    if (!rpzdEntry) {
        return null;
    }

    if (type === ValveType.RPZD_DOUBLE_SHARED) {
        flowLS /= 2;
    } else if (type === ValveType.RPZD_DOUBLE_ISOLATED && !isolateOneWhenCalculatingHeadLoss) {
        flowLS /= 2;
    }

    const plKPA = interpolateTable(rpzdEntry.pressureLossKPAByFlowRateLS, flowLS, true);
    if (plKPA === null) {
        console.log('flow rate not found on pressure loss table: ' + flowLS + ' ' + size);
        return null;
    }

    if (systemUid === undefined) {
        return null;
    }
    const density = getFluidDensityOfSystem(systemUid, context.doc, context.catalog);
    if (density === null) {
        return null;
    }

    return kpa2head(plKPA, density, context.doc.drawing.metadata.calculationParams.gravitationalAcceleration);
}

export const VALVE_HEIGHT_MM = 70;

export const VALVE_LINE_WIDTH_MM = 10;

export const VALVE_SIZE_MM = 98;

export function drawRpzdDouble(context: DrawingContext, colors: [string, string], selected: boolean = false) {
    const s = context.vp.currToSurfaceScale(context.ctx);
    const baseWidth = Math.max(2.0 / s, VALVE_LINE_WIDTH_MM / context.vp.surfaceToWorldLength(1));
    const ctx = context.ctx;
    ctx.lineWidth = baseWidth;

    ctx.fillStyle = "#ffffff";
    if (selected) {
        ctx.fillStyle = "rgba(100, 100, 255, 0.2)";
    }

    ctx.fillRect(-VALVE_HEIGHT_MM * 1.3, -VALVE_HEIGHT_MM * 2.3, VALVE_HEIGHT_MM * 2.6, VALVE_HEIGHT_MM * 4.6);

    if (colors[0] !== colors[1]) {
        ctx.strokeStyle = "#444444";
    }

    ctx.beginPath();
    ctx.rect(-VALVE_HEIGHT_MM * 1.3, -VALVE_HEIGHT_MM * 2.3, VALVE_HEIGHT_MM * 2.6, VALVE_HEIGHT_MM * 4.6);
    ctx.stroke();

    let i = 0;
    for (let off = -VALVE_HEIGHT_MM; off <= VALVE_HEIGHT_MM; off += VALVE_HEIGHT_MM * 2) {
        ctx.fillStyle = colors[i];
        i++;
        ctx.beginPath();
        ctx.moveTo(-VALVE_HEIGHT_MM, -VALVE_SIZE_MM / 2 + off);
        ctx.lineTo(-VALVE_HEIGHT_MM, VALVE_SIZE_MM / 2 + off);
        ctx.lineTo(VALVE_HEIGHT_MM, 0 + off);
        ctx.closePath();
        ctx.fill();
    }
}

export function getPlantPressureLossKPA(entity: PlantEntity, drawing: DrawingState, pressureKPA: number | null) {
    const filled = fillPlantDefaults(entity, drawing);

    if (filled.plant.type !== PlantType.RETURN_SYSTEM) {
        switch (filled.plant.pressureLoss.pressureMethod) {
            case PressureMethod.PUMP_DUTY:
                return -filled.plant.pressureLoss.pumpPressureKPA!;
            case PressureMethod.FIXED_PRESSURE_LOSS:
                return filled.plant.pressureLoss.pressureLossKPA!;
            case PressureMethod.STATIC_PRESSURE:
                if (pressureKPA !== null) {
                    return (pressureKPA - filled.plant.pressureLoss.staticPressureKPA!)!;
                } else {
                    return null;
                }
        }
    }

    return 0;
}
