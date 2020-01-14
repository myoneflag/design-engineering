import { DocumentState } from "../types";
import { ObjectStore } from "../../../htmlcanvas/lib/object-store";
import { cloneSimple } from "../../../../../common/src/lib/utils";
import { determineConnectableSystemUid } from "./lib";
import LoadNodeEntity from "../../../../../common/src/api/document/entities/load-node-entity";

export function fillDefaultLoadNodeFields(doc: DocumentState, objectStore: ObjectStore, value: LoadNodeEntity) {
    const result = cloneSimple(value);

    const systemUid = determineConnectableSystemUid(objectStore, value);
    const system = doc.drawing.metadata.flowSystems.find((s) => s.uid === systemUid);

    result.systemUidOption = system ? system.uid : null;

    if (system) {
        if (result.color == null) {
            result.color = system.color;
        }
    } else {
        if (result.color == null) {
            result.color = { hex: "#888888" };
        }
    }

    return result;
}
