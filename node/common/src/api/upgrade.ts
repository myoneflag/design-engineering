import { DrawingState, initialDrawing } from "./document/drawing";
import { EntityType } from "./document/entities/types";
import { PlantEntityV3, plantV3toCurrent } from "./document/entities/plants/plant-entity";
import { NodeType } from "./document/entities/load-node-entity";

// This file is for managing upgrades between versions.
// Remember to copy this directory before developing a major change, and bump the api version number, then
// implement the upgrade method below.
// Remember to also add this function to the upgrade function in default.

export const CURRENT_VERSION = 8;

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

export function upgrade7to8(original: DrawingState) {
    for (const level of Object.values(original.levels)) {
        const entities = level.entities;
        for (const e of Object.values(entities)) {
            if (e.type === EntityType.LOAD_NODE) {
                if (e.node.type === NodeType.DWELLING) {
                    if (e.node.continuousFlowLS === undefined) {
                        e.node.continuousFlowLS = 0;
                    }
                }
            }
        }
    }
}
