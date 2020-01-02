import {
    ConnectableEntity,
    Color,
    Coord,
    DocumentState,
    FlowSystemParameters,
    NetworkType
} from "../../../../src/store/document/types";
import { FieldType, PropertyField } from "../../../../src/store/document/entities/property-field";
import * as _ from "lodash";
import { EntityType } from "../../../../src/store/document/entities/types";
import RiserCalculation from "../calculations/riser-calculation";
import { Choice, LEVEL_HEIGHT_DIFF_M } from "../../../../src/lib/types";
import { cloneSimple } from "../../../../src/lib/utils";

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
            title: "Height Above Ground (m)",
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

export function fillFlowSourceDefaults(doc: DocumentState, value: FlowSourceEntity) {
    const result = cloneSimple(value);

    // get system
    const system = doc.drawing.metadata.flowSystems.find((s) => s.uid === value.systemUid);

    if (system) {
        if (result.color == null) {
            result.color = system.color;
        }
    } else {
        throw new Error("Existing system not found for object " + JSON.stringify(value));
    }

    return result;
}
