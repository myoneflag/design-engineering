import { DocumentState } from "../../../src/store/document/types";
import { MainEventBus } from "../../../src/store/main-event-bus";
import PointTool from "../../../src/htmlcanvas/tools/point-tool";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import uuid from "uuid";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import { getInsertCoordsAt } from "../../../src/htmlcanvas/lib/utils";
import FixtureEntity from "../../../../common/src/api/document/entities/fixtures/fixture-entity";
import {
    FlowConfiguration,
    SystemNodeEntity
} from "../../../../common/src/api/document/entities/big-valve/big-valve-entity";
import { KeyCode } from "../../../src/htmlcanvas/utils";
import { StandardFlowSystemUids, SupportedPsdStandards } from "../../../../common/src/api/config";
import { Coord } from "../../../../common/src/api/document/drawing";
import { parseCatalogNumberExact } from "../../../../common/src/lib/utils";
import SnappingInsertTool from "./snapping-insert-tool";
import connectLoadNodeToSource from "../lib/black-magic/connect-load-node-to-source";
import LoadNode from "../objects/load-node";
import GasApplianceEntity from "../../../../common/src/api/document/entities/gas-appliance";

export default function insertGasAppliance(context: CanvasContext, angle: number) {
    const gasApplianceUuid = uuid();
    let newEntity: GasApplianceEntity | null = null;
    const abbreviation = '';

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
                    insertGasAppliance(context, angle);
                }
            },
            (wc: Coord, event) => {
                newEntity = null;
                // Preview
                const doc = context.document as DocumentState;

                newEntity = {
                    abbreviation,
                    center: wc,
                    parentUid: null,
                    type: EntityType.GAS_APPLIANCE,
                    uid: gasApplianceUuid,


                    name: "Enter Name",
                    outletAboveFloorM: 0.7,
                    rotation: angle,
                    inletUid: uuid(),
                    inletPressureKPA: null,
                    widthMM: 750,
                    heightMM: 750,
                    flowRateMJH: null,
                };


                context.$store.dispatch("document/addEntity", newEntity);

                const snEntity: SystemNodeEntity = {
                    center: {
                        x: 0,
                        y: 0
                    },
                    parentUid: gasApplianceUuid,
                    type: EntityType.SYSTEM_NODE,
                    calculationHeightM: null,
                    allowAllSystems: false,
                    systemUid: StandardFlowSystemUids.Gas,
                    uid: newEntity.inletUid,
                    configuration: FlowConfiguration.INPUT
                };
                context.$store.dispatch("document/addEntity", snEntity);

                context.scheduleDraw();
            },
            (wc: Coord) => {
                context.$store.dispatch("document/validateAndCommit").then(() => {
                    /**/
                });
            },
            "Insert Gas Appliance",
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
                ]
            ]
        )
    );
}
