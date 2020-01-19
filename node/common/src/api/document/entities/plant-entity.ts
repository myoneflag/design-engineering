import { FieldType, PropertyField } from "./property-field";
import { EntityType } from "./types";
import { CenteredEntity, Coord, FlowSystemParameters } from "../drawing";
import { cloneSimple } from "../../../lib/utils";

export default interface PlantEntity extends CenteredEntity {
    type: EntityType.PLANT;
    center: Coord;
    inletSystemUid: string;
    outletSystemUid: string;

    name: string;

    rotation: number;
    rightToLeft: boolean;

    heightAboveFloorM: number;

    widthMM: number;
    heightMM: number;

    pumpPressureKPA: number | null;

    pressureLossKPA: number | null;

    makeStaticPressure: boolean;

    inletUid: string;
    outletUid: string;

}

export function makePlantEntityFields(systems: FlowSystemParameters[]): PropertyField[] {
    return [
        {
            property: "rightToLeft",
            title: "Right to Left?",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Boolean,
            params: null ,
            multiFieldId: "rightToLeft"
        },

        {
            property: "inletSystemUid",
            title: "Inlet Flow System",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.FlowSystemChoice,
            params: { systems },
            multiFieldId: "inletSystemUid"
        },

        {
            property: "outletSystemUid",
            title: "Outlet Flow System",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.FlowSystemChoice,
            params: { systems },
            multiFieldId: "outletSystemUid"
        },


        {
            property: "name",
            title: "Name",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Text,
            params: null,
            multiFieldId: "name"
        },

        {
            property: "rotation",
            title: "Rotation",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Rotation,
            params: null,
            multiFieldId: "rotation"
        },

        {
            property: "heightAboveFloorM",
            title: "Height Above Floor (m)",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Number,
            params: { min: null, max: null },
            multiFieldId: "heightAboveFloorM"
        },

        {
            property: "pumpPressureKPA",
            title: "Pump Pressure (kPa)",
            hasDefault: true,
            isCalculated: false,
            type: FieldType.Number,
            params: { min: 0, max: null },
            multiFieldId: "pumpPressureKPA"
        },

        {
            property: "pressureLossKPA",
            title: "Pressure Loss (kPa)",
            hasDefault: true,
            isCalculated: false,
            type: FieldType.Number,
            params: { min: 0, max: null },
            multiFieldId: "pumpPressureKPA"
        },

        {
            property: "widthMM",
            title: "Width (mm)",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Number,
            params: { min: 0, max: null },
            multiFieldId: "widthMM"
        },

        {
            property: "heightMM",
            title: "Height (mm)",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Number,
            params: { min: 0, max: null },
            multiFieldId: "heightMM"
        }

    ];
}

export function fillPlantDefaults(value: PlantEntity) {
    const result = cloneSimple(value);

    if (result.pumpPressureKPA === null) {
        result.pumpPressureKPA = 0;
    }

    if (result.pressureLossKPA === null) {
        result.pressureLossKPA = 0;
    }

    return result;
}
