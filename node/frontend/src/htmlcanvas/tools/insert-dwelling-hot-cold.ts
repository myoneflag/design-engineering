import { MainEventBus } from "../../../src/store/main-event-bus";
import PointTool from "../../../src/htmlcanvas/tools/point-tool";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import uuid from "uuid";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import { InteractionType } from "../../../src/htmlcanvas/lib/interaction";
import Pipe from "../../../src/htmlcanvas/objects/pipe";
import BackedDrawableObject from "../../../src/htmlcanvas/lib/backed-drawable-object";
import { ConnectableEntityConcrete } from "../../../../common/src/api/document/entities/concrete-entity";
import LoadNodeEntity, { NodeType } from "../../../../common/src/api/document/entities/load-node-entity";
import FittingEntity from "../../../../common/src/api/document/entities/fitting-entity";
import Fitting from "../objects/fitting";
import { Coord } from "../../../../common/src/api/document/drawing";
import { cloneSimple } from "../../../../common/src/lib/utils";
import { moveOnto } from "../lib/black-magic/move-onto";
import { BaseBackedConnectable } from "../lib/BackedConnectable";
import { KeyCode } from "../utils";
import { StandardFlowSystemUids } from "../../store/catalog";
import Flatten from "@flatten-js/core";

export const DWELLING_PAIR_DEFAULT_DISTANCE_MM = 200;

export default function insertDwellingHotCold(context: CanvasContext, rotationDEG: number) {
    const coldUid = uuid();
    const hotUid = uuid();
    MainEventBus.$emit(
        "set-tool-handler",
        new PointTool(
            (interrupted, displaced) => {
                if (interrupted) {
                    context.$store.dispatch("document/revert");
                    if (!displaced) {
                        MainEventBus.$emit("set-tool-handler", null);
                    }
                } else {
                    insertDwellingHotCold(context, rotationDEG);
                }
            },
            (wc: Coord) => {
                // Preview
                context.$store.dispatch("document/revert", false).then(() => {
                    const coldLoc = Flatten.vector(DWELLING_PAIR_DEFAULT_DISTANCE_MM, 0)
                        .rotate((rotationDEG / 180) * Math.PI)
                        .add(Flatten.vector(wc.x, wc.y));
                    const hotLoc = Flatten.vector(-DWELLING_PAIR_DEFAULT_DISTANCE_MM, 0)
                        .rotate((rotationDEG / 180) * Math.PI)
                        .add(Flatten.vector(wc.x, wc.y));

                    const hotEntity: LoadNodeEntity = {
                        node: {
                            type: NodeType.DWELLING,
                            dwellings: 1,
                            continuousFlowLS: 0
                        },
                        systemUidOption: StandardFlowSystemUids.HotWater,
                        center: { x: hotLoc.x, y: hotLoc.y },
                        color: null,
                        calculationHeightM: null,
                        parentUid: null,
                        type: EntityType.LOAD_NODE,
                        linkedToUid: coldUid,
                        uid: hotUid
                    };

                    const coldEntity: LoadNodeEntity = {
                        node: {
                            type: NodeType.DWELLING,
                            dwellings: 1,
                            continuousFlowLS: 0
                        },
                        systemUidOption: StandardFlowSystemUids.ColdWater,
                        center: { x: coldLoc.x, y: coldLoc.y },
                        color: null,
                        calculationHeightM: null,
                        parentUid: null,
                        type: EntityType.LOAD_NODE,
                        linkedToUid: null,
                        uid: coldUid
                    };

                    context.$store.dispatch("document/addEntity", hotEntity);
                    context.$store.dispatch("document/addEntity", coldEntity);
                    // rebaseAll(context);

                    context.scheduleDraw();
                });
            },
            () => {
                context.$store.dispatch("document/validateAndCommit").then(() => {
                    // Notify the user that there's fields to select
                });
            },
            "Insert Load Node",
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
                                rotationDEG += 1;
                            } else {
                                rotationDEG += 90;
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
                                rotationDEG -= 1;
                            } else {
                                rotationDEG -= 90;
                            }
                            onRefresh();
                        }
                    }
                ]
            ]
        )
    );
}
