import {MainEventBus} from "../../../src/store/main-event-bus";
import {EntityType} from "../../../../common/src/api/document/entities/types";
import uuid from "uuid";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import {
    FlowConfiguration,
    SystemNodeEntity
} from "../../../../common/src/api/document/entities/big-valve/big-valve-entity";
import {KeyCode} from "../../../src/htmlcanvas/utils";
import PlantEntity from "../../../../common/src/api/document/entities/plants/plant-entity";
import {Coord} from "../../../../common/src/api/document/drawing";
import {
    PlantConcrete,
    PlantType,
    PressureMethod
} from "../../../../common/src/api/document/entities/plants/plant-types";
import {assertUnreachable, StandardFlowSystemUids} from "../../../../common/src/api/config";
import SnappingInsertTool from "./snapping-insert-tool";
import { Catalog } from "../../../../common/src/api/catalog/types";

export default function insertPlant(context: CanvasContext, angle: number, type: PlantType, inletSystemUid: string, outletSystemUid: string, title: string, rightToLeft: boolean = false) {
    const plantUid = uuid();
    let newEntity: PlantEntity | null = null;

    const inletUid = uuid();
    const outletUid = uuid();
    const returnUid = uuid();
    const gasNodeUid = uuid();

    MainEventBus.$emit(
        "set-tool-handler",
        new SnappingInsertTool(
            async (interrupted, displaced) => {
                if (interrupted) {
                    context.$store.dispatch("document/revert");
                    if (!displaced) {
                        MainEventBus.$emit("set-tool-handler", null);
                    }
                } else {
                    insertPlant(context, angle, type, inletSystemUid, outletSystemUid, title, rightToLeft);
                }
            },
            (wc: Coord) => {
                newEntity = null;
                // Preview
                newEntity = {
                    heightAboveFloorM: 0.75,
                    heightMM: 300,
                    widthMM: 500,
                    inletSystemUid,
                    inletUid,
                    outletSystemUid,
                    outletTemperatureC: null,

                    outletUid,
                    center: wc,

                    rightToLeft,

                    parentUid: null,
                    type: EntityType.PLANT,
                    uid: plantUid,

                    name: title,
                    rotation: angle,

                    plant: createPlant(context, type, outletSystemUid, returnUid, gasNodeUid),
                };

                newEntity = resolveNewEntiy(context, newEntity);

                context.$store.dispatch("document/addEntity", newEntity);

                const inlet: SystemNodeEntity = {
                    center: {
                        x: (-newEntity.widthMM / 2) * (rightToLeft ? -1 : 1),
                        y: 0
                    },
                    parentUid: plantUid,
                    type: EntityType.SYSTEM_NODE,
                    calculationHeightM: null,
                    systemUid: inletSystemUid,
                    uid: inletUid,
                    allowAllSystems: false,
                    configuration: FlowConfiguration.INPUT
                };

                const outlet: SystemNodeEntity = {
                    center: {
                        x: (newEntity.widthMM / 2) * (rightToLeft ? -1 : 1),
                        y: 0
                    },
                    parentUid: plantUid,
                    type: EntityType.SYSTEM_NODE,
                    calculationHeightM: null,
                    systemUid: outletSystemUid,
                    uid: outletUid,
                    allowAllSystems: false,
                    configuration: FlowConfiguration.OUTPUT
                };

                context.$store.dispatch("document/addEntity", inlet);
                context.$store.dispatch("document/addEntity", outlet);

                if (type === PlantType.RETURN_SYSTEM) {

                    const retlet: SystemNodeEntity = {
                        center: {
                            x: (newEntity.widthMM / 2) * (rightToLeft ? -1 : 1),
                            y: (newEntity.heightMM / 4)
                        },
                        parentUid: plantUid,
                        type: EntityType.SYSTEM_NODE,
                        calculationHeightM: null,
                        systemUid: outletSystemUid,
                        uid: returnUid,
                        allowAllSystems: false,
                        configuration: FlowConfiguration.INPUT
                    };

                    const gasOutlet: SystemNodeEntity = {
                        center: {
                            x: (-newEntity.widthMM / 2) * (rightToLeft ? -1 : 1),
                            y: (newEntity.heightMM / 4)
                        },
                        parentUid: plantUid,
                        type: EntityType.SYSTEM_NODE,
                        calculationHeightM: null,
                        systemUid: StandardFlowSystemUids.Gas,
                        uid: gasNodeUid,
                        allowAllSystems: false,
                        configuration: FlowConfiguration.INPUT
                    };

                    context.$store.dispatch("document/addEntity", retlet);
                    context.$store.dispatch("document/addEntity", gasOutlet);
                }

                context.globalStore.get(newEntity.uid)!.rebase(context);
                context.scheduleDraw();
            },
            (wc: Coord) => {
                context.$store.dispatch("document/validateAndCommit").then(() => {
                    /**/
                });
            },
            "Insert Plant",
            [
                [
                    KeyCode.SHIFT,
                    {
                        name: "+ Precise Rotating",
                        fn: (event: KeyboardEvent) => {
                            /* */
                        }
                    }
                ],
                [
                    KeyCode.RIGHT,
                    {
                        name: "Rotate Clockwise",
                        fn: (event: KeyboardEvent, onRefresh: () => void) => {
                            if (event.shiftKey || event.ctrlKey) {
                                angle += 1;
                            } else {
                                angle += 45;
                            }
                            onRefresh();
                        }
                    }
                ],
                [
                    KeyCode.LEFT,
                    {
                        name: "Rotate Counter-clockwise",
                        fn: (event: KeyboardEvent, onRefresh: () => void) => {
                            if (event.shiftKey || event.ctrlKey) {
                                angle -= 1;
                            } else {
                                angle -= 45;
                            }
                            onRefresh();
                        }
                    }
                ],
                [
                    KeyCode.SPACE,
                    {
                        name: "Flip Inlet-Outlet",
                        fn: (event: KeyboardEvent, onRefresh: () => void) => {
                            rightToLeft = !rightToLeft;
                            onRefresh();
                        }
                    }
                ]
            ]
        )
    );
}

function createPlant(context: CanvasContext, type: PlantType, outletSystemUid: string, returnUid: string | null, gasInUid: string | null): PlantConcrete {
    switch (type) {
        case PlantType.RETURN_SYSTEM:
            return {
                type,
                returnMinimumTemperatureC: null,
                gasConsumptionMJH: null,
                returnUid: returnUid!,
                gasNodeUid: gasInUid!,
                gasPressureKPA: null,
                returnVelocityMS: null,
                addReturnToPSDFlowRate: true,
            };
        case PlantType.PUMP:
            return {
                type,
                pressureLoss: {
                    pressureMethod: PressureMethod.PUMP_DUTY,
                    pumpPressureKPA: null,
                }
            };
        case PlantType.TANK:
            return {
                type,
                pressureLoss: {
                    pressureMethod: PressureMethod.STATIC_PRESSURE,
                    staticPressureKPA: null,
                }
            };
        case PlantType.CUSTOM:
            return {
                type,
                pressureLoss: {
                    pressureMethod: PressureMethod.FIXED_PRESSURE_LOSS,
                    pressureLossKPA: null,
                    staticPressureKPA: null,
                    pumpPressureKPA: null,
                }
            };
        case PlantType.DRAINAGE_PIT:
            return {
                type,
                pressureLoss: {
                    pressureMethod: PressureMethod.STATIC_PRESSURE,
                    staticPressureKPA: 0,
                },
            };
        case PlantType.DRAINAGE_GREASE_INTERCEPTOR_TRAP:
            const selectedManufacturer = context.document.drawing.metadata.catalog.greaseInterceptorTrap![0].manufacturer || 'generic';
            const capacity = selectedManufacturer === 'generic' ? '1000L' : '1000';
            return {
                type,
                pressureLoss: {
                    pressureMethod: PressureMethod.STATIC_PRESSURE,
                    staticPressureKPA: 0,
                },
                location: 'nsw',
                position: 'belowGround',
                capacity,
            };
    }
    assertUnreachable(type);
}

function resolveNewEntiy(context: CanvasContext, entity: PlantEntity): PlantEntity {
    const catalog = context.$store.getters['catalog/default'] as Catalog;

    switch(entity.plant.type) {
        case PlantType.RETURN_SYSTEM:
        case PlantType.PUMP:
        case PlantType.TANK:
        case PlantType.DRAINAGE_PIT:
        case PlantType.CUSTOM:
            break;
        case PlantType.DRAINAGE_GREASE_INTERCEPTOR_TRAP:
            const plant = entity.plant;
            const selectedManufacturer = context.document.drawing.metadata.catalog.greaseInterceptorTrap![0].manufacturer || 'generic';
            const selectedSize = catalog.greaseInterceptorTrap!.size[selectedManufacturer][plant.location][plant.position][plant.capacity];
            entity.heightMM = selectedSize.heightMM;
            entity.widthMM = selectedSize.widthMM;
            entity.lengthMM = selectedSize.lengthMM;
            break;
        default:
            assertUnreachable(entity.plant);
            break;
    }

    return entity;
}
