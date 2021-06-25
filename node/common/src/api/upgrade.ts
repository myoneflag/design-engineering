import {
    DRAINAGE_FLOW_SYSTEMS,
    DrawingState,
    initialAustralianDrawing,
    initialDrainageProperties
} from "./document/drawing";
import {EntityType} from "./document/entities/types";
import {InsulationJackets, InsulationMaterials, StandardFlowSystemUids, SupportedPsdStandards} from "./config";
import {PlantType} from "./document/entities/plants/plant-types";
import {cloneSimple} from "../lib/utils";
import {FlowSourceEntityV11} from "./document/entities/flow-source-entity";
import { v4 as uuidv4 } from 'uuid';
import {FlowConfiguration, SystemNodeEntity} from "./document/entities/big-valve/big-valve-entity";
import {ValveType} from "./document/entities/directed-valves/valve-types";

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
        original.metadata.units = cloneSimple(initialAustralianDrawing.metadata.units);
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
        original.metadata.catalog = cloneSimple(initialAustralianDrawing.metadata.catalog);
    }
}

export function upgrade14to15(original: DrawingState) {
    if (original.metadata.priceTable === undefined) {
        original.metadata.priceTable = cloneSimple(initialAustralianDrawing.metadata.priceTable);
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
                        material: "copperTypeB",
                        minimumPipeSize: 15,
                    },
                    RETICULATIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 20,
                        material: "copperTypeB",
                        minimumPipeSize: 15,
                    },
                    CONNECTIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 3,
                        material: "pexSdr74",
                        minimumPipeSize: 16,
                    }
                }
            } as any,
        );
    }

    for (const level of Object.values(original.levels)) {
        const entities = level.entities;
        for (const e of Object.values(entities)) {
            if (e.type === EntityType.PLANT) {
                if (e.plant.type === PlantType.RETURN_SYSTEM) {
                    // Add the missing gas entity
                    if (!e.plant.gasNodeUid) {
                        const newUid = uuidv4();

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

// Fix issue where the gasNodeId was not set for plants that were upgraded.
export function upgrade16to17(original: DrawingState) {
    // Step 1. Set the gas id of any orphan gas nodes
    for (const level of Object.values(original.levels)) {
        const entities = level.entities;
        for (const e of Object.values(entities)) {
            if (e.type === EntityType.SYSTEM_NODE) {
                if (e.systemUid === StandardFlowSystemUids.Gas) {
                    const parent = level.entities[e.parentUid];
                    if (parent && parent.type === EntityType.PLANT) {
                        if (parent.plant.type === PlantType.RETURN_SYSTEM && !parent.plant.gasNodeUid) {
                            parent.plant.gasNodeUid = e.uid;
                        }
                    }
                }
            }
        }
    }

    // Step 2. Add any remaining plant gas nodes, properly this time.
    for (const level of Object.values(original.levels)) {
        const entities = level.entities;
        for (const e of Object.values(entities)) {
            if (e.type === EntityType.PLANT) {
                if (e.plant.type === PlantType.RETURN_SYSTEM) {
                    // Add the missing gas entity
                    if (!e.plant.gasNodeUid) {
                        const newUid = uuidv4();

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
                        e.plant.gasNodeUid = newEntity.uid;
                    }
                }
            }
        }
    }
}

export function upgrade17to18(original: DrawingState) {
    original.metadata.flowSystems.forEach(system => {
        system.networks.RISERS.minimumPipeSize = 15;
        system.networks.RETICULATIONS.minimumPipeSize = 15;
        system.networks.CONNECTIONS.minimumPipeSize = 16;
    });
}

export function upgrade18to19(original: DrawingState) {
    if (!original.metadata.flowSystems.find((f) => f.uid === StandardFlowSystemUids.FireHydrant)) {
        original.metadata.flowSystems.push(
            {
                name: "Fire Hydrant",
                temperature: 20,
                color: { hex: "#9F0500" },
                uid: StandardFlowSystemUids.FireHydrant,
                fluid: "water",
                hasReturnSystem: false,
                returnIsInsulated: false,
                returnMaxVelocityMS: 1,
                insulationMaterial: InsulationMaterials.calciumSilicate,
                insulationJacket: InsulationJackets.allServiceJacket,
                insulationThicknessMM: 25,

                networks: {
                    RISERS: {
                        spareCapacityPCT: 0,
                        velocityMS: 4,
                        material: "gmsMedium",
                        minimumPipeSize: 100,
                    },
                    RETICULATIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 4,
                        material: "gmsMedium",
                        minimumPipeSize: 100,
                    },
                    CONNECTIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 4,
                        material: "gmsMedium",
                        minimumPipeSize: 100,
                    }
                }
            } as any,
        );
    }

    if (!original.metadata.flowSystems.find((f) => f.uid === StandardFlowSystemUids.FireHoseReel)) {
        original.metadata.flowSystems.push(
            {
                name: "Fire Hose Reel",
                temperature: 20,
                color: { hex: "#FCDC00" },
                uid: StandardFlowSystemUids.FireHoseReel,
                fluid: "water",
                hasReturnSystem: false,
                returnIsInsulated: false,
                returnMaxVelocityMS: 1,
                insulationMaterial: InsulationMaterials.calciumSilicate,
                insulationJacket: InsulationJackets.allServiceJacket,
                insulationThicknessMM: 25,

                networks: {
                    RISERS: {
                        spareCapacityPCT: 0,
                        velocityMS: 1.5,
                        material: "copperTypeB",
                        minimumPipeSize: 25,
                    },
                    RETICULATIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 1.5,
                        material: "copperTypeB",
                        minimumPipeSize: 25,
                    },
                    CONNECTIONS: {
                        spareCapacityPCT: 0,
                        velocityMS: 1.5,
                        material: "copperTypeB",
                        minimumPipeSize: 25,
                    }
                }
            } as any,
        );
    }
}

    // Then, we have to add fixtureUnits to load nodes.
    // Add variant field

    // Add drainage rough in to fixtures.
    // Vent colour setting to flow systems


const newSewerNodeOf: {[key: string]: string} = {};

export function upgrade19to20and21(original: DrawingState) {
    if (!original.metadata.flowSystems.find((s) => s.uid === StandardFlowSystemUids.SewerDrainage)) {
        // Vent colour setting to flow systems
        for (const system of original.metadata.flowSystems) {
            system.drainageProperties = cloneSimple(initialDrainageProperties);
        }

        // We have to add the sewage flow systems.
        original.metadata.flowSystems.push(
            ...DRAINAGE_FLOW_SYSTEMS,
        );
    }


    for (const level of Object.values(original.levels)) {
        const entities = level.entities;
        for (const e of Object.values(entities)) {
            // Add drainage rough in to fixtures.
            if (e.type === EntityType.FIXTURE) {
                if (!e.roughInsInOrder.includes(StandardFlowSystemUids.SewerDrainage)) {
                    e.roughInsInOrder.unshift(StandardFlowSystemUids.SewerDrainage);

                    const newSystemNode: SystemNodeEntity = {
                        center: {
                            x: e.pipeDistanceMM * 0,
                            y: e.pipeDistanceMM * -0.2,
                        },
                        parentUid: e.uid,
                        type: EntityType.SYSTEM_NODE,
                        calculationHeightM: null,
                        allowAllSystems: false,
                        systemUid: StandardFlowSystemUids.SewerDrainage,
                        uid: newSewerNodeOf[e.uid] || uuidv4(),
                        configuration: FlowConfiguration.INPUT
                    };
                    newSewerNodeOf[e.uid] = newSystemNode.uid;
                    e.roughIns[StandardFlowSystemUids.SewerDrainage] = {
                        continuousFlowLS: null,
                        designFlowRateLS: null,
                        loadingUnits: null,
                        maxPressureKPA: null,
                        minPressureKPA: null,
                        allowAllSystems: false,
                        uid: newSystemNode.uid,
                    };
                    level.entities[newSystemNode.uid] = newSystemNode;
                }
            }

            // Add isVent option of riser.
            else if (e.type === EntityType.RISER) {
                if (e.isVent === undefined) {
                    e.isVent = false;
                }
            }

            if (e.type === EntityType.FIXTURE) {
                if (e.upcFixtureUnits === undefined) {
                    e.upcFixtureUnits = null;
                }
                if (e.asnzFixtureUnits === undefined) {
                    e.asnzFixtureUnits = null;
                }
                if (e.enDischargeUnits === undefined) {
                    e.enDischargeUnits = null;
                }
            } else if (e.type === EntityType.LOAD_NODE) {
                if (e.node.upcFixtureUnits === undefined) {
                    e.node.upcFixtureUnits = null;
                }
                if (e.node.asnzFixtureUnits === undefined) {
                    e.node.asnzFixtureUnits = null;
                }
                if (e.node.enDischargeUnits === undefined) {
                    e.node.enDischargeUnits = null;
                }
            }

        }
    }
}

export function upgraded21to22(original: DrawingState) {
    // no-op.
    // Just exist here to invoke the compression.
}