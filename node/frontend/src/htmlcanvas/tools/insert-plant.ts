import { DocumentState } from "../../../src/store/document/types";
import { MainEventBus } from "../../../src/store/main-event-bus";
import PointTool from "../../../src/htmlcanvas/tools/point-tool";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import uuid from "uuid";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import {
    FlowConfiguration,
    SystemNodeEntity
} from "../../../../common/src/api/document/entities/big-valve/big-valve-entity";
import { StandardFlowSystemUids } from "../../../src/store/catalog";
import { KeyCode } from "../../../src/htmlcanvas/utils";
import PlantEntity, { PressureMethod } from "../../../../common/src/api/document/entities/plant-entity";
import { Coord } from "../../../../common/src/api/document/drawing";

export default function insertPlant(context: CanvasContext, angle: number, rightToLeft: boolean = false) {
    const plantUid = uuid();
    let newEntity: PlantEntity | null = null;

    const inletUid = uuid();
    const outletUid = uuid();

    MainEventBus.$emit(
        "set-tool-handler",
        new PointTool(
            async (interrupted, displaced) => {
                if (interrupted) {
                    context.$store.dispatch("document/revert");
                    if (!displaced) {
                        MainEventBus.$emit("set-tool-handler", null);
                    }
                } else {
                    insertPlant(context, angle);
                }
            },
            (wc: Coord) => {
                newEntity = null;
                // Preview
                context.$store.dispatch("document/revert", false);
                const doc = context.document as DocumentState;

                newEntity = {
                    heightAboveFloorM: 0.75,
                    heightMM: 300,
                    widthMM: 500,
                    inletSystemUid: StandardFlowSystemUids.ColdWater,
                    inletUid,
                    pressureLossKPA: null,
                    staticPressureKPA: null,
                    pumpPressureKPA: null,
                    pressureMethod: PressureMethod.FIXED_PRESSURE_LOSS,
                    outletSystemUid: StandardFlowSystemUids.HotWater,
                    outletUid,
                    center: wc,

                    rightToLeft,

                    parentUid: null,
                    type: EntityType.PLANT,
                    uid: plantUid,

                    name: "Plant",
                    rotation: angle,
                };

                context.$store.dispatch("document/addEntity", newEntity);

                const inlet: SystemNodeEntity = {
                    center: {
                        x: -newEntity.widthMM / 2 * (rightToLeft ? -1 : 1),
                        y: 0
                    },
                    parentUid: plantUid,
                    type: EntityType.SYSTEM_NODE,
                    calculationHeightM: null,
                    systemUid: StandardFlowSystemUids.ColdWater,
                    uid: inletUid,
                    allowAllSystems: false,
                    configuration: FlowConfiguration.INPUT
                };

                const outlet: SystemNodeEntity = {
                    center: {
                        x: newEntity.widthMM / 2 * (rightToLeft ? -1 : 1),
                        y: 0
                    },
                    parentUid: plantUid,
                    type: EntityType.SYSTEM_NODE,
                    calculationHeightM: null,
                    systemUid: StandardFlowSystemUids.HotWater,
                    uid: outletUid,
                    allowAllSystems: false,
                    configuration: FlowConfiguration.OUTPUT
                };

                context.$store.dispatch('document/addEntity', inlet);
                context.$store.dispatch('document/addEntity', outlet);

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
