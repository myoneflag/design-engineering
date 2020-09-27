import { FieldType, PropertyField } from "./property-field";
import { EntityType } from "./types";
import { Color, ConnectableEntity, Coord, DrawingState, FlowSystemParameters } from "../drawing";
import { Choice, cloneSimple } from "../../../lib/utils";
import { Units } from "../../../lib/measurements";
import {isDrainage, StandardFlowSystemUids} from "../../config";

export interface FlowSourceEntityV11 extends ConnectableEntity {
    type: EntityType.FLOW_SOURCE;
    center: Coord;
    systemUid: string;

    heightAboveGroundM: number | null;
    color: Color | null;
    pressureKPA: number | null;
}

export default interface FlowSourceEntity extends ConnectableEntity {
    type: EntityType.FLOW_SOURCE;
    center: Coord;
    systemUid: string;

    heightAboveGroundM: number | null;
    color: Color | null;
    minPressureKPA: number | null;
    maxPressureKPA: number | null;
}

export function makeFlowSourceFields(systems: FlowSystemParameters[], entity: FlowSourceEntity): PropertyField[] {
    const res: PropertyField[] = [
        {
            property: "systemUid",
            title: "Flow System",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.FlowSystemChoice,
            params: { systems },
            multiFieldId: "systemUid"
        },
    ];

    if (entity.systemUid === StandardFlowSystemUids.Gas) {
        res.push(
            {
                property: "minPressureKPA",
                title: "Pressure",
                hasDefault: false,
                isCalculated: false,
                requiresInput: true,
                type: FieldType.Number,
                params: {min: 0, max: null},
                multiFieldId: "minPressureKPA",
                units: Units.KiloPascals,
            },
        );
    } else if (!isDrainage(entity.systemUid)) {
        res.push(
            {
                property: "minPressureKPA",
                title: "Min. Pressure",
                hasDefault: false,
                isCalculated: false,
                requiresInput: true,
                type: FieldType.Number,
                params: {min: 0, max: null},
                multiFieldId: "minPressureKPA",
                units: Units.KiloPascals,
            },


            {
                property: "maxPressureKPA",
                title: "Max. Pressure",
                hasDefault: false,
                isCalculated: false,
                requiresInput: true,
                type: FieldType.Number,
                params: {min: 0, max: null},
                multiFieldId: "maxPressureKPA",
                units: Units.KiloPascals,
            },
        );
    }

    res.push(
        {
            property: "heightAboveGroundM",
            title: "AHD",
            hasDefault: false,
            isCalculated: false,
            requiresInput: true,
            type: FieldType.Number,
            params: { min: null, max: null },
            multiFieldId: "heightAboveGroundM",
            units: Units.Meters
        });

    res.push(
        {
            property: "color",
            title: "Color",
            hasDefault: true,
            isCalculated: false,
            type: FieldType.Color,
            params: null,
            multiFieldId: "color"
        }
    );
    return res;
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
