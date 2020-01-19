import { DrawingState } from "./document/drawing";
import { cloneSimple } from "../lib/utils";
import { EntityType } from "./document/entities/types";
import { initialCatalog } from "./catalog/initial-catalog/initial-catalog";

// This file is for managing upgrades between versions.
// Remember to copy this directory before developing a major change, and bump the api version number, then
// implement the upgrade method below.
// Remember to also add this function to the upgrade function in default.

export const CURRENT_VERSION = 2;

export function upgrade0to1(original: DrawingState) {
    // We have to fix one problem. Kitchen Sinks are broken.
    for (const level of Object.values(original.levels)) {
        const entities = level.entities;
        for (const e of Object.values(entities)) {
            if (e.type === EntityType.FIXTURE) {
                if (e.name === 'kitchenSink') {
                    if (e.roughInsInOrder[1] === 'hot-water') {
                        console.log('Repairing kitchen sink lol', JSON.stringify(e));
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
