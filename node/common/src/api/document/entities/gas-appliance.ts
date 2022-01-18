import { GasRegulator } from './directed-valves/valve-types';
import { EntityType } from "./types";
import { FieldType, PropertyField } from "./property-field";
import DirectedValveEntity from "./directed-valves/directed-valve-entity";
import { Coord, DrawableEntity, DrawingState } from "../drawing";
import { cloneSimple } from "../../../lib/utils";
import { Units } from "../../../lib/measurements";


export default interface GasApplianceEntity extends DrawableEntity {
    center: Coord;
    type: EntityType.GAS_APPLIANCE;
    name: string;
    abbreviation: string;
    rotation: number;

    inletUid: string;

    outletAboveFloorM: number;
    inletPressureKPA: number | null;
    widthMM: number;
    heightMM: number;
    flowRateMJH: number | null;
    diversity: number | null;
}

export function makeGasApplianceFields(drawing: DrawingState, entity: GasApplianceEntity): PropertyField[] {
    const res: PropertyField[] = [
        {
            property: "name",
            title: "Name",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Text,
            params: null,
            multiFieldId: "name",
        },
        {
            property: "abbreviation",
            title: "Abbreviation",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Text,
            params: null,
            multiFieldId: "abbreviation",
        },
        {
            property: "rotation",
            title: "Rotation: (Degrees)",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Rotation,
            params: null,
            multiFieldId: null
        },
        {
            property: "outletAboveFloorM",
            title: "Height Above Floor",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Number,
            params: { min: null, max: null },
            multiFieldId: "outletAboveFloorM",
            units: Units.Meters,
        },
        {
            property: "inletPressureKPA",
            title: "Inlet Pressure",
            hasDefault: true,
            isCalculated: false,
            type: FieldType.Number,
            params: { min: 0, max: null },
            multiFieldId: "inletPressureKPA",
            units: Units.GasKiloPascals,
        },
        {
            property: "widthMM",
            title: "Width",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Number,
            params: { min: 0, max: null },
            multiFieldId: "widthMM",
            units: Units.Millimeters,
        },
        {
            property: "heightMM",
            title: "Height",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Number,
            params: { min: 0, max: null },
            multiFieldId: "heightMM",
            units: Units.Millimeters,
        },
        {
            property: "flowRateMJH",
            title: "Flow Rate",
            hasDefault: false,
            isCalculated: false,
            requiresInput: true,
            type: FieldType.Number,
            params: { min: 0, max: null },
            multiFieldId: "flowRateMJH",
            units: Units.MegajoulesPerHour,
        },
        {
            property: "diversity",
            title: "Diversity",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Number,
            params: { min: 0, max: null },
            multiFieldId: "diversity",
            units: Units.Percent
        },
    ];

    return res;
}

export function fillGasApplianceFields(
    value: GasApplianceEntity,
    regulator?: DirectedValveEntity,
): GasApplianceEntity {
    const result = cloneSimple(value);

    const gasRegulator = regulator?.valve as GasRegulator;

    if (result.inletPressureKPA === null) {
        result.inletPressureKPA = gasRegulator?.downStreamPressureKPA || 0;
    }

    if (result.diversity === null) {
        result.diversity = 100;
    }

    return result;
}
