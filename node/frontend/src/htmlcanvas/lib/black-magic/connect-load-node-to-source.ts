import CanvasContext from "../canvas-context";
import BigValve from "../../objects/big-valve/bigValve";
import { StandardFlowSystemUids } from "../../../../../common/src/api/config";
import SystemNode from "../../objects/big-valve/system-node";
import Flatten from "@flatten-js/core";
import { getClosestJoinable, leadPipe } from "./connect-big-valve-to-source";
import LoadNodeEntity from "../../../../../common/src/api/document/entities/load-node-entity";
import LoadNode from "../../objects/load-node";
import { FIXTURE_PAIR_DEFAULT_DISTANCE_MM } from "../../tools/insert-fixture-hot-cold";
import { isConnectableEntity } from "../../../../../common/src/api/document/entities/concrete-entity";
import { determineConnectableSystemUid } from "../../../store/document/entities/lib";

export default function connectLoadNodeToSource(
    context: CanvasContext,
    loadNodeA: LoadNode,
    loadNodeB?: LoadNode,
    radiusMM: number = 5000
) {

    const wc = loadNodeA.toWorldCoord();
    if (!loadNodeB) {
        // just single connect, do it directly.

        const interactive = getClosestJoinable(context, null, wc,
            radiusMM, [loadNodeA.uid]);

        if (interactive) {
            let systemUid: string | null = null;
            if (isConnectableEntity(interactive[0])) {
                systemUid = determineConnectableSystemUid(context.globalStore, interactive[0]) || StandardFlowSystemUids.ColdWater;
            } else {
                systemUid = interactive[0].systemUid;
            }
            leadPipe(context, wc, loadNodeA.entity, systemUid, interactive[0].uid,
                undefined, [loadNodeA.uid]);
        }

        return;
    }

    const selfUids: string[] = [loadNodeA.uid, loadNodeB.uid];

    const interactive = getClosestJoinable(context, StandardFlowSystemUids.ColdWater, wc, radiusMM, selfUids);

    let coldDrawn = false;


    if (interactive) {
        coldDrawn = true;
        const target = interactive[0];
        const targetObj = context.globalStore.get(target.uid)!;
        // rotate our pipe and try again with correct position of cold water

        const closePoint = targetObj.shape()!.distanceTo(Flatten.point(wc.x, wc.y))[1].ps;
        let desiredA =
            (-Flatten.vector(Flatten.point(wc.x, wc.y), closePoint).angleTo(Flatten.vector(0, 1)) / Math.PI) * 180;

        // round angle to 45 deg
        desiredA = Math.round(desiredA / 45) * 45;

        loadNodeB.entity.center.x = loadNodeA.entity.center.x
            + Math.cos(desiredA / 180 * Math.PI) * FIXTURE_PAIR_DEFAULT_DISTANCE_MM * 2;
        loadNodeB.entity.center.y = loadNodeA.entity.center.y
            + Math.sin(desiredA / 180 * Math.PI) * FIXTURE_PAIR_DEFAULT_DISTANCE_MM * 2;



        leadPipe(context, wc, loadNodeA.entity, StandardFlowSystemUids.ColdWater, target.uid, undefined, selfUids);
    }

    // do closest hot pipe
    if (coldDrawn) {
        const interactiveC = getClosestJoinable(context, StandardFlowSystemUids.HotWater, wc, radiusMM, selfUids);
        if (interactiveC && interactiveC.length && context.globalStore.getConnections(loadNodeB.uid).length === 0) {

            const hotWc = loadNodeB.toWorldCoord({ x: 0, y: 0 });

            leadPipe(context, hotWc, loadNodeB.entity, StandardFlowSystemUids.HotWater,
                undefined, undefined, selfUids);
        }
    }
}
