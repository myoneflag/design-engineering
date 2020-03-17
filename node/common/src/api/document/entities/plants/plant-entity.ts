import { FieldType, PropertyField } from "../property-field";
import { EntityType } from "../types";
import { CenteredEntity, Coord, DrawingState, FlowSystemParameters } from "../../drawing";
import { cloneSimple } from "../../../../lib/utils";
import { PlantConcrete, PlantType, PressureMethod } from "./plant-types";
import { assertUnreachable } from "../../../config";

export interface PlantEntityV8 extends CenteredEntity {
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

    pressureMethod: PressureMethod;
    pumpPressureKPA: number | null;
    pressureLossKPA: number | null;
    staticPressureKPA: number | null;

    inletUid: string;
    outletUid: string;
}


export default interface PlantEntity extends CenteredEntity {
    type: EntityType.PLANT;
    center: Coord;
    inletSystemUid: string;
    outletSystemUid: string;
    outletTemperatureC: number | null;

    name: string;

    rotation: number;
    rightToLeft: boolean;

    heightAboveFloorM: number;

    widthMM: number;
    heightMM: number;

    inletUid: string;
    outletUid: string;

    plant: PlantConcrete;
}

export function makePlantEntityFields(entity: PlantEntity, systems: FlowSystemParameters[]): PropertyField[] {
    const outSystem = systems.find((u) => u.uid === entity.outletSystemUid);

    const res: PropertyField[] = [
        {
            property: 'plant.type',
            title: 'Plant Type',
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Choice,
            params: {
                choices: [
                    {name: 'Return System', key: PlantType.RETURN_SYSTEM},
                    {name: 'Tank', key: PlantType.TANK},
                    {name: 'Pump', key: PlantType.PUMP},
                    {name: 'Custom', key: PlantType.CUSTOM},
                ],
            },
            readonly: true,
            multiFieldId: 'plant.type',
        },
        {
            property: "rightToLeft",
            title: "Right to Left?",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Boolean,
            params: null,
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
    ];

    res.push(
        {
            property: "heightAboveFloorM",
            title: "Height Above Floor (m)",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Number,
            params: { min: null, max: null },
            multiFieldId: "heightAboveFloorM"
        },
    );

    switch (entity.plant.type) {
        case PlantType.RETURN_SYSTEM:
            res.push(
                {
                    property: "plant.returnMinimumTemperatureC",
                    title: "Minimum Return Temperature (C)",
                    hasDefault: true,
                    isCalculated: false,
                    type: FieldType.Number,
                    params: { min: null, max: entity.outletTemperatureC },
                    multiFieldId: "returnMinimumTemperatureC"
                },
            );

            res.push(
                {
                    property: "plant.returnVelocityMS",
                    title: "Maximum Return Velocity (M/s)",
                    hasDefault: true,
                    isCalculated: false,
                    type: FieldType.Number,
                    params: { min: 0, max: null },
                    multiFieldId: "returnVelocityMS"
                },
            );


            res.push(
                {
                    property: "plant.addReturnToPSDFlowRate",
                    title: "Add Return to PSD Flow Rate",
                    hasDefault: false,
                    isCalculated: false,
                    type: FieldType.Boolean,
                    params: null,
                    multiFieldId: "addReturnToPSDFlowRate"
                },
            );

            break;
        case PlantType.TANK:
            break;
        case PlantType.PUMP:
            break;
        case PlantType.CUSTOM:
            res.push(
                {
                    property: "plant.pressureLoss.pressureMethod",
                    title: "Pressure Type",
                    hasDefault: false,
                    isCalculated: false,
                    type: FieldType.Choice,
                    params: {
                        choices: [
                            { name: "Pump Duty", key: PressureMethod.PUMP_DUTY, disabled: false },
                            { name: "Constant Pressure Loss", key: PressureMethod.FIXED_PRESSURE_LOSS, disabled: false },
                        ]
                    },
                    multiFieldId: "pressureMethod"
                },
            );
            break;
        default:
            assertUnreachable(entity.plant);
    }

    if (entity.plant.type !== PlantType.RETURN_SYSTEM) {
        switch (entity.plant.pressureLoss.pressureMethod) {
            case PressureMethod.PUMP_DUTY:
                res.push({
                    property: "plant.pressureLoss.pumpPressureKPA",
                    title: "Pump Pressure (kPa)",
                    hasDefault: true,
                    isCalculated: false,
                    type: FieldType.Number,
                    params: { min: 0, max: null },
                    multiFieldId: "pumpPressureKPA"
                });
                break;
            case PressureMethod.FIXED_PRESSURE_LOSS:
                res.push({
                    property: "plant.pressureLoss.pressureLossKPA",
                    title: "Pressure Loss (kPa)",
                    hasDefault: true,
                    isCalculated: false,
                    type: FieldType.Number,
                    params: { min: 0, max: null },
                    multiFieldId: "pressureLossKPA"
                });
                break;
            case PressureMethod.STATIC_PRESSURE:
                res.push({
                    property: "plant.pressureLoss.staticPressureKPA",
                    title: "Static Pressure (kPa)",
                    hasDefault: true,
                    isCalculated: false,
                    type: FieldType.Number,
                    params: { min: 0, max: null },
                    multiFieldId: "staticPressureKPA"
                });
                break;
        }
    }

    res.push(
        {
            property: "outletTemperatureC",
            title: "Outlet Temperature (C)",
            hasDefault: true,
            isCalculated: false,
            type: FieldType.Number,
            params: { min: null, max: null },
            multiFieldId: "outletTemperatureC"
        },

    );

    res.push(
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
    );

    return res;
}

export function fillPlantDefaults(value: PlantEntity, drawing: DrawingState) {
    const result = cloneSimple(value);

    if (value.plant.type !== PlantType.RETURN_SYSTEM) {
        switch (value.plant.pressureLoss.pressureMethod) {
            case PressureMethod.PUMP_DUTY:
                if (value.plant.pressureLoss.pumpPressureKPA === null) {
                    value.plant.pressureLoss.pumpPressureKPA = 0;
                }
                break;
            case PressureMethod.STATIC_PRESSURE:
                if (value.plant.pressureLoss.staticPressureKPA === null) {
                    value.plant.pressureLoss.staticPressureKPA = 0;
                }
                break;
            case PressureMethod.FIXED_PRESSURE_LOSS:
                if (value.plant.pressureLoss.pressureLossKPA === null) {
                    value.plant.pressureLoss.pressureLossKPA = 0;
                }
                break;
            default:
                assertUnreachable(value.plant.pressureLoss);
        }

    }

    if (value.outletTemperatureC === null) {
        const outSystem = drawing.metadata.flowSystems.find((s) => s.uid === value.outletSystemUid)!;
        result.outletTemperatureC = outSystem ? Number(outSystem.temperature) : Number(drawing.metadata.calculationParams.roomTemperatureC);
    }

    switch (result.plant.type) {
        case PlantType.RETURN_SYSTEM:
            if (result.plant.returnMinimumTemperatureC === null) {
                result.plant.returnMinimumTemperatureC = result.outletTemperatureC! - 5;
            }
            if (result.plant.returnVelocityMS === null) {
                const outSystem = drawing.metadata.flowSystems.find((s) => s.uid === value.outletSystemUid)!;
                result.plant.returnVelocityMS = Number(outSystem.returnMaxVelocityMS);
            }
            break;
        case PlantType.TANK:
            break;
        case PlantType.CUSTOM:
            break;
        case PlantType.PUMP:
            break;
        default:
            assertUnreachable(result.plant);
    }

    return result;
}
