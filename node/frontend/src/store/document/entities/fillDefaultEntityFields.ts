import {DrawingState, NetworkType} from "../../../../../common/src/api/document/drawing";
import {cloneSimple} from "../../../../../common/src/lib/utils";
import {isDrainage} from "../../../../../common/src/api/config";
import FittingEntity from "../../../../../common/src/api/document/entities/fitting-entity";
import {GlobalStore} from "../../../htmlcanvas/lib/global-store";
import Pipe from "../../../htmlcanvas/objects/pipe";

export function fillValveDefaultFields(drawing: DrawingState, value: FittingEntity, objectStore: GlobalStore) {
    const result = cloneSimple(value);

    // get system
    const system = drawing.metadata.flowSystems.find((s) => s.uid === value.systemUid);

    if (system) {
        if (result.color == null) {
            result.color = system.color;
            if (isDrainage(system.uid)) {
                let iAmConnection = false;
                for (const conn of objectStore.getConnections(value.uid)) {
                    const pipe = objectStore.get(conn);
                    if ((pipe as Pipe).entity.network === NetworkType.CONNECTIONS) {
                        iAmConnection = true;
                    }
                }
                if (iAmConnection) {
                    result.color = system.drainageProperties.ventColor;
                }
            }
        }
    } else {
        throw new Error("Existing system not found for object " + JSON.stringify(value));
    }

    return result;
}