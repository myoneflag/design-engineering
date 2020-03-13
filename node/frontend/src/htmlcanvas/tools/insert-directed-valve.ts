import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import Pipe from "../../../src/htmlcanvas/objects/pipe";
import { MainEventBus } from "../../../src/store/main-event-bus";
import PointTool from "../../../src/htmlcanvas/tools/point-tool";
import { InteractionType } from "../../../src/htmlcanvas/lib/interaction";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import { addValveAndSplitPipe } from "../../../src/htmlcanvas/lib/black-magic/split-pipe";
import DirectedValveEntity from "../../../../common/src/api/document/entities/directed-valves/directed-valve-entity";
import {
    DirectedValveConcrete,
    ValveType
} from "../../../../common/src/api/document/entities/directed-valves/valve-types";
import uuid from "uuid";
import { KeyCode } from "../../../src/htmlcanvas/utils";
import DirectedValve from "../../../src/htmlcanvas/objects/directed-valve";
import { Coord, FlowSystemParameters } from "../../../../common/src/api/document/drawing";
import {
    ConnectableEntityConcrete,
    isConnectableEntity
} from "../../../../common/src/api/document/entities/concrete-entity";
import { cloneSimple } from "../../../../common/src/lib/utils";
import BackedDrawableObject from "../lib/backed-drawable-object";
import { BaseBackedConnectable } from "../lib/BackedConnectable";
import { assertUnreachable } from "../../../../common/src/api/config";

export default function insertDirectedValve(
    context: CanvasContext,
    valveType: ValveType,
    catalogId: string,
    system: FlowSystemParameters
) {
    let pipe: Pipe | null = null;
    let flipped = false;

    MainEventBus.$emit(
        "set-tool-handler",
        new PointTool(
            (interrupted, displaced) => {
                MainEventBus.$emit("set-tool-handler", null);
                if (interrupted) {
                    context.$store.dispatch("document/revert");
                } else {
                    if (!displaced) {
                        insertDirectedValve(context, valveType, catalogId, system);
                    }
                }
            },
            async (wc, event) => {
                await context.$store.dispatch("document/revert", false);

                const interactionA = context.offerInteraction(
                    {
                        type: InteractionType.INSERT,
                        entityType: EntityType.DIRECTED_VALVE,
                        systemUid: null,
                        worldCoord: wc,
                        worldRadius: 30
                    },
                    (drawable) => {
                        return (
                            isConnectableEntity(drawable[0]) &&
                            context.globalStore.getConnections(drawable[0].uid).length <= 2
                        );
                    }
                );

                const interactionB = context.offerInteraction(
                    {
                        type: InteractionType.INSERT,
                        entityType: EntityType.DIRECTED_VALVE,
                        systemUid: null,
                        worldCoord: wc,
                        worldRadius: 30
                    },
                    (drawable) => {
                        return (
                            drawable[0].type === EntityType.PIPE ||
                            (isConnectableEntity(drawable[0]) &&
                                context.globalStore.getConnections(drawable[0].uid).length <= 2)
                        );
                    }
                );

                const interaction = interactionA || interactionB;

                const valveEntity: DirectedValveEntity = createBareValveEntity(
                    valveType,
                    catalogId,
                    cloneSimple(wc),
                    null,
                );
                await context.$store.dispatch("document/addEntity", valveEntity);

                if (interaction && interaction.length) {
                    if (interaction[0].type === EntityType.PIPE) {
                        const pipeE = interaction[0];
                        pipe = context.globalStore.get(pipeE.uid) as Pipe;
                        // Project onto pipe
                        addValveAndSplitPipe(context, pipe, wc, system.uid, 10, valveEntity);

                        if (flipped) {
                            (context.globalStore.get(valveEntity.uid)! as DirectedValve).flip();
                        }
                    } else {
                        const object = context.globalStore.get(interaction[0].uid) as BaseBackedConnectable;
                        object.debase(context);
                        const entity = object.entity;

                        const connections = cloneSimple(context.globalStore.getConnections(entity.uid));

                        connections.forEach((e) => {
                            const other = context.globalStore.get(e);
                            if (other instanceof Pipe) {
                                if (other.entity.endpointUid[0] === entity.uid) {
                                    // other.entity.endpointUid[0] = newUid;

                                    context.$store.dispatch("document/updatePipeEndpoints", {
                                        entity: other.entity,
                                        endpoints: [valveEntity.uid, other.entity.endpointUid[1]]
                                    });
                                } else {
                                    // other.entity.endpointUid[1] = newUid;

                                    context.$store.dispatch("document/updatePipeEndpoints", {
                                        entity: other.entity,
                                        endpoints: [other.entity.endpointUid[0], valveEntity.uid]
                                    });
                                }
                            } else {
                                throw new Error("Connection is not a pipe");
                            }
                        });

                        const toReplace = object as BackedDrawableObject<ConnectableEntityConcrete>;
                        valveEntity.center = cloneSimple(toReplace.entity.center);
                        context.deleteEntity(toReplace);

                        if (flipped) {
                            (context.globalStore.get(valveEntity.uid)! as DirectedValve).flip();
                        }
                    }
                }

                context.scheduleDraw();
            },
            (worldCoord, event) => {
                context.interactive = null;
                context.$store.dispatch("document/validateAndCommit").then(() => {
                    /**/
                });
            },
            "Insert",
            [
                [
                    KeyCode.F,
                    {
                        name: "Flip",
                        fn: (e, r) => {
                            flipped = !flipped;
                            r();
                        }
                    }
                ]
            ]
        )
    );
}

function createBareValveEntity(
    type: ValveType,
    catalogId: string,
    wc: Coord,
    systemUidOption: string | null
): DirectedValveEntity {
    return {
        center: wc,
        color: null,
        parentUid: null,
        sourceUid: "",
        systemUidOption,
        type: EntityType.DIRECTED_VALVE,
        calculationHeightM: null,
        uid: uuid(),
        valve: createBareValve(type, catalogId)
    };
}

function createBareValve(type: ValveType, catalogId: string): DirectedValveConcrete {
    switch (type) {
        case ValveType.CHECK_VALVE:
        case ValveType.WATER_METER:
        case ValveType.STRAINER:
            return {
                isClosed: false,
                catalogId: catalogId as any,
                type
            };
        case ValveType.ISOLATION_VALVE:
            return {
                isClosed: false,
                catalogId: catalogId as any,
                makeIsolationCaseOnRingMains: true,
                type
            };
        case ValveType.PRV_SINGLE:
            return {
                targetPressureKPA: 0,
                catalogId: catalogId as any,
                type,
                sizeMM: null
            };
        case ValveType.PRV_DOUBLE:
        case ValveType.PRV_TRIPLE:
            return {
                targetPressureKPA: null,
                catalogId: catalogId as any,
                type,
                sizeMM: null,
                isolateOneWhenCalculatingHeadLoss: false
            };
        case ValveType.RPZD_DOUBLE_ISOLATED:
        case ValveType.RPZD_SINGLE:
        case ValveType.RPZD_DOUBLE_SHARED:
            return {
                type,
                catalogId: catalogId as any,
                sizeMM: null,
                isolateOneWhenCalculatingHeadLoss: true
            };
        case ValveType.BALANCING:
            return {
                type,
                catalogId: catalogId as any,
            };
    }
    assertUnreachable(type);
}
