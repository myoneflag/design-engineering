import { FieldType, PropertyField } from "./property-field";
import { EntityType } from "./types";
import { Color, ConnectableEntity, Coord, FlowSystemParameters, NamedEntity } from "../drawing";

export default interface FittingEntity extends ConnectableEntity, NamedEntity {
    type: EntityType.FITTING;
    center: Coord;
    systemUid: string;
    color: Color | null;
}

export function makeValveFields(systems: FlowSystemParameters[]): PropertyField[] {
    return [
        {
            property: "entityName",
            title: "Name",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Text,
            params: null,
            multiFieldId: "entityName"
        },
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

