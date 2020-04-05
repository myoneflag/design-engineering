import { DrawingState, FlowSystemParametersV8, FlowSystemParametersV9, initialDrawing } from "./document/drawing";
import { EntityType } from "./document/entities/types";
import { NodeType } from "./document/entities/load-node-entity";
import { InsulationJackets, InsulationMaterials } from "./config";
import { StandardFlowSystemUids } from "../../../frontend/src/store/catalog";
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

export const CURRENT_VERSION = 12;

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

// return circulations
export function upgrade8to9(original: DrawingState) {
    for (const fs of original.metadata.flowSystems) {
        if (fs.hasReturnSystem === undefined) {
            const old = fs as FlowSystemParametersV8;
            const upgraded: FlowSystemParametersV9 = {
                color: old.color,
                fluid: old.fluid,
                name: old.name,
                networks: old.networks,
                temperature: old.temperature,
                uid: old.uid,


                hasReturnSystem: old.uid === StandardFlowSystemUids.HotWater,
                returnIsInsulated: old.uid === StandardFlowSystemUids.HotWater,
                returnMaxVelocityMS: 1,
                insulationMaterial: InsulationMaterials.calciumSilicate,
                insulationThicknessMM: 25,
            };
            Object.assign(fs, upgraded);
        }
    }

    if (original.metadata.calculationParams.windSpeedForHeatLossMS === undefined) {
        original.metadata.calculationParams.windSpeedForHeatLossMS = 0;
    }

    let hotPlants = 0;
    let plants = 0;
    for (const level of Object.values(original.levels)) {
        const entitiesToAdd: DrawableEntityConcrete[] = [];

        for (const e of Object.values(level.entities)) {
            if (e.type === EntityType.PLANT) {
                plants ++;
                if (e.plant === undefined) {
                    const old = e as unknown as PlantEntityV8;

                    let plant: PlantConcrete;
                    if (old.outletSystemUid === StandardFlowSystemUids.HotWater && old.inletSystemUid === StandardFlowSystemUids.ColdWater) {
                        const returnUid = uuid();
                        entitiesToAdd.push({
                            center: {
                                x: (old.widthMM / 2) * (old.rightToLeft ? -1 : 1),
                                y: (old.heightMM / 4)
                            },
                            parentUid: old.uid,
                            type: EntityType.SYSTEM_NODE,
                            calculationHeightM: null,
                            systemUid: e.outletSystemUid,
                            uid: returnUid,
                            allowAllSystems: false,
                            configuration: FlowConfiguration.INPUT
                        });

                        plant = {
                            type: PlantType.RETURN_SYSTEM,
                            returnMinimumTemperatureC: null,
                            returnUid,
                            returnVelocityMS: null,
                            addReturnToPSDFlowRate: true,
                        };
                    } else if (old.pressureMethod === PressureMethod.PUMP_DUTY) {
                        plant = {
                            type: PlantType.PUMP,
                            pressureLoss: {
                                pressureMethod: PressureMethod.PUMP_DUTY,
                                pumpPressureKPA: old.pumpPressureKPA,
                            },
                        };
                    } else if (old.pressureMethod === PressureMethod.STATIC_PRESSURE) {
                        plant = {
                            type: PlantType.TANK,
                            pressureLoss: {
                                pressureMethod: PressureMethod.STATIC_PRESSURE,
                                staticPressureKPA: old.staticPressureKPA,
                            }
                        };
                    } else {
                        plant = {
                            type: PlantType.CUSTOM,
                            pressureLoss: {
                                pressureMethod: old.pressureMethod,
                                pumpPressureKPA: old.pumpPressureKPA,
                                pressureLossKPA: old.pressureLossKPA,
                                staticPressureKPA: old.staticPressureKPA,
                            }
                        };
                    }

                    const upgraded: PlantEntity = {
                        center: old.center,
                        heightAboveFloorM: old.heightAboveFloorM,
                        heightMM: old.heightMM,
                        inletSystemUid: old.inletSystemUid,
                        inletUid: old.inletUid,
                        name: old.name,
                        outletSystemUid: old.outletSystemUid,
                        outletTemperatureC: null,
                        outletUid: old.outletUid,
                        parentUid: old.parentUid,
                        plant,
                        rightToLeft: old.rightToLeft,
                        rotation: old.rotation,
                        type: old.type,
                        uid: old.uid,
                        widthMM: old.widthMM,
                    };

                    Object.assign(old, upgraded);
                }
            }
        }

        for (const e of entitiesToAdd) {
            level.entities[e.uid] = e;
        }
    }
}

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
