import { MainEventBus } from "../../../src/store/main-event-bus";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import uuid from "uuid";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import { InteractionType } from "../../../src/htmlcanvas/lib/interaction";
import LoadNodeEntity, { NodeType, NodeVariant } from "../../../../common/src/api/document/entities/load-node-entity";
import { Coord } from "../../../../common/src/api/document/drawing";
import { cloneSimple } from "../../../../common/src/lib/utils";
import { moveOnto } from "../lib/black-magic/move-onto";
import { BaseBackedConnectable } from "../lib/BackedConnectable";
import SnappingInsertTool, { CONNECTABLE_SNAP_RADIUS_PX } from "./snapping-insert-tool";
import connectLoadNodeToSource from "../lib/black-magic/connect-load-node-to-source";
import LoadNode from "../objects/load-node";
import { KeyCode } from "../utils";

export default function insertLoadNode(context: CanvasContext, type: NodeType, systemUid: string | null,
    loadingUnits: number = 1, continuousFlowLS: number = 0, dwellings: number = 1,
    variant: NodeVariant) {
    const newUid = uuid();

    MainEventBus.$emit(
        "set-tool-handler",
        new SnappingInsertTool(
            (interrupted, displaced) => {
                if (interrupted) {
                    context.$store.dispatch("document/revert");
                    if (!displaced) {
                        MainEventBus.$emit("set-tool-handler", null);
                    }
                } else {
                    insertLoadNode(context, type, systemUid, loadingUnits, continuousFlowLS, dwellings, variant);
                }
            },
            (wc: Coord, event) => {
                // Preview
                const interactive = context.offerInteraction(
                    {
                        entityType: EntityType.LOAD_NODE,
                        worldCoord: wc,
                        systemUid: systemUid,
                        worldRadius: context.viewPort.toWorldLength(CONNECTABLE_SNAP_RADIUS_PX),
                        type: InteractionType.INSERT
                    },
                    (o) => {
                        return (
                            o[0].type === EntityType.FITTING &&
                            context.globalStore.getConnections(o[0].uid).length <= 1
                        );
                    }
                );

                let newEntity: LoadNodeEntity = {
                    node: {
                        type: NodeType.LOAD_NODE,
                        continuousFlowLS,
                        designFlowRateLS: 0,
                        gasFlowRateMJH: 0,
                        gasPressureKPA: null,
                        asnzFixtureUnits: 0,
                        enDischargeUnits: 0,
                        upcFixtureUnits: 0,
                        loadingUnits,
                        variant: variant,
                        diversity: 0,
                    },
                    minPressureKPA: null,
                    maxPressureKPA: null,
                    systemUidOption: systemUid,
                    center: cloneSimple(wc),
                    color: null,
                    calculationHeightM: null,
                    parentUid: null,
                    type: EntityType.LOAD_NODE,
                    linkedToUid: null,
                    uid: newUid,
                    name: '',
                };

                context.$store.dispatch("document/addEntity", newEntity);

                if (interactive) {
                    moveOnto(
                        context.globalStore.get(newEntity.uid)! as BaseBackedConnectable,
                        context.globalStore.get(interactive[0].uid)! as BaseBackedConnectable,
                        context
                    );
                }

                if (!event.ctrlKey) {
                    connectLoadNodeToSource(
                        context,
                        context.globalStore.get(newEntity.uid) as LoadNode,
                    );
                }
                // rebaseAll(context);

                context.scheduleDraw();
            },
            () => {
                context.$store.dispatch("document/validateAndCommit").then(() => {
                    // Notify the user that there's fields to select
                });
            },
            "Insert Load Node",
            [

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
