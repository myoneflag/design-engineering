import { MainEventBus } from "../../../src/store/main-event-bus";
import PointTool from "../../../src/htmlcanvas/tools/point-tool";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import uuid from "uuid";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import { InteractionType } from "../../../src/htmlcanvas/lib/interaction";
import FlowSourceEntity from "../../../../common/src/api/document/entities/flow-source-entity";
import { Coord, FlowSystemParameters } from "../../../../common/src/api/document/drawing";
import { cloneSimple } from "../../../../common/src/lib/utils";
import { moveOnto } from "../lib/black-magic/move-onto";
import { BaseBackedConnectable } from "../lib/BackedConnectable";
import SnappingInsertTool, { CONNECTABLE_SNAP_RADIUS_PX } from "./snapping-insert-tool";

export default function insertFlowSource(context: CanvasContext, system: FlowSystemParameters) {
    const newUid = uuid();
    MainEventBus.$emit(
        "set-tool-handler",
        new SnappingInsertTool(
            (interrupted, displaced) => {
                if (interrupted) {
                    context.$store.dispatch("document/revert");
                }
                if (!displaced) {
                    MainEventBus.$emit("set-tool-handler", null);
                }
            },
            async (wc: Coord) => {
                // Preview
                const interactive = context.offerInteraction(
                    {
                        entityType: EntityType.RISER,
                        worldCoord: wc,
                        systemUid: system.uid,
                        worldRadius: context.viewPort.toWorldLength(CONNECTABLE_SNAP_RADIUS_PX),
                        type: InteractionType.INSERT
                    },
                    (o) => {
                        return o[0].type === EntityType.FITTING || o[0].type === EntityType.PIPE;
                    },
                    (o) => o[0].type === EntityType.FITTING
                );

                const connections: string[] = [];

                const newEntity: FlowSourceEntity = {
                    center: cloneSimple(wc),
                    color: null,
                    calculationHeightM: null,
                    parentUid: null,
                    systemUid: system.uid,
                    type: EntityType.FLOW_SOURCE,
                    heightAboveGroundM: null,
                    minPressureKPA: null,
                    maxPressureKPA: null,
                    uid: newUid, 
                    entityName: null
                };

                await context.$store.dispatch("document/addEntity", newEntity);

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
                    MainEventBus.$emit("select", { uid: newUid, property: null, recenter: false });
                });
            },
            "Insert Flow Source"
        )
    );
}
