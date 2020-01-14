import { EntityType } from "../types";
import { FieldType, PropertyField } from "../property-field";
import { DirectedValveConcrete, ValveType } from "./valve-types";
import { assertUnreachable } from "../../../config";
import { Color, ConnectableEntity, Coord, FlowSystemParameters } from "../../drawing";

export default interface DirectedValveEntity extends ConnectableEntity {
    type: EntityType.DIRECTED_VALVE;
    center: Coord;
    systemUidOption: string | null;
    color: Color | null;

    sourceUid: string;

    valve: DirectedValveConcrete;
}

export function makeDirectedValveFields(
    systems: FlowSystemParameters[],
    valve: DirectedValveConcrete
): PropertyField[] {
    const fields: PropertyField[] = [
        {
            property: "systemUidOption",
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

    switch (valve.type) {
        case ValveType.CHECK_VALVE:
            break;
        case ValveType.ISOLATION_VALVE:
            /* This will be a custom part of the property box
            fields.push(
                { property: 'valve.isClosed', title: 'Is Closed:', hasDefault: false, isCalculated: false,
                    type: FieldType.Boolean, params: null,  multiFieldId: 'isClosed' },
            );*/
            break;
        case ValveType.PRESSURE_RELIEF_VALVE:
            fields.push({
                property: "valve.targetPressureKPA",
                title: "Target Pressure (KPA):",
                hasDefault: false,
                isCalculated: false,
                type: FieldType.Number,
                params: { min: 0, max: null },
                multiFieldId: "targetPressure",
                requiresInput: true
            });
            break;
        case ValveType.RPZD_DOUBLE_ISOLATED:
        case ValveType.RPZD_DOUBLE_SHARED:
        case ValveType.RPZD_SINGLE:
            fields.push({
                property: "valve.sizeMM",
                title: "Size (mm):",
                hasDefault: false,
                isCalculated: false,
                type: FieldType.Number,
                params: { min: 0, max: null },
                multiFieldId: "diameterMM",
                requiresInput: false
            });
            if (valve.type === ValveType.RPZD_DOUBLE_ISOLATED) {
                fields.push({
                    property: "valve.isolateOneWhenCalculatingHeadLoss",
                    title: "Isolate When Calculation Head Loss?",
                    hasDefault: false,
                    isCalculated: false,
                    params: null,
                    type: FieldType.Boolean,
                    multiFieldId: "isolateOneWhenCalculatingHeadLoss"
                });
            }
            break;
        case ValveType.WATER_METER:
            break;
        case ValveType.STRAINER:
            break;
        default:
            assertUnreachable(valve);
    }

    return fields;
}

