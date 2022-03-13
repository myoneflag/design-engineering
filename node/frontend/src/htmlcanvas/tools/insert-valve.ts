import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import { MainEventBus } from "../../../src/store/main-event-bus";
import PointTool from "../../../src/htmlcanvas/tools/point-tool";
import { InteractionType } from "../../../src/htmlcanvas/lib/interaction";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import Pipe from "../../../src/htmlcanvas/objects/pipe";
import { addValveAndSplitPipe } from "../../../src/htmlcanvas/lib/black-magic/split-pipe";
import { FlowSystemParameters } from "../../../../common/src/api/document/drawing";
import SnappingInsertTool, { CONNECTABLE_SNAP_RADIUS_PX } from "./snapping-insert-tool";

export default function insertValve(context: CanvasContext, system: FlowSystemParameters) {
    let pipe: Pipe | null = null;

    MainEventBus.$emit(
        "set-tool-handler",
        new SnappingInsertTool(
            async (interrupted, displaced) => {
                MainEventBus.$emit("set-tool-handler", null);
                if (interrupted) {
                    await context.$store.dispatch("document/revert");
                } else {
                    if (!displaced) {
                        insertValve(context, system);
                    }
                }
            },
            async (wc, event) => {
                context.offerInteraction(
                    {
                        type: InteractionType.INSERT,
                        entityType: EntityType.FITTING,
                        worldCoord: wc,
                        systemUid: system.uid,
                        worldRadius: context.viewPort.toWorldLength(CONNECTABLE_SNAP_RADIUS_PX),
                    },
                    (drawable) => {
                        return drawable[0].type === EntityType.PIPE;
                    }
                );

                if (context.interactive && context.interactive.length) {
                    const pipeE = context.interactive[0];
                    pipe = context.globalStore.get(pipeE.uid) as Pipe;
                    // Project onto pipe
                    addValveAndSplitPipe(context, pipe, wc, system.uid, 50);
                } else {
                    pipe = null;
                }

                context.scheduleDraw();
            },
            (worldCoord, event) => {
                context.interactive = null;
                context.$store.dispatch("document/validateAndCommit").then(() => {
                    /**/
                });
            },
            "Insert"
        )
    );
}
