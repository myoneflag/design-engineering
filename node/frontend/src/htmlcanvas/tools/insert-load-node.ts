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
import SnappingInsertTool, { CONNECTABLE_SNAP_RADIUS_PX } from "./snapping-insert-tool";

export default function insertLoadNode(context: CanvasContext, type: NodeType) {
    const newUid = uuid();
    const toReplace: BackedDrawableObject<ConnectableEntityConcrete> | null = null;
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
                    insertLoadNode(context, type);
                }
            },
            (wc: Coord) => {
                // Preview
                const interactive = context.offerInteraction(
                    {
                        entityType: EntityType.LOAD_NODE,
                        worldCoord: wc,
                        systemUid: null,
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

                const connections: string[] = [];

                let newEntity: LoadNodeEntity;
                switch (type) {
                    case NodeType.LOAD_NODE:
                        newEntity = {
                            node: {
                                type: NodeType.LOAD_NODE,
                                continuousFlowLS: 0,
                                designFlowRateLS: 0,
                                loadingUnits: 1
                            },
                            systemUidOption: null,
                            center: cloneSimple(wc),
                            color: null,
                            calculationHeightM: null,
                            parentUid: null,
                            type: EntityType.LOAD_NODE,
                            linkedToUid: null,
                            uid: newUid
                        };

                        break;
                    case NodeType.DWELLING:
                        newEntity = {
                            node: {
                                type: NodeType.DWELLING,
                                dwellings: 1,
                                continuousFlowLS: 0
                            },
                            systemUidOption: null,
                            center: cloneSimple(wc),
                            color: null,
                            calculationHeightM: null,
                            parentUid: null,
                            type: EntityType.LOAD_NODE,
                            linkedToUid: null,
                            uid: newUid
                        };
                        break;
                }

                context.$store.dispatch("document/addEntity", newEntity);

                if (interactive) {
                    moveOnto(
                        context.globalStore.get(newEntity.uid)! as BaseBackedConnectable,
                        context.globalStore.get(interactive[0].uid)! as BaseBackedConnectable,
                        context
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
            "Insert Load Node"
        )
    );
}
