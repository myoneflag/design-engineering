/*
import {
    DRAINAGE_FLOW_SYSTEMS,
    DrawingState,
    initialAustralianDrawing,
    initialDrainageProperties
} from "./document/drawing";
import { EntityType } from "./document/entities/types";
import { InsulationJackets, InsulationMaterials, StandardFlowSystemUids, SupportedPsdStandards } from "./config";
import { PlantType } from "./document/entities/plants/plant-types";
import { cloneSimple } from "../lib/utils";
import { FlowSourceEntityV11 } from "./document/entities/flow-source-entity";
import { v4 as uuidv4 } from 'uuid';
import { FlowConfiguration, SystemNodeEntity } from "./document/entities/big-valve/big-valve-entity";
import { ValveType } from "./document/entities/directed-valves/valve-types";

// This file is for managing upgrades between versions.
// Remember to copy this directory before developing a major change, and bump the api version number, then
// implement the upgrade method below.
// Remember to also add this function to the upgrade function in default.

// upgrade 9 to 10
// insulation jackets in flow systems

export function operations_upgrade9to10(original: DrawingState) {
    for (const fs of original.metadata.flowSystems) {
        if (fs.insulationJacket === undefined) {
            fs.insulationJacket = InsulationJackets.allServiceJacket;
        }
    }
}

export function operations_upgrade10to11(original: DrawingState) {
    if (original.metadata.units === undefined) {
        original.metadata.units = cloneSimple(initialAustralianDrawing.metadata.units);
    }
}

export function operations_upgrade11to12(original: DrawingState) {
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
export function operations_upgrade12to13(original: DrawingState) {
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

export function operations_upgrade13to14(original: DrawingState) {
    if (original.metadata.catalog === undefined) {
        original.metadata.catalog = cloneSimple(initialAustralianDrawing.metadata.catalog);
    }
}

export function operations_upgrade14to15(original: DrawingState) {
    if (original.metadata.priceTable === undefined) {
        original.metadata.priceTable = cloneSimple(initialAustralianDrawing.metadata.priceTable);
    }
}

export function operations_upgrade15to16(original: DrawingState) {
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
export function operations_upgrade16to17(original: DrawingState) {
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

export function operations_upgrade17to18(original: DrawingState) {
    original.metadata.flowSystems.forEach(system => {
        system.networks.RISERS.minimumPipeSize = 15;
        system.networks.RETICULATIONS.minimumPipeSize = 15;
        system.networks.CONNECTIONS.minimumPipeSize = 16;
    });
}

export function operations_upgrade18to19(original: DrawingState) {
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


const newSewerNodeOf: { [key: string]: string } = {};

export function operations_upgrade19to20and21(original: DrawingState) {
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

export function operations_upgraded21to22(original: DrawingState) {
    // no-op.
    // Just exist here to invoke the compression.
}

*/

// Migration operations above are kept commented for future reference.
// They are not used anymore in code.

import { DrawingState } from "./document/drawing";
import { ValveType } from "./document/entities/directed-valves/valve-types";
import { NodeType } from "./document/entities/load-node-entity";
import { PlantType } from "./document/entities/plants/plant-types";
import { EntityType } from "./document/entities/types";

// export const DRAWING_UPGRADE_VERSION = 23;
// Before this version, documents are stored only as an Operation[] in the operations table.
// Upgrades need to be performed for each operation of a document.

// Starting with this version, documents are stored as:
// * Drawing in the drawing table - the full drawingstate
// * Operation[] in the operations table - used for history
// Any document upgrades from now on are performed on a per-drawing basis.
// Rules:
// * Upgrades need to traverse the document only once and do any kind of processing they need to do on the entities in the document only once.
// * Upgrades need to be reentrant and idempotent.
//   After a field partial execution the second execution should continue correctly.
//   Executing the same upgrade multiple times on a document will result the same document.
//   Basically, Upgrade to check if a chamnge has already been done on an entity.
// * All new data that the upgrade adds to the document needs to be added as operations as well in the database.

export function drawing_upgraded22to23(original: DrawingState) {
    // do nothing with this migration
}

export function drawing_upgraded23to24(original: DrawingState) {
    for (const level of Object.values(original.levels)) {
        const entities = level.entities;
        for (const entity of Object.values(entities)) {
            if (entity.type === EntityType.DIRECTED_VALVE && entity.valve.type === ValveType.GAS_REGULATOR) {
                if (entity.valve.downStreamPressureKPA === undefined) {
                    entity.valve.downStreamPressureKPA = null;
                }
            }

            if (entity.type === EntityType.GAS_APPLIANCE) {
                if (entity.diversity === undefined) {
                    entity.diversity = null;
                }
            }

            if (entity.type === EntityType.LOAD_NODE && entity.node.type === NodeType.LOAD_NODE) {
                if (entity.node.diversity === undefined) {
                    entity.node.diversity = null;
                }
            }

            if (entity.type === EntityType.PLANT) {
                if (entity.plant.type === PlantType.RETURN_SYSTEM) {
                    if (entity.plant.diversity === undefined) {
                        entity.plant.diversity = null;
                    }

                    if (entity.plant.gasConsumptionMJH === undefined) {
                        entity.plant.gasConsumptionMJH = null;
                    }

                    if (entity.plant.gasPressureKPA === undefined) {
                        entity.plant.gasPressureKPA = null;
                    }

                    if (entity.plant.rheemVariant === undefined) {
                        entity.plant.rheemVariant = null;
                    }

                    if (entity.plant.rheemPeakHourCapacity === undefined) {
                        entity.plant.rheemPeakHourCapacity = null;
                    }

                    if (entity.plant.rheemMinimumInitialDelivery === undefined) {
                        entity.plant.rheemMinimumInitialDelivery = null;
                    }

                    if (entity.plant.rheemkWRating === undefined) {
                        entity.plant.rheemkWRating = null;
                    }

                    if (entity.plant.rheemStorageTankSize === undefined) {
                        entity.plant.rheemStorageTankSize = null;
                    }
                }

                if (entity.plant.type === PlantType.DRAINAGE_GREASE_INTERCEPTOR_TRAP) {
                    if (entity.plant.lengthMM === undefined) {
                        entity.plant.lengthMM = null;
                    }
                }

                if (entity.calculation === undefined) {
                    entity.calculation = {
                        widthMM: null,
                        depthMM: null,
                    }
                }
            }
        }
    }
}

export function drawing_upgraded24to25(original: DrawingState) {
    const target = original.metadata.catalog.hotWaterPlant.findIndex((i) => i.uid === "hotWaterPlant" && i.manufacturer === "grundfos");

    if (target !== -1) {
        original.metadata.catalog.hotWaterPlant[target].uid = 'circulatingPumps';
    }
}

export function drawing_upgraded25to26(original: DrawingState) {
    for (const level of Object.values(original.levels)) {
        const entities = level.entities;
        for (const entity of Object.values(entities)) {
            if (
                entity.type === EntityType.FLOW_SOURCE ||
                entity.type === EntityType.PIPE ||
                entity.type === EntityType.BIG_VALVE ||
                entity.type === EntityType.DIRECTED_VALVE ||
                entity.type === EntityType.FIXTURE) {
                if (entity.entityName === undefined) {
                    entity.entityName = null;
                }
            }
        }
    }
    for (const entity of Object.values(original.shared)) {
        if (entity.type === EntityType.RISER) {
            if (entity.entityName === undefined) {
                entity.entityName = null;
            }
        }
    }
}

export function drawing_upgraded26to27(original: DrawingState) {
    for (const level of Object.values(original.levels)) {
        const entities = level.entities;
        for (const entity of Object.values(entities)) {
            if (entity.type === EntityType.FITTING) {
                if (entity.entityName === undefined) {
                    entity.entityName = null;
                }
            }
        }
    }
}

export function drawing_upgraded27to28(original: DrawingState) {
    for (const level of Object.values(original.levels)) {
        const entities = level.entities;
        for (const entity of Object.values(entities)) {
            if (entity.type === EntityType.DIRECTED_VALVE && entity.valve.type === ValveType.FLOOR_WASTE) {
                if (entity.valve.variant === undefined) {
                    entity.valve.variant = null;
                }

                if (entity.valve.bucketTrapSize === undefined) {
                    entity.valve.bucketTrapSize = null;
                }
            }
        }
    }
}

export function drawing_upgraded28to29(original: DrawingState) {
    for (const riser of Object.values(original.shared)) {
        if (riser.isVent && riser.bottomHeightM === null) {
            // ground to roof
            const sortedLevels = Object.values(original.levels)
                .slice()
                .sort((a, b) => -(a.floorHeightM - b.floorHeightM))
                .reverse();

            const lowestConnectedLevel = sortedLevels.find(l =>
                !!Object.values(l.entities).find(e =>
                    e.type === EntityType.PIPE && e.endpointUid.includes(riser.uid)
                )
            );

            if (!!lowestConnectedLevel) {
                riser.bottomHeightM = lowestConnectedLevel.floorHeightM;
            }
        }
    }
}
