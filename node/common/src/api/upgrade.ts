import { DrawingState, FlowSystemParametersV8, FlowSystemParametersV9, initialDrawing } from "./document/drawing";
import { EntityType } from "./document/entities/types";
import { NodeType } from "./document/entities/load-node-entity";
import { InsulationJackets, InsulationMaterials, StandardFlowSystemUids, SupportedPsdStandards } from "./config";
import PlantEntity, { PlantEntityV8 } from "./document/entities/plants/plant-entity";
import { PlantConcrete, PlantType, PressureMethod } from "./document/entities/plants/plant-types";
import { DrawableEntityConcrete } from "./document/entities/concrete-entity";
import { FlowConfiguration } from "./document/entities/big-valve/big-valve-entity";
import uuid from "uuid";
import { cloneSimple } from "../lib/utils";
import { FlowSourceEntityV11 } from "./document/entities/flow-source-entity";

// This file is for managing upgrades between versions.
// Remember to copy this directory before developing a major change, and bump the api version number, then
// implement the upgrade method below.
// Remember to also add this function to the upgrade function in default.

// upgrade 9 to 10
// insulation jackets in flow systems

export function upgrade9to10(original: DrawingState) {
    for (const fs of original.metadata.flowSystems) {
        if (fs.insulationJacket === undefined) {
            fs.insulationJacket = InsulationJackets.allServiceJacket;
        }
    }
}

export function upgrade10to11(original: DrawingState) {
    if (original.metadata.units === undefined) {
        original.metadata.units = cloneSimple(initialDrawing.metadata.units);
    }
}

export function upgrade11to12(original: DrawingState) {
    for (const level of Object.values(original.levels)) {
        const entities = level.entities;
        for (const e of Object.values(entities)) {
            if (e.type === EntityType.FLOW_SOURCE) {
                if (e.minPressureKPA === undefined || e.maxPressureKPA === undefined && (e as any as FlowSourceEntityV11).pressureKPA !== undefined) {
                    e.minPressureKPA = e.maxPressureKPA = (e as any as FlowSourceEntityV11).pressureKPA;
                    delete (e as any as FlowSourceEntityV11).pressureKPA;
                }
            }
        }
    }
}

// add min and max pressures to load nodes.
// rename bs6700 to cibse Guide G
export function upgrade12to13(original: DrawingState) {
    if (original.metadata.calculationParams.psdMethod === 'bs6700' as any) {
        original.metadata.calculationParams.psdMethod = SupportedPsdStandards.cibseGuideG;
    }

    for (const level of Object.values(original.levels)) {
        const entities = level.entities;
        for (const e of Object.values(entities)) {
            if (e.type === EntityType.LOAD_NODE) {
                if (e.minPressureKPA === undefined) {
                    e.minPressureKPA = null;
                }
                if (e.maxPressureKPA === undefined) {
                    e.maxPressureKPA = null;
                }
            }
        }
    }
}

export function upgrade13to14(original: DrawingState) {
    if (original.metadata.catalog === undefined) {
        original.metadata.catalog = cloneSimple(initialDrawing.metadata.catalog);
    }
}

export function upgrade14to15(original: DrawingState) {
    if (original.metadata.priceTable === undefined) {
        original.metadata.priceTable = cloneSimple(initialDrawing.metadata.priceTable);
    }
}