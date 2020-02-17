import { DrawingState, initialDrawing } from "./document/drawing";
import { EntityType } from "./document/entities/types";
import { PlantEntityV3, plantV3toCurrent } from "./document/entities/plant-entity";

// This file is for managing upgrades between versions.
// Remember to copy this directory before developing a major change, and bump the api version number, then
// implement the upgrade method below.
// Remember to also add this function to the upgrade function in default.

export const CURRENT_VERSION = 8;

export function upgrade0to1(original: DrawingState) {
    // We have to fix one problem. Kitchen Sinks are broken.
    for (const level of Object.values(original.levels)) {
        const entities = level.entities;
        for (const e of Object.values(entities)) {
            if (e.type === EntityType.FIXTURE) {
                if (e.name === 'kitchenSink') {
                    if (e.roughInsInOrder[1] === 'hot-water') {
                        e.name = 'kitchenSinkHot';
                    }
                }
            }
        }
    }
}

export function upgrade1to2(original: DrawingState) {
    // We have to fix one problem. Kitchen Sinks are broken.
    for (const level of Object.values(original.levels)) {
        const entities = level.entities;
        for (const e of Object.values(entities)) {
            if (e.type === EntityType.PLANT) {
                if (e.rightToLeft === undefined) {
                    e.rightToLeft = false;
                }
            }
        }
    }
}

export function upgrade2to3(original: DrawingState) {
    // Load nodes should have thingoes.
    for (const level of Object.values(original.levels)) {
        const entities = level.entities;
        for (const e of Object.values(entities)) {
            if (e.type === EntityType.LOAD_NODE) {
                if (e.linkedToUid === undefined) {
                    e.linkedToUid = null;
                }
            }
        }
    }
}

export function upgrade3to4(original: DrawingState) {
    let updated = false;
    // Plants entity was updated
    for (const level of Object.values(original.levels)) {
        const entities = level.entities;
        for (const euid of Object.keys(entities)) {
            if (entities[euid].type === EntityType.PLANT) {
                updated = true;
                entities[euid] = plantV3toCurrent(entities[euid] as any as PlantEntityV3);
            }
        }
    }
    return updated;
}

export function upgrade4to5(original: DrawingState) {
    // Plants entity was updated
    for (const level of Object.values(original.levels)) {
        const entities = level.entities;
        for (const e of Object.values(entities)) {
            if (e.type === EntityType.SYSTEM_NODE) {
                if (e.allowAllSystems === undefined) {
                    e.allowAllSystems = false;
                }
            } else if (e.type === EntityType.FIXTURE) {
                for (const ri of Object.values(e.roughIns)) {
                    if (ri.allowAllSystems === undefined) {
                        ri.allowAllSystems = false;
                    }
                }
            }
        }
    }
}

export function upgrade5to6(original: DrawingState) {
    // drawing parameters
    if (original.metadata.calculationParams.componentPressureLossMethod === undefined) {
        original.metadata.calculationParams.componentPressureLossMethod =
            initialDrawing.metadata.calculationParams.componentPressureLossMethod;
    }

    if (original.metadata.calculationParams.pipePressureLossAddOnPCT === undefined) {

        original.metadata.calculationParams.pipePressureLossAddOnPCT =
            initialDrawing.metadata.calculationParams.pipePressureLossAddOnPCT;
    }
}

export function upgrade6to7(original: DrawingState) {
    if (original.metadata.calculationParams.ringMainCalculationMethod === undefined) {
        original.metadata.calculationParams.componentPressureLossMethod =
            initialDrawing.metadata.calculationParams.componentPressureLossMethod;
    }
}
