import { FieldType, PropertyField } from "./property-field";
import { EntityType } from "./types";
import {Color, ConnectableEntity, Coord, DrawingState, FlowSystemParameters, NetworkType} from "../drawing";
import {  cloneSimple } from "../../../lib/utils";
import {GlobalStore} from "../../../../../frontend/src/htmlcanvas/lib/global-store";
import {isDrainage} from "../../config";
import Pipe from "../../../../../frontend/src/htmlcanvas/objects/pipe";

export default interface FittingEntity extends ConnectableEntity {
    type: EntityType.FITTING;
    center: Coord;
    systemUid: string;
    color: Color | null;
}

export function makeValveFields(systems: FlowSystemParameters[]): PropertyField[] {
    return [
        {
            property: "systemUid",
            title: "Flow System",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.FlowSystemChoice,
            params: { systems },
            multiFieldId: "systemUid"
        },

        {
            property: "color",
            title: "Color",
            hasDefault: true,
            isCalculated: false,
            type: FieldType.Color,
            params: null,
            multiFieldId: "color"
        }
    ];
}

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
