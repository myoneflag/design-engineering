import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import { DocumentState } from "../../../src/store/document/types";
import { DrawingContext } from "../../../src/htmlcanvas/lib/types";
import {
    ConnectableEntityConcrete,
    DrawableEntityConcrete,
    EdgeLikeEntity
} from "../../../../common/src/api/document/entities/concrete-entity";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import {
    makeBigValveFields,
    SystemNodeEntity
} from "../../../../common/src/api/document/entities/big-valve/big-valve-entity";
import {
    fillFixtureFields,
    makeFixtureFields
} from "../../../../common/src/api/document/entities/fixtures/fixture-entity";
import * as TM from "transformation-matrix";
import Flatten from "@flatten-js/core";
import RiserEntity, { makeRiserFields } from "../../../../common/src/api/document/entities/riser-entity";
import { CalculationContext } from "../../calculations/types";
import { ValveType } from "../../../../common/src/api/document/entities/directed-valves/valve-types";
import { getFluidDensityOfSystem, kpa2head } from "../../calculations/pressure-drops";
import { GlobalStore } from "./global-store";
import {
    assertUnreachable,
    isDrainage, isGas,
    LEVEL_HEIGHT_DIFF_M,
    StandardFlowSystemUids
} from "../../../../common/src/api/config";
import { Color, COLORS, Coord, DrawableEntity, DrawingState, Level, SelectedMaterialManufacturer } from "../../../../common/src/api/document/drawing";
import { cloneSimple, EPS, interpolateTable, upperBoundTable } from "../../../../common/src/lib/utils";
import PlantEntity, {
    fillPlantDefaults,
    makePlantEntityFields
} from "../../../../common/src/api/document/entities/plants/plant-entity";
import { PlantType, PressureMethod } from "../../../../common/src/api/document/entities/plants/plant-types";
import { makeBackgroundFields } from "../../../../common/src/api/document/entities/background-entity";
import { makeValveFields } from "../../../../common/src/api/document/entities/fitting-entity";
import { makePipeFields } from "../../../../common/src/api/document/entities/pipe-entity";
import { Catalog } from "../../../../common/src/api/catalog/types";
import { makeDirectedValveFields } from "../../../../common/src/api/document/entities/directed-valves/directed-valve-entity";
import { makeLoadNodesFields } from "../../../../common/src/api/document/entities/load-node-entity";
import { makeFlowSourceFields } from "../../../../common/src/api/document/entities/flow-source-entity";
import { color2rgb, lighten, rgb2style } from "../../lib/utils";
import {makeGasApplianceFields} from "../../../../common/src/api/document/entities/gas-appliance";
import {determineConnectableSystemUid} from "../../store/document/entities/lib";

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
        case EntityType.GAS_APPLIANCE:
            return entity.outletAboveFloorM;
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
        priceTable: context.effectivePriceTable,
        doc: context.document,
        globalStore: context.globalStore,
        nodes: context.$store.getters["customEntity/nodes"],
    });
}

export function flowSystemsCompatible(a: string, b: string) {
    if (isDrainage(a) && isDrainage(b)) {
        return true;
    }
    return a === b;
}

export function flowSystemsFlowTogether(a: string, b: string, doc: DocumentState, catalog: Catalog) {
    const systemA = doc.drawing.metadata.flowSystems.find((s) => s.uid === a);
    const systemB = doc.drawing.metadata.flowSystems.find((s) => s.uid === b);

    if (systemA && systemB) {

        const categoryA = isDrainage(a) ? 'd' : isGas(systemA.fluid, catalog) ? 'g' : 'w';
        const categoryB = isDrainage(b) ? 'd' : isGas(systemB.fluid, catalog) ? 'g' : 'w';
        return categoryA === categoryB;
    }  else {
        return false;
    }

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
    const manufacturer = context.drawing.metadata.catalog.backflowValves.find((material: SelectedMaterialManufacturer) => material.uid === catalogId)?.manufacturer || 'generic';
    const rpzdEntry = upperBoundTable(context.catalog.backflowValves[catalogId].valvesBySize[manufacturer], size);
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
        if (Math.abs(flowLS) < EPS) {
            return 0;
        }
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

export function drawRpzdDouble(context: DrawingContext, colors: [string, string], highlightColor?: Color) {
    const s = context.vp.currToSurfaceScale(context.ctx);
    const baseWidth = Math.max(2.0 / s, VALVE_LINE_WIDTH_MM / context.vp.surfaceToWorldLength(1));
    const ctx = context.ctx;
    ctx.lineWidth = baseWidth;

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(-VALVE_HEIGHT_MM * 1.3, -VALVE_HEIGHT_MM * 2.3, VALVE_HEIGHT_MM * 2.6, VALVE_HEIGHT_MM * 4.6);


    if (highlightColor) {
        ctx.fillStyle = rgb2style(color2rgb(highlightColor), 0.3);
        ctx.fillRect(-VALVE_HEIGHT_MM * 1.5, -VALVE_HEIGHT_MM * 2.5, VALVE_HEIGHT_MM * 3, VALVE_HEIGHT_MM * 5);
    }

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

export function getPlantPressureLossKPA(entity: PlantEntity, drawing: DrawingState, pressureKPA: number | null, flowLs?: number) {
    const filled = fillPlantDefaults(entity, drawing);

    if (filled.plant.type !== PlantType.RETURN_SYSTEM) {
        switch (filled.plant.pressureLoss.pressureMethod) {
            case PressureMethod.PUMP_DUTY:
                return -filled.plant.pressureLoss.pumpPressureKPA!;
            case PressureMethod.FIXED_PRESSURE_LOSS:
                if (typeof flowLs !== 'undefined') {
                    if (flowLs === 0) {
                        return 0; 
                    }
                }
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

export function makeEntityFields(entity: DrawableEntityConcrete, document: DocumentState, catalog: Catalog, store: GlobalStore) {

    switch (entity.type) {
        case EntityType.BACKGROUND_IMAGE:
            return makeBackgroundFields().filter((p) => p.multiFieldId);
        case EntityType.FITTING:
            return makeValveFields(
                document.drawing.metadata.flowSystems
            ).filter((p) => p.multiFieldId);
        case EntityType.GAS_APPLIANCE:
            return makeGasApplianceFields(document.drawing, entity);
        case EntityType.PIPE:
            return makePipeFields(entity, catalog, document.drawing).filter(
                (p) => p.multiFieldId
            );
        case EntityType.RISER:
            return makeRiserFields(entity, catalog, document.drawing).filter(
                (p) => p.multiFieldId
            );
        case EntityType.BIG_VALVE:
            return makeBigValveFields(entity)
                .filter((p) => p.multiFieldId)
                .filter((p) => p.multiFieldId);
        case EntityType.FIXTURE:
            return makeFixtureFields(document, entity)
                .filter((p) => p.multiFieldId)
                .filter((p) => p.multiFieldId);
        case EntityType.DIRECTED_VALVE:
            return makeDirectedValveFields(entity, catalog, document.drawing)
                .filter((p) => p.multiFieldId)
                .filter((p) => p.multiFieldId);
        case EntityType.SYSTEM_NODE:
            throw new Error("Invalid object in multi select");
        case EntityType.LOAD_NODE:
            const systemUid = determineConnectableSystemUid(store, entity);
            return makeLoadNodesFields(document,  entity, catalog, systemUid || null).filter(
                (p) => p.multiFieldId
            );
        case EntityType.FLOW_SOURCE:
            return makeFlowSourceFields(
                document.drawing.metadata.flowSystems,
                entity,
            ).filter((p) => p.multiFieldId);
        case EntityType.PLANT:
            return makePlantEntityFields(entity, document.drawing.metadata.flowSystems);
    }
    assertUnreachable(entity);
}

export function getHighlightColor(selected: boolean, overridden: Color[], theme?: Color) {

    const mergeList = Array.from(overridden);
    if (selected) {
        if (!theme) {
            theme = {hex: '#6464ff'};
        }
        mergeList.push(theme);
    }

    if (!mergeList.length) {
        return {
            r: 0, g: 0, b: 0,
        };
    }

    const tot = {r: 0, g: 0, b: 0};
    for (const c of mergeList) {
        const nxt = color2rgb(c);
        tot.r += nxt.r;
        tot.g += nxt.g;
        tot.b += nxt.b;
    }
    return {
        r: tot.r / mergeList.length,
        g: tot.g / mergeList.length,
        b: tot.b / mergeList.length,
    };
}
