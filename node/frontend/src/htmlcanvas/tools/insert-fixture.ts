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

export default function insertFixture(context: CanvasContext, fixtureName: string, angle: number) {
    const fixtureUid = uuid();
    let newEntity: FixtureEntity | null = null;
    const abbreviation = context.effectiveCatalog.fixtures[fixtureName].abbreviation;

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
                    insertFixture(context, fixtureName, angle);
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
                    type: EntityType.FIXTURE,
                    uid: fixtureUid,

                    asnzFixtureUnits: null,
                    enDischargeUnits: null,
                    upcFixtureUnits: null,

                    name: fixtureName,
                    outletAboveFloorM: null,
                    pipeDistanceMM: 200,
                    probabilityOfUsagePCT: null,
                    rotation: angle,
                    warmTempC: null,
                    roughInsInOrder: context.effectiveCatalog.fixtures[fixtureName].roughIns,
                    roughIns: {
                        /**/
                    },
                    loadingUnitVariant: null,
                    entityName: null
                };

                for (const suid of newEntity.roughInsInOrder) {
                    newEntity.roughIns[suid] = {
                        continuousFlowLS: null,
                        designFlowRateLS: null,
                        loadingUnits: null,
                        maxPressureKPA: null,
                        minPressureKPA: null,
                        allowAllSystems: false,
                        uid: uuid()
                    };
                }

                context.$store.dispatch("document/addEntity", newEntity);

                const xMat = [[], [], [0.0, 0.0], [0.0, -0.5, 0.5]];
                const yMat = [[], [], [-0.2, 0.0], [-0.2, 0.0, 0.0]];
                for (let i = 0; i < newEntity.roughInsInOrder.length; i++) {
                    const suid = newEntity.roughInsInOrder[i];
                    const snuid = newEntity.roughIns[suid].uid;
                    const snEntity: SystemNodeEntity = {
                        center: {
                            x: newEntity.pipeDistanceMM * xMat[newEntity.roughInsInOrder.length][i],
                            y: newEntity.pipeDistanceMM * yMat[newEntity.roughInsInOrder.length][i],
                        },
                        parentUid: fixtureUid,
                        type: EntityType.SYSTEM_NODE,
                        calculationHeightM: null,
                        allowAllSystems: false,
                        systemUid: suid,
                        uid: snuid,
                        configuration: FlowConfiguration.INPUT
                    };
                    context.$store.dispatch("document/addEntity", snEntity);
                }

                context.globalStore.get(newEntity.uid)!.rebase(context);

                context.scheduleDraw();
            },
            (wc: Coord) => {
                context.$store.dispatch("document/validateAndCommit").then(() => {
                    /**/
                });
            },
            "Insert Fixture",
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
