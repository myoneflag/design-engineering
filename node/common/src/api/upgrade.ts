import {DrawingState, initialDrawing} from "./document/drawing";
import {EntityType} from "./document/entities/types";
import {InsulationJackets, InsulationMaterials, StandardFlowSystemUids, SupportedPsdStandards} from "./config";
import {PlantType} from "./document/entities/plants/plant-types";
import {cloneSimple} from "../lib/utils";
import {FlowSourceEntityV11} from "./document/entities/flow-source-entity";
import uuid from 'uuid';
import {FlowConfiguration, SystemNodeEntity} from "./document/entities/big-valve/big-valve-entity";
import {ValveType} from "./document/entities/directed-valves/valve-types";
import {NodeType} from "./document/entities/load-node-entity";

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

export function upgrade15to16(original: DrawingState) {
    if (!original.metadata.flowSystems.find((f) => f.uid === StandardFlowSystemUids.Gas)) {
        original.metadata.flowSystems.push(
            {
                name: "Gas",
                temperature: 20,
                color: { hex: "#FCDC00" },
                uid: StandardFlowSystemUids.Gas,
                fluid: "naturalGas",
                hasReturnSystem: false,
                returnIsInsulated: false,
                returnMaxVelocityMS: 1,
                insulationMaterial: InsulationMaterials.calciumSilicate,
                insulationJacket: InsulationJackets.allServiceJacket,
                insulationThicknessMM: 25,

                networks: {
                    RISERS: {
                        spareCapacityPCT: 0,
                        velocityMS: 20,
                        material: "copperTypeB"
                    },
                    RETICULATIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 20,
                        material: "copperTypeB"
                    },
                    CONNECTIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 3,
                        material: "pexSdr74"
                    }
                }
            }
        );
    }

    for (const level of Object.values(original.levels)) {
        const entities = level.entities;
        for (const e of Object.values(entities)) {
            if (e.type === EntityType.PLANT) {
                if (e.plant.type === PlantType.RETURN_SYSTEM) {
                    // Add the missing gas entity
                    if (!e.plant.gasNodeUid) {
                        const newUid = uuid();

                        const newEntity: SystemNodeEntity = {
                            center: {
                                x: (-e.widthMM / 2) * (e.rightToLeft ? -1 : 1),
                                y: (e.heightMM / 4)
                            },
                            parentUid: e.uid,
                            type: EntityType.SYSTEM_NODE,
                            calculationHeightM: null,
                            systemUid: StandardFlowSystemUids.Gas,
                            uid: newUid,
                            allowAllSystems: false,
                            configuration: FlowConfiguration.INPUT
                        };

                        level.entities[newUid] = newEntity;
                    }

                    if (e.plant.gasConsumptionMJH === undefined) {
                        e.plant.gasConsumptionMJH = null;
                    }

                    if (e.plant.gasPressureKPA === undefined) {
                        e.plant.gasPressureKPA = null;
                    }
                }
            } else if (e.type === EntityType.DIRECTED_VALVE) {
                if (e.valve.type === ValveType.WATER_METER) {
                    if (e.valve.pressureDropKPA === undefined) {
                        e.valve.pressureDropKPA = null;
                    }
                }
            } else if (e.type === EntityType.LOAD_NODE) {
                if (e.node.gasFlowRateMJH === undefined) {
                    e.node.gasFlowRateMJH = 0;
                }
                if (e.node.gasPressureKPA === undefined) {
                    e.node.gasPressureKPA = 0;
                }
            }
        }
    }
}