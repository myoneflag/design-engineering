import { ObjectStore } from "../../../htmlcanvas/lib/object-store";
import { ConnectableEntityConcrete } from "../../../../../common/src/api/document/entities/concrete-entity";
import { NetworkType } from "../../../../../common/src/api/document/drawing";
import { EntityType } from "../../../../../common/src/api/document/entities/types";
import Pipe from "../../../htmlcanvas/objects/pipe";
import { assertUnreachable } from "../../../../../common/src/api/config";

export function determineConnectableNetwork(
    objectStore: ObjectStore,
    value: ConnectableEntityConcrete
): NetworkType | undefined {
    let retVal = NetworkType.RETICULATIONS;
    if (value.type === EntityType.RISER) {
        retVal = NetworkType.RISERS;
    } else {
        for (const conn of objectStore.getConnections(value.uid)) {
            const o = objectStore.get(conn) as Pipe;
            if (o.entity.network === NetworkType.CONNECTIONS) {
                retVal = NetworkType.CONNECTIONS;
            }
        }
    }
    return retVal;
}

export function determineConnectableSystemUid(
    objectStore: ObjectStore,
    value: ConnectableEntityConcrete
): string | undefined {
    switch (value.type) {
        case EntityType.FITTING:
        case EntityType.RISER:
        case EntityType.FLOW_SOURCE:
        case EntityType.SYSTEM_NODE:
            return value.systemUid;
        case EntityType.DIRECTED_VALVE:
        case EntityType.LOAD_NODE:
            // system will depend on neighbours
            if (value.systemUidOption) {
                return value.systemUidOption;
            } else {
                // system will depend on neighbours
                if (objectStore.getConnections(value.uid).length === 0) {
                    return undefined;
                } else {
                    return (objectStore.get(objectStore.getConnections(value.uid)[0]) as Pipe).entity.systemUid;
                }
            }
    }
    assertUnreachable(value);
}
