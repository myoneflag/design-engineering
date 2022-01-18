import {MainEventBus} from "../../../src/store/main-event-bus";
import RiserEntity from "../../../../common/src/api/document/entities/riser-entity";
import {EntityType} from "../../../../common/src/api/document/entities/types";
import uuid from "uuid";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import {InteractionType} from "../../../src/htmlcanvas/lib/interaction";
import {Coord, FlowSystemParameters, NetworkType} from "../../../../common/src/api/document/drawing";
import {cloneSimple} from "../../../../common/src/lib/utils";
import {moveOnto} from "../lib/black-magic/move-onto";
import {BaseBackedConnectable} from "../lib/BackedConnectable";
import SnappingInsertTool, {CONNECTABLE_SNAP_RADIUS_PX} from "./snapping-insert-tool";

export default function insertRiser(context: CanvasContext, system: FlowSystemParameters, isVent: boolean | undefined) {
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
            (wc: Coord) => {
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
                        if (isVent) {
                            // Vents should only connect to other vents
                            if (o[0].type === EntityType.PIPE) {
                                if (o[0].network !== NetworkType.CONNECTIONS) {
                                    return false;
                                }
                            }
                        }
                        return o[0].type === EntityType.FITTING || o[0].type === EntityType.PIPE;
                    }
                );

                const connections: string[] = [];

                const newEntity: RiserEntity = {
                    bottomHeightM: null,
                    topHeightM: null,
                    center: cloneSimple(wc),
                    color: null,
                    material: null,
                    maximumVelocityMS: null,
                    calculationHeightM: null,
                    parentUid: null,
                    diameterMM: null,
                    systemUid: system.uid,
                    temperatureC: null,
                    type: EntityType.RISER,
                    isVent: !!isVent,
                    uid: newUid, 
                    entityName: null
                };

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
            "Insert Flow Source"
        )
    );
}
