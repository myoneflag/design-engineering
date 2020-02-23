import { DocumentState } from "../../../src/store/document/types";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import { InteractionType } from "../../../src/htmlcanvas/lib/interaction";
import { MainEventBus } from "../../../src/store/main-event-bus";
import PointTool from "../../../src/htmlcanvas/tools/point-tool";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import FittingEntity from "../../../../common/src/api/document/entities/fitting-entity";
import uuid from "uuid";
import PipeEntity from "../../../../common/src/api/document/entities/pipe-entity";
import { maxHeightOfConnection } from "../../../src/htmlcanvas/lib/utils";
import BackedDrawableObject from "../../../src/htmlcanvas/lib/backed-drawable-object";
import Connectable from "../../../src/htmlcanvas/lib/object-traits/connectable";
import Flatten from "@flatten-js/core";
import {
    ConnectableEntityConcrete,
    isConnectableEntity
} from "../../../../common/src/api/document/entities/concrete-entity";
import { addValveAndSplitPipe } from "../../../src/htmlcanvas/lib/black-magic/split-pipe";
import Pipe from "../../../src/htmlcanvas/objects/pipe";
import { SelectMode } from "../../../src/htmlcanvas/layers/layer";
import { KeyCode } from "../../../src/htmlcanvas/utils";
import { BaseBackedConnectable } from "../../../src/htmlcanvas/lib/BackedConnectable";
import {
    ConnectableEntity,
    Coord,
    FlowSystemParameters,
    NetworkType
} from "../../../../common/src/api/document/drawing";

export default function insertPipes(context: CanvasContext, system: FlowSystemParameters, network: NetworkType) {
    // strategy:
    // 1. create new pipe at click point
    // 2. endpoint of pipe is at 2nd click point and follows the move in order to preview
    // 3. clicking creates new pipe with start point the same as endpoint.
    MainEventBus.$emit(
        "set-tool-handler",
        new PointTool(
            (interrupted, displaced) => {
                if (!displaced) {
                    MainEventBus.$emit("set-tool-handler", null);
                }
            },
            (wc: Coord, event: MouseEvent) => {
                // Preview
                context.offerInteraction(
                    {
                        type: InteractionType.STARTING_PIPE,
                        system,
                        worldRadius: context.lastDrawingContext
                            ? Math.max(context.lastDrawingContext.vp.surfaceToWorldLength(3), 50)
                            : 0,
                        worldCoord: wc
                    },
                    (object) => {
                        return object[0].type !== EntityType.BACKGROUND_IMAGE;
                    }
                );
                context.scheduleDraw();
            },
            (wc: Coord, event: MouseEvent) => {
                let heightM = Number(context.document.drawing.metadata.calculationParams.ceilingPipeHeightM);

                // Preview
                const interactive = context.offerInteraction(
                    {
                        type: InteractionType.STARTING_PIPE,
                        system,
                        worldRadius: context.lastDrawingContext
                            ? Math.max(context.lastDrawingContext.vp.surfaceToWorldLength(3), 50)
                            : 0,
                        worldCoord: wc
                    },
                    (object) => {
                        return object[0].type !== EntityType.BACKGROUND_IMAGE;
                    }
                );

                // Create a valve. It will only have a single pipe, and thus be a dead-leg.
                const doc = context.document as DocumentState;
                // maybe we drew onto an existing node.
                let entity: ConnectableEntityConcrete;
                if (interactive) {
                    const target = interactive[0];
                    if (target.type === EntityType.PIPE) {
                        entity = addValveAndSplitPipe(
                            context,
                            context.globalStore.get(target.uid) as Pipe,
                            wc,
                            target.systemUid,
                            30
                        ).focus as ConnectableEntityConcrete;
                        heightM = target.heightAboveFloorM;
                    } else {
                        entity = target as ConnectableEntityConcrete;

                        const h = maxHeightOfConnection(entity, context);
                        if (h !== null) {
                            heightM = h;
                        }
                    }
                } else {
                    // Maybe we drew onto a background

                    // Nope, we landed on nothing. We create new valve here.
                    const valveEntity: FittingEntity = {
                        center: wc,
                        color: null,
                        parentUid: null,
                        calculationHeightM: null,
                        systemUid: system.uid,
                        type: EntityType.FITTING,
                        uid: uuid()
                    };
                    entity = valveEntity;
                    context.$store.dispatch("document/addEntity", valveEntity);
                    context.globalStore.get(valveEntity.uid)!.rebase(context);
                }

                context.$store.dispatch("document/commit").then(() => {
                    context.interactive = null;
                    insertPipeChain(context, entity, system, network, heightM, 0);
                });
            },
            "Start Pipe"
        )
    );
}

function insertPipeChain(
    context: CanvasContext,
    lastAttachment: ConnectableEntity,
    system: FlowSystemParameters,
    network: NetworkType,
    heightM: number,
    chainNumber: number,
) {
    let nextEntity: ConnectableEntityConcrete | FittingEntity;
    const pipeUid = uuid();
    let newPipe: PipeEntity | null = null;

    MainEventBus.$emit(
        "set-tool-handler",
        new PointTool(
            (interrupted, displaced) => {
                if (interrupted) {
                    // revert changes.
                    context.$store.dispatch("document/revert", false);

                    // it's possible that we are drawing the first connection, in which case we will have an
                    // orphaned valve. Delete it.
                }

                if (!displaced) {
                    MainEventBus.$emit("set-tool-handler", null);
                    // stamp and draw another pipe
                    insertPipes(context, system, network);
                }
            },
            (wc: Coord, event: MouseEvent) => {
                newPipe = null;
                context.$store.dispatch("document/revert", false);

                // create pipe
                // maybe we drew onto an existing node.

                const interactive = context.offerInteraction(
                    {
                        type: InteractionType.STARTING_PIPE,
                        system,
                        worldRadius: context.lastDrawingContext
                            ? Math.max(context.lastDrawingContext.vp.surfaceToWorldLength(3), 50)
                            : 0,
                        worldCoord: wc
                    },
                    // the current pipe is in an invalid state so don't include that.
                    (g) => g[0].uid !== pipeUid && g[0].uid !== lastAttachment.uid,
                    ([obj]) => {
                        if (obj.type === EntityType.PIPE) {
                            return 0;
                        } else {
                            return 10;
                        }
                    }
                );

                if (interactive) {
                    if (interactive[0].type === EntityType.PIPE) {
                        nextEntity = addValveAndSplitPipe(
                            context,
                            context.globalStore.get(interactive[0].uid) as Pipe,
                            wc,
                            system.uid,
                            30
                        ).focus as ConnectableEntityConcrete;
                    } else if (isConnectableEntity(interactive[0])) {
                        nextEntity = interactive[0] as ConnectableEntityConcrete;
                        context.document.uiState.selectedUids.splice(0);
                        context.document.uiState.selectedUids.push(interactive[0].uid);
                    } else {
                        throw new Error("Don't know how to handle this");
                    }
                } else {
                    // Create an endpoint fitting for it instead
                    context.document.uiState.selectedUids.splice(0);
                    if (!event.shiftKey) {
                        // Snap onto a direction.

                        const bases = [Flatten.vector(0, 1)];
                        const connectable = context.globalStore.get(lastAttachment.uid) as BackedDrawableObject<
                            ConnectableEntityConcrete
                        > &
                            Connectable;

                        const lawc = connectable.fromParentToWorldCoord(lastAttachment.center);
                        const lawcp = Flatten.point(lawc.x, lawc.y);
                        const wcp = Flatten.point(wc.x, wc.y);
                        connectable.getRadials(pipeUid).forEach(([radialWc, obj]) => {
                            // right now, we don't need a uid check because we are guaranteed that the state was
                            // reset.
                            bases.push(Flatten.vector(lawcp, Flatten.point(radialWc.x, radialWc.y)));
                        });

                        let bestPoint: [number, Flatten.Point] = [Infinity, wcp];
                        bases.forEach((dirVec) => {
                            for (let i = 0; i < 4; i++) {
                                const contextPoint = wcp.projectionOn(Flatten.line(lawcp, dirVec));
                                const dist = contextPoint.distanceTo(wcp)[0];
                                if (dist < bestPoint[0]) {
                                    bestPoint = [dist, contextPoint];
                                }
                                dirVec = dirVec.rotate90CCW();
                            }
                        });

                        wc.x = bestPoint[1].x;
                        wc.y = bestPoint[1].y;
                    }

                    // Create 2nd valve
                    nextEntity = {
                        center: wc,
                        color: null,
                        parentUid: null,
                        calculationHeightM: null,
                        systemUid: system.uid,
                        type: EntityType.FITTING,
                        uid: uuid()
                    };

                    context.$store.dispatch("document/addEntity", nextEntity);
                    context.globalStore.get(nextEntity.uid)!.rebase(context);
                }

                const pipe: PipeEntity = {
                    color: null,
                    diameterMM: null,
                    lengthM: null,
                    endpointUid: [lastAttachment.uid, nextEntity.uid],
                    heightAboveFloorM: heightM,
                    material: null,
                    maximumVelocityMS: null,
                    parentUid: null,
                    systemUid: system.uid,
                    network,
                    type: EntityType.PIPE,
                    uid: pipeUid
                };
                newPipe = pipe;

                context.$store.dispatch("document/addEntity", pipe);

                context.scheduleDraw();
            },

            (wc: Coord) => {
                context.interactive = null;
                // committed to the point. And also create new pipe, continue the chain.
                context.$store.dispatch("document/validateAndCommit").then(() => {
                    const currConns = context.globalStore.getConnections(nextEntity.uid).length;
                    const maxConns =
                        (context.globalStore.get(nextEntity.uid) as BaseBackedConnectable).maximumConnections;
                    if (maxConns === null || currConns < maxConns) {
                        insertPipeChain(context, nextEntity, system, network, heightM, chainNumber + 1);
                    }

                });
            },

            "Set Pipe",
            [
                [
                    KeyCode.UP,
                    {
                        name: "Raise Height",
                        fn: () => {
                            heightM += 0.05;
                            if (newPipe) {
                                newPipe.heightAboveFloorM = heightM;
                            }
                            context.scheduleDraw();
                        }
                    }
                ],
                [
                    KeyCode.DOWN,
                    {
                        name: "Drop Height",
                        fn: () => {
                            heightM -= 0.05;
                            if (newPipe) {
                                newPipe.heightAboveFloorM = heightM;
                            }
                            context.scheduleDraw();
                        }
                    }
                ]
            ],
            () => {
                if (newPipe && context.globalStore.has(newPipe.uid)) {
                    return [
                        "Height: " + heightM.toPrecision(3) + "m",
                        "Length: " +
                            (context.globalStore.get(newPipe.uid) as Pipe).computedLengthM.toPrecision(4) +
                            "m"
                    ];
                } else {
                    return [];
                }
            }
        )
    );
}
