import { FieldType, PropertyField } from "./property-field";
import { EntityType } from "./types";
import { Color, ConnectableEntity, Coord, DrawingState, FlowSystemParameters } from "../drawing";
import { Choice, cloneSimple } from "../../../lib/utils";

export default interface FlowSourceEntity extends ConnectableEntity {
    type: EntityType.FLOW_SOURCE;
    center: Coord;
    systemUid: string;

    heightAboveGroundM: number | null;
    color: Color | null;
    pressureKPA: number | null;
}

export function makeFlowSourceFields(materials: Choice[], systems: FlowSystemParameters[]): PropertyField[] {
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
            property: "pressureKPA",
            title: "Pressure (kPA)",
            hasDefault: false,
            isCalculated: false,
            requiresInput: true,
            type: FieldType.Number,
            params: { min: 0, max: null },
            multiFieldId: "pressureKPA"
        },

        {
            property: "heightAboveGroundM",
            title: "AHD (m)",
            hasDefault: false,
            isCalculated: false,
            requiresInput: true,
            type: FieldType.Number,
            params: { min: null, max: null },
            multiFieldId: "heightAboveGroundM"
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

export function fillFlowSourceDefaults(drawing: DrawingState, value: FlowSourceEntity) {
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
