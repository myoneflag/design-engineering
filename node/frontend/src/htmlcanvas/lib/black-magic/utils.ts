import {ObjectStore} from '../types';
import {EntityType} from '../../../store/document/entities/types';
import BaseBackedObject from '../../../../src/htmlcanvas/lib/base-backed-object';
import {assertUnreachable} from "../../../config";

export function getConnectedFlowComponent(
    targetUid: string,
    objectStore: ObjectStore,
    allowed?: Set<string>,
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
            case EntityType.FITTING:
            case EntityType.DIRECTED_VALVE:
                q.push(...o.entity.connections);
                break;
            case EntityType.PIPE:
                q.push(...o.entity.endpointUid);
                break;
            case EntityType.TMV:
            case EntityType.BACKGROUND_IMAGE:
            case EntityType.FIXTURE:
            case EntityType.RESULTS_MESSAGE:
                throw new Error('invalid object here');
            default:
                assertUnreachable(o.entity);
        }
    }

    return result;
}
