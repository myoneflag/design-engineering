import { DocumentState } from "../../../src/store/document/types";
import { MainEventBus } from "../../../src/store/main-event-bus";
import PointTool from "../../../src/htmlcanvas/tools/point-tool";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import uuid from "uuid";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import { getInsertCoordsAt} from "../../../src/htmlcanvas/lib/utils";
import FixtureEntity from "../../../../common/src/api/document/entities/fixtures/fixture-entity";
import { FlowConfiguration, SystemNodeEntity } from "../../../../common/src/api/document/entities/big-valve/big-valve-entity";
import { StandardFlowSystemUids } from "../../../src/store/catalog";
import { KeyCode } from "../../../src/htmlcanvas/utils";
import PlantEntity from "../../../../common/src/api/document/entities/plant-entity";
import FlowSystems from "../../views/settings/FlowSystems.vue";
import { SupportedPsdStandards } from "../../../../common/src/api/config";
import { Coord } from "../../../../common/src/api/document/drawing";
import { parseCatalogNumberExact } from "../../../../common/src/lib/utils";

export default function insertPlant(context: CanvasContext, angle: number) {
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
                    outletSystemUid: StandardFlowSystemUids.HotWater,
                    outletUid,
                    pumpPressureKPA: null,
                    center: wc,

                    parentUid: null,
                    type: EntityType.PLANT,
                    uid: plantUid,

                    name: "Plant",
                    rotation: angle,
                    makeStaticPressure: false,
                };

                context.$store.dispatch("document/addEntity", newEntity);

                const inlet: SystemNodeEntity = {
                    center: {
                        x: -newEntity.widthMM / 2,
                        y: 0
                    },
                    parentUid: plantUid,
                    type: EntityType.SYSTEM_NODE,
                    calculationHeightM: null,
                    systemUid: StandardFlowSystemUids.ColdWater,
                    uid: inletUid,
                    configuration: FlowConfiguration.INPUT
                };

                const outlet: SystemNodeEntity = {
                    center: {
                        x: newEntity.widthMM / 2,
                        y: 0
                    },
                    parentUid: plantUid,
                    type: EntityType.SYSTEM_NODE,
                    calculationHeightM: null,
                    systemUid: StandardFlowSystemUids.HotWater,
                    uid: outletUid,
                    configuration: FlowConfiguration.OUTPUT
                };

                context.$store.dispatch('document/addEntity', inlet);
                context.$store.dispatch('document/addEntity', outlet);

                context.objectStore.get(newEntity.uid)!.rebase(context);
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
                ]
            ]
        )
    );
}
