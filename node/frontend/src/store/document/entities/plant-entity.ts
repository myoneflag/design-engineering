import { CenteredEntity, Coord, DocumentState, FlowSystemParameters } from "../../../../src/store/document/types";
import { FieldType, PropertyField } from "../../../../src/store/document/entities/property-field";
import { EntityType } from "../../../../src/store/document/entities/types";
import { Choice } from "../../../../src/lib/types";
import { cloneSimple } from "../../../../src/lib/utils";

export default interface PlantEntity extends CenteredEntity {
    type: EntityType.PLANT;
    center: Coord;
    inletSystemUid: string;
    outletSystemUid: string;

    name: string;

    rotation: number;

    heightAboveFloorM: number;

    widthMM: number;
    heightMM: number;

    inletUid: string;
    outletUid: string;

    pumpPressureKPA: number | null;
    minOutletPressureKPA: number | null;
    maxOutletPressureKPA: number | null;
}

export function makePlantEntityFields(systems: FlowSystemParameters[]): PropertyField[] {
    return [
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
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Number,
            params: {min: 0, max: null},
            multiFieldId: 'pumpPressureKPA',
        },

        {
            property: "widthMM",
            title: "Width (mm)",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Number,
            params: {min: 0, max: null},
            multiFieldId: "widthMM",
        },

        {
            property: "heightMM",
            title: "Height (mm)",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Number,
            params: {min: 0, max: null},
            multiFieldId: "heightMM",
        },

        {
            property: "minOutletPressureKPA",
            title: "Min. Outlet Pressure",
            hasDefault: true,
            isCalculated: false,
            type: FieldType.Number,
            params: { min: 0, max: null },
            multiFieldId: "minOutletPressureKPA"
        },

        {
            property: "maxOutletPressureKPA",
            title: "Max. Outlet Pressure",
            hasDefault: true,
            isCalculated: false,
            type: FieldType.Number,
            params: { min: 0, max: null },
            multiFieldId: "maxOutletPressureKPA"
        }
    ];
}

export function fillPlantDefaults(doc: DocumentState, value: PlantEntity) {
    const result = cloneSimple(value);

    if (result.minOutletPressureKPA === null) {
        result.minOutletPressureKPA = 0;
    }

    if (result.maxOutletPressureKPA === null) {
        result.maxOutletPressureKPA = Infinity;
    }

    return result;
}
