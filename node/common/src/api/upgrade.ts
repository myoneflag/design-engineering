import { DrawingState } from "./document/drawing";
import { cloneSimple } from "../lib/utils";
import { EntityType } from "./document/entities/types";
import { initialCatalog } from "./catalog/initial-catalog/initial-catalog";
import { PlantEntityV3, plantV3toCurrent } from "./document/entities/plant-entity";

// This file is for managing upgrades between versions.
// Remember to copy this directory before developing a major change, and bump the api version number, then
// implement the upgrade method below.
// Remember to also add this function to the upgrade function in default.

export const CURRENT_VERSION = 4;

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
