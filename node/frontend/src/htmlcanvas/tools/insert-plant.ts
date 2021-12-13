import uuid from "uuid";
import { MainEventBus } from "../../../src/store/main-event-bus";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import { KeyCode } from "../../../src/htmlcanvas/utils";
import { Coord } from "../../../../common/src/api/document/drawing";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import PlantEntity, {
    fillPlantDefaults, PLANT_ENTITY_VERSION
} from "../../../../common/src/api/document/entities/plants/plant-entity";
import {
    PlantConcrete,
    PlantType,
    PressureMethod,
} from "../../../../common/src/api/document/entities/plants/plant-types";
import {
    FlowConfiguration,
    SystemNodeEntity
} from "../../../../common/src/api/document/entities/big-valve/big-valve-entity";
import { assertUnreachable, StandardFlowSystemUids } from "../../../../common/src/api/config";
import SnappingInsertTool from "./snapping-insert-tool";

export default function insertPlant(context: CanvasContext, angle: number, type: PlantType, inletSystemUid: string, outletSystemUid: string, title: string, rightToLeft: boolean = false) {
    const plantUid = uuid();
    const inletUid = uuid();
    const outletUid = uuid();
    const returnUid = uuid();
    const gasNodeUid = uuid();

    let newEntity: PlantEntity | null = null;

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

                newEntity = {
                    version: PLANT_ENTITY_VERSION,

                    center: wc,
                    rotation: angle,
                    rightToLeft,

                    uid: plantUid,
                    parentUid: null,
                    inletUid,
                    inletSystemUid,
                    outletUid,
                    outletSystemUid,

                    name: title,
                    type: EntityType.PLANT,

                    widthMM: null,
                    heightMM: null,
                    heightAboveFloorM: null,
                    outletTemperatureC: null,

                    plant: createPlant(type, returnUid, gasNodeUid),

                    calculation: {
                        widthMM: null,
                        depthMM: null,
                    }
                };

                context.$store.dispatch("document/addEntity", newEntity);

                const filled = fillPlantDefaults(
                    newEntity,
                    context.document.drawing,
                    context.effectiveCatalog,
                );

                const inlet: SystemNodeEntity = {
                    center: {
                        x: (-filled.widthMM! / 2) * (rightToLeft ? -1 : 1),
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
                        x: (filled.widthMM! / 2) * (rightToLeft ? -1 : 1),
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
                            x: (filled.widthMM! / 2) * (rightToLeft ? -1 : 1),
                            y: (filled.heightMM! / 4)
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
                            x: (-filled.widthMM! / 2) * (rightToLeft ? -1 : 1),
                            y: (filled.heightMM! / 4)
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

function createPlant(
    type: PlantType,
    returnUid: string | null,
    gasInUid: string | null,
): PlantConcrete {
    let plant = {
        type
    } as PlantConcrete;

    switch (plant.type) {
        case PlantType.RETURN_SYSTEM:
            plant = {
                ...plant,
                returnMinimumTemperatureC: null,
                gasConsumptionMJH: null,
                returnUid: returnUid!,
                gasNodeUid: gasInUid!,
                gasPressureKPA: null,
                returnVelocityMS: null,
                addReturnToPSDFlowRate: true,
                rheemVariant: null,
                rheemPeakHourCapacity: null,
                rheemMinimumInitialDelivery: null,
                rheemkWRating: null,
                rheemStorageTankSize: null,
            };

            break;
        case PlantType.PUMP:
            plant = {
                ...plant,
                pressureLoss: {
                    pressureMethod: PressureMethod.PUMP_DUTY,
                    pumpPressureKPA: null,
                }
            };

            break;
        case PlantType.TANK:
            plant = {
                ...plant,
                pressureLoss: {
                    pressureMethod: PressureMethod.STATIC_PRESSURE,
                    staticPressureKPA: null,
                }
            };

            break;
        case PlantType.CUSTOM:
            plant = {
                ...plant,
                pressureLoss: {
                    pressureMethod: PressureMethod.FIXED_PRESSURE_LOSS,
                    pressureLossKPA: null,
                    staticPressureKPA: null,
                    pumpPressureKPA: null,
                }
            };

            break;
        case PlantType.DRAINAGE_PIT:
            plant = {
                ...plant,
                pressureLoss: {
                    pressureMethod: PressureMethod.STATIC_PRESSURE,
                    staticPressureKPA: 0,
                },
            };

            break;
        case PlantType.DRAINAGE_GREASE_INTERCEPTOR_TRAP:
            plant = {
                ...plant,
                pressureLoss: {
                    pressureMethod: PressureMethod.STATIC_PRESSURE,
                    staticPressureKPA: 0,
                },
                lengthMM: null,
                location: null,
                position: null,
                capacity: null,
            };

            break;
        default:
            assertUnreachable(plant);
    }

    return plant;
}
