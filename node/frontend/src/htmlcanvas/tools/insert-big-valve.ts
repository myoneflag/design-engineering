import { DocumentState } from "../../../src/store/document/types";
import { MainEventBus } from "../../../src/store/main-event-bus";
import PointTool from "../../../src/htmlcanvas/tools/point-tool";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import uuid from "uuid";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import BigValveEntity, {
    BigValveType,
    FlowConfiguration,
    RpzdHotColdValve,
    SystemNodeEntity,
    TemperingValve,
    TmvValve
} from "../../../../common/src/api/document/entities/big-valve/big-valve-entity";
import { StandardFlowSystemUids } from "../../../src/store/catalog";
import BigValve from "../objects/big-valve/bigValve";
import { KeyCode } from "../../../src/htmlcanvas/utils";
import connectBigValveToSource from "../lib/black-magic/connect-big-valve-to-source";
import { assertUnreachable } from "../../../../common/src/api/config";
import { Coord } from "../../../../common/src/api/document/drawing";

export default function insertBigValve(context: CanvasContext, bigValveType: BigValveType, angle: number) {
    const tmvUid = uuid();
    const coldUid = uuid();
    const hotUid = uuid();
    const hotOutUid = uuid();
    const warmUid = uuid();
    const coldOutUid = uuid();

    MainEventBus.$emit(
        "set-tool-handler",
        new PointTool(
            (interrupted, displaced) => {
                if (interrupted) {
                    context.$store.dispatch("document/revert");
                }
                if (!displaced) {
                    MainEventBus.$emit("set-tool-handler", null);
                    if (!interrupted) {
                        // stamp
                        insertBigValve(context, bigValveType, angle);
                    }
                }
            },
            (wc: Coord, event) => {
                context.$store.dispatch("document/revert", false);

                const doc = context.document as DocumentState;

                let outputs: Array<[StandardFlowSystemUids, string]>;
                let valve: TmvValve | RpzdHotColdValve | TemperingValve;
                switch (bigValveType) {
                    case BigValveType.TMV:
                        valve = {
                            type: BigValveType.TMV,
                            warmOutputUid: warmUid,
                            coldOutputUid: coldOutUid,
                            catalogId: "tmv"
                        };
                        break;
                    case BigValveType.RPZD_HOT_COLD:
                        valve = {
                            type: BigValveType.RPZD_HOT_COLD,
                            hotOutputUid: hotOutUid,
                            coldOutputUid: coldOutUid,
                            catalogId: "RPZD"
                        };
                        break;
                    case BigValveType.TEMPERING:
                        valve = {
                            type: BigValveType.TEMPERING,
                            warmOutputUid: warmUid,
                            catalogId: "temperingValve"
                        };
                        break;
                    default:
                        assertUnreachable(bigValveType);
                        throw new Error("Type check valve");
                }

                const newBigValve: BigValveEntity = {
                    coldRoughInUid: coldUid,
                    hotRoughInUid: hotUid,

                    maxFlowRateLS: null,
                    maxHotColdPressureDifferentialPCT: null,
                    maxInletPressureKPA: null,
                    minFlowRateLS: null,
                    minInletPressureKPA: null,
                    pipeDistanceMM: 150,
                    rotation: angle,
                    valveLengthMM: 200,

                    valve,

                    type: EntityType.BIG_VALVE,
                    center: wc,
                    heightAboveFloorM: 1,
                    parentUid: null,
                    outputTemperatureC: 50,
                    uid: tmvUid
                };


                const newCold: SystemNodeEntity = {
                    center: { x: newBigValve.pipeDistanceMM / 2, y: 0 },
                    parentUid: tmvUid,
                    type: EntityType.SYSTEM_NODE,
                    systemUid: StandardFlowSystemUids.ColdWater,
                    calculationHeightM: null,
                    uid: coldUid,
                    allowAllSystems: false,
                    configuration: FlowConfiguration.INPUT
                };

                const newHot: SystemNodeEntity = {
                    center: { x: -newBigValve.pipeDistanceMM / 2, y: 0 },
                    parentUid: tmvUid,
                    type: EntityType.SYSTEM_NODE,
                    calculationHeightM: null,
                    systemUid: StandardFlowSystemUids.HotWater,
                    uid: hotUid,
                    allowAllSystems: false,
                    configuration: FlowConfiguration.INPUT
                };

                [newBigValve, newCold, newHot].forEach((e) => {
                    context.$store.dispatch("document/addEntity", e);
                });

                switch (bigValveType) {
                    case BigValveType.TMV:
                        outputs = [
                            [StandardFlowSystemUids.WarmWater, warmUid],
                            [StandardFlowSystemUids.ColdWater, coldOutUid]
                        ];
                        break;
                    case BigValveType.TEMPERING:
                        outputs = [[StandardFlowSystemUids.WarmWater, warmUid]];
                        break;
                    case BigValveType.RPZD_HOT_COLD:
                        outputs = [
                            [StandardFlowSystemUids.HotWater, hotOutUid],
                            [StandardFlowSystemUids.ColdWater, coldOutUid]
                        ];
                        break;
                    default:
                        assertUnreachable(bigValveType);
                        throw new Error("typeCheck outputs");
                }

                let x = (-newBigValve.pipeDistanceMM * (outputs.length - 1)) / 2;
                for (const [sysUid, nodeUid] of outputs) {
                    const newOut: SystemNodeEntity = {
                        center: { x, y: newBigValve.valveLengthMM },
                        parentUid: tmvUid,
                        type: EntityType.SYSTEM_NODE,
                        calculationHeightM: null,
                        systemUid: sysUid,
                        uid: nodeUid,
                        allowAllSystems: false,
                        configuration: FlowConfiguration.OUTPUT
                    };

                    if (bigValveType === BigValveType.TMV) {
                        newOut.center.y = newBigValve.valveLengthMM / 2;
                    }

                    x += newBigValve.pipeDistanceMM;
                    context.$store.dispatch("document/addEntity", newOut);
                }
                if (!event.ctrlKey) {
                    connectBigValveToSource(context, context.globalStore.get(newBigValve.uid) as BigValve, 20000);
                }

                context.scheduleDraw();
            },
            (wc: Coord) => {
                context.$store.dispatch("document/validateAndCommit");
            },
            "Insert TMV",
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
                    KeyCode.CONTROL,
                    {
                        name: "Don't auto-connect",
                        fn: () => {
                            /**/
                        }
                    }
                ]
            ]
        )
    );
}
