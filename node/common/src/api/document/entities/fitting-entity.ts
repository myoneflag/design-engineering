import { FieldType, PropertyField } from "./property-field";
import { EntityType } from "./types";
import { Color, ConnectableEntity, Coord, DrawingState, FlowSystemParameters } from "../drawing";
import { Choice, cloneSimple } from "../../../lib/utils";

export default interface FittingEntity extends ConnectableEntity {
    type: EntityType.FITTING;
    center: Coord;
    systemUid: string;
    color: Color | null;
}

export function makeValveFields(valveTypes: Choice[], systems: FlowSystemParameters[]): PropertyField[] {
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
            title: "Color:",
            hasDefault: true,
            isCalculated: false,
            type: FieldType.Color,
            params: null,
            multiFieldId: "color"
        }
    ];
}

export function fillValveDefaultFields(drawing: DrawingState, value: FittingEntity) {
    const result = cloneSimple(value);

    // get system
    const system = drawing.metadata.flowSystems.find((s) => s.uid === value.systemUid);

    if (system) {
        if (result.color == null) {
            result.color = system.color;
        }
    } else {
        throw new Error("Existing system not found for object " + JSON.stringify(value));
    }

    return result;
}
