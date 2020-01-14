import { EntityType } from "../../../../../common/src/api/document/entities/types";
import BaseBackedObject from "../../../../src/htmlcanvas/lib/base-backed-object";
import { ObjectStore } from "../object-store";
import { assertUnreachable } from "../../../../../common/src/api/config";

export function getConnectedFlowComponent(
    targetUid: string,
    objectStore: ObjectStore,
    allowed?: Set<string>
): BaseBackedObject[] {
    const q = [targetUid];

    const seen = new Set<string>();
    const result: BaseBackedObject[] = [];

    while (q.length) {
        const top = q.pop()!;
        if (seen.has(top)) {
            continue;
        }
        seen.add(top);

        if (allowed) {
            if (!allowed.has(top)) {
                continue;
            }
        }

        const o = objectStore.get(top)!;
        result.push(o);
        switch (o.entity.type) {
            case EntityType.SYSTEM_NODE:
            case EntityType.RISER:
            case EntityType.LOAD_NODE:
            case EntityType.FLOW_SOURCE:
            case EntityType.FITTING:
            case EntityType.DIRECTED_VALVE:
                q.push(...objectStore.getConnections(o.entity.uid));
                break;
            case EntityType.PIPE:
                q.push(...o.entity.endpointUid);
                break;
            case EntityType.BIG_VALVE:
            case EntityType.BACKGROUND_IMAGE:
            case EntityType.FIXTURE:
            case EntityType.PLANT:
                throw new Error("invalid object here");
            default:
                assertUnreachable(o.entity);
        }
    }

    return result;
}
