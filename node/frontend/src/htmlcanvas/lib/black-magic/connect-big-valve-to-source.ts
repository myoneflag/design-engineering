import { StandardFlowSystemUids } from "../../../../src/store/catalog";
import BigValve from "../../objects/big-valve/bigValve";
import SystemNode from "../../objects/big-valve/system-node";
import Flatten from "@flatten-js/core";
import CanvasContext from "../../../../src/htmlcanvas/lib/canvas-context";
import PipeEntity from "../../../../../common/src/api/document/entities/pipe-entity";
import Pipe from "../../../../src/htmlcanvas/objects/pipe";
import { ConnectableEntityConcrete, isConnectableEntity } from "../../../../../common/src/api/document/entities/concrete-entity";
import { EntityType } from "../../../../../common/src/api/document/entities/types";
import { addValveAndSplitPipe } from "../../../../src/htmlcanvas/lib/black-magic/split-pipe";
import FittingEntity from "../../../../../common/src/api/document/entities/fitting-entity";
import uuid from "uuid";
import { InteractionType } from "../../../../src/htmlcanvas/lib/interaction";
import { FlowConfiguration } from "../../../../../common/src/api/document/entities/big-valve/big-valve-entity";
import { ConnectableEntity, Coord, DrawableEntity, NetworkType } from "../../../../../common/src/api/document/drawing";

export default function connectBigValveToSource(
    context: CanvasContext,
    newBigValve: BigValve,
    radiusMM: number = 3000
) {
    const wc = newBigValve.toWorldCoord();
    const selfUids: string[] = newBigValve.getInletsOutlets().map((o) => o.uid);

    const interactive = getClosestJoinable(context, StandardFlowSystemUids.ColdWater, wc, radiusMM, selfUids);

    let coldObj: SystemNode | undefined;
    let hotObj: SystemNode | undefined;
    let coldDrawn = false;

    coldObj = context.objectStore.get(newBigValve.entity.coldRoughInUid) as SystemNode;
    hotObj = context.objectStore.get(newBigValve.entity.hotRoughInUid) as SystemNode;

    if (interactive && context.objectStore.getConnections(coldObj.uid).length === 0) {
        coldDrawn = true;
        const target = interactive[0];
        const targetObj = context.objectStore.get(target.uid)!;
        // rotate our pipe and try again with correct position of cold water

        const closePoint = targetObj.shape()!.distanceTo(Flatten.point(wc.x, wc.y))[1].ps;
        const currA = newBigValve.toWorldAngleDeg(0);
        const desiredA =
            (-Flatten.vector(Flatten.point(wc.x, wc.y), closePoint).angleTo(Flatten.vector(0, -1)) / Math.PI) * 180;

        newBigValve.entity.rotation = (((desiredA - currA) % 360) + 360) % 360;

        const coldLoc = coldObj.toWorldCoord({ x: 0, y: 0 });

        leadPipe(context, coldLoc, coldObj.entity, StandardFlowSystemUids.ColdWater, target.uid, undefined, selfUids);
    }

    // do closest hot pipe
    if (coldDrawn) {
        const interactiveC = getClosestJoinable(context, StandardFlowSystemUids.HotWater, wc, radiusMM, selfUids);
        if (interactiveC && interactiveC.length && context.objectStore.getConnections(hotObj.uid).length === 0) {
            const pipeE = interactiveC[0];

            const hotWc = hotObj.toWorldCoord({ x: 0, y: 0 });

            leadPipe(context, hotWc, hotObj.entity, StandardFlowSystemUids.HotWater, undefined, undefined, selfUids);
        }
    }
}

function leadPipe(
    context: CanvasContext,
    wc: Coord,
    connectTo: ConnectableEntity,
    systemUid: string,
    pipeSpec?: string,
    radius: number = Infinity,
    exlcudeUids: string[] = []
): PipeEntity | null {
    let pipe: Pipe;
    let valve: ConnectableEntityConcrete;
    if (pipeSpec !== undefined) {
        const obj = context.objectStore.get(pipeSpec)!;
        if (obj.entity.type === EntityType.PIPE) {
            valve = addValveAndSplitPipe(context, obj as Pipe, wc, systemUid, 30).focus as FittingEntity;
        } else if (isConnectableEntity(obj.entity)) {
            valve = obj.entity as ConnectableEntityConcrete;
        } else {
            throw new Error("not supported to lead from");
        }
    } else {
        const interactive = getClosestJoinable(context, systemUid, wc, radius, exlcudeUids);
        if (interactive) {
            if (interactive[0].type === EntityType.PIPE) {
                const pipeE = interactive[0];
                pipe = context.objectStore.get(pipeE.uid) as Pipe;
                valve = addValveAndSplitPipe(context, pipe, wc, systemUid, 30).focus as FittingEntity;
            } else if (isConnectableEntity(interactive[0])) {
                valve = interactive[0] as ConnectableEntityConcrete;
            } else {
                throw new Error("not supported");
            }
        } else {
            return null;
        }
    }

    // Draw de cold peep
    const newPipe: PipeEntity = {
        color: null,
        diameterMM: null,
        endpointUid: [valve.uid, connectTo.uid],
        heightAboveFloorM: 1,
        lengthM: null,
        material: null,
        maximumVelocityMS: null,
        parentUid: null,
        systemUid,
        network: NetworkType.CONNECTIONS,
        type: EntityType.PIPE,
        uid: uuid()
    };

    context.$store.dispatch("document/addEntity", newPipe);
    return newPipe;
}

function getClosestJoinable(
    context: CanvasContext,
    systemUid: string,
    wc: Coord,
    radius: number,
    excludeUids: string[]
): Array<PipeEntity | ConnectableEntityConcrete> | null {
    return context.offerInteraction(
        {
            type: InteractionType.EXTEND_NETWORK,
            systemUid,
            worldCoord: wc,
            worldRadius: radius, // 1 M radius
            configuration: FlowConfiguration.OUTPUT
        },
        (obj) => {
            return !excludeUids.includes(obj[0].uid);
        },
        (object: DrawableEntity[]) => {
            const obj = context.objectStore.get(object[0].uid);
            if (!obj) {
                return -Infinity;
            }
            if (!obj.shape()) {
                return -Infinity;
            }

            return -obj!.shape()!.distanceTo(Flatten.point(wc.x, wc.y))[0];
        }
    ) as Array<PipeEntity | ConnectableEntityConcrete>;
}
