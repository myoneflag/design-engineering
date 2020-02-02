import { DocumentState} from "../../../src/store/document/types";
import { MainEventBus } from "../../../src/store/main-event-bus";
import PointTool from "../../../src/htmlcanvas/tools/point-tool";
import RiserEntity from "../../../../common/src/api/document/entities/riser-entity";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import uuid from "uuid";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import { getInsertCoordsAt } from "../../../src/htmlcanvas/lib/utils";
import { InteractionType } from "../../../src/htmlcanvas/lib/interaction";
import * as _ from "lodash";
import Pipe from "../../../src/htmlcanvas/objects/pipe";
import BackedDrawableObject from "../../../src/htmlcanvas/lib/backed-drawable-object";
import { ConnectableEntityConcrete } from "../../../../common/src/api/document/entities/concrete-entity";
import { addValveAndSplitPipe } from "../../../src/htmlcanvas/lib/black-magic/split-pipe";
import { rebaseAll } from "../../../src/htmlcanvas/lib/black-magic/rebase-all";
import { ConnectableEntity, Coord, FlowSystemParameters } from "../../../../common/src/api/document/drawing";
import { cloneSimple } from "../../../../common/src/lib/utils";
import { moveOnto } from "../lib/black-magic/move-onto";
import { BaseBackedConnectable } from "../lib/BackedConnectable";
import { cooperativeYield } from "../utils";

export default function insertRiser(context: CanvasContext, system: FlowSystemParameters) {
    const newUid = uuid();
    MainEventBus.$emit(
        "set-tool-handler",
        new PointTool(
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
                context.$store.dispatch("document/revert", false).then(() => {
                    const interactive = context.offerInteraction(
                        {
                            entityType: EntityType.RISER,
                            worldCoord: wc,
                            systemUid: system.uid,
                            worldRadius: 10,
                            type: InteractionType.INSERT
                        },
                        (o) => {
                            return o[0].type === EntityType.FITTING || o[0].type === EntityType.PIPE;
                        }
                    );

                    let connections: string[] = [];

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
                        uid: newUid
                    };

                    context.$store.dispatch("document/addEntity", newEntity);

                    if (interactive) {
                        moveOnto(
                            context.globalStore.get(newEntity.uid)! as BaseBackedConnectable,
                            context.globalStore.get(interactive[0].uid)! as BaseBackedConnectable,
                            context,
                        );
                    }

                    // rebaseAll(context);

                    context.scheduleDraw();
                });
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
