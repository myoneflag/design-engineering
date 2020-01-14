import { DrawingState } from "../../../../../common/src/api/document/drawing";
import { ObjectStore } from "../../../htmlcanvas/lib/object-store";
import { cloneSimple } from "../../../../../common/src/lib/utils";
import DirectedValveEntity from "../../../../../common/src/api/document/entities/directed-valves/directed-valve-entity";
import { determineConnectableSystemUid } from "./lib";

export function fillDirectedValveFields(drawing: DrawingState, objectStore: ObjectStore, value: DirectedValveEntity) {
    const result = cloneSimple(value);

    const systemUid = determineConnectableSystemUid(objectStore, value);
    const system = drawing.metadata.flowSystems.find((s) => s.uid === systemUid);

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
