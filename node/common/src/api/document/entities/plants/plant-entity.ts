import {FieldType, PropertyField} from "../property-field";
import {EntityType} from "../types";
import {CenteredEntity, COLORS, Coord, DrawingState, FlowSystemParameters} from "../../drawing";
import {cloneSimple} from "../../../../lib/utils";
import {PlantConcrete, PlantType, PressureMethod} from "./plant-types";
import {assertUnreachable, isDrainage} from "../../../config";
import {Units} from "../../../../lib/measurements";
import { Catalog } from './../../../catalog/types';
import { auCatalog } from "../../../catalog/initial-catalog/au-catalog";

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
    lengthMM?: number;

    inletUid: string;
    outletUid: string;

    plant: PlantConcrete;
}

export function makePlantEntityFields(catalog: Catalog, drawing: DrawingState, entity: PlantEntity, systems: FlowSystemParameters[]): PropertyField[] {
    const iAmDrainage = isDrainage(entity.outletSystemUid) || isDrainage(entity.inletSystemUid);

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
                    {name: 'Drainage Pit', key: PlantType.DRAINAGE_PIT},
                    {name: 'Grease Interceptor Trap', key: PlantType.DRAINAGE_GREASE_INTERCEPTOR_TRAP},
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
            property: "rotation",
            title: "Rotation",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Rotation,
            params: null,
            multiFieldId: "rotation"
        },
    ];

    switch (entity.plant.type) {
        case PlantType.RETURN_SYSTEM:
            res.push(
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
                    property: "heightAboveFloorM",
                    title: "Height Above Floor",
                    hasDefault: false,
                    isCalculated: false,
                    type: FieldType.Number,
                    params: { min: null, max: null },
                    multiFieldId: "heightAboveFloorM",
                    units: Units.Meters,
                },
                {
                    property: "plant.returnMinimumTemperatureC",
                    title: "Minimum Return Temperature",
                    hasDefault: true,
                    highlightOnOverride: COLORS.YELLOW,
                    isCalculated: false,
                    type: FieldType.Number,
                    params: { min: null, max: entity.outletTemperatureC },
                    multiFieldId: "returnMinimumTemperatureC",
                    units: Units.Celsius,
                },
                {
                    property: "plant.returnVelocityMS",
                    title: "Maximum Return Velocity (M/s)",
                    hasDefault: true,
                    highlightOnOverride: COLORS.YELLOW,
                    isCalculated: false,
                    type: FieldType.Number,
                    params: { min: 0, max: null },
                    multiFieldId: "returnVelocityMS",
                    units: Units.MetersPerSecond,
                },
                {
                    property: "plant.addReturnToPSDFlowRate",
                    title: "Add Return to PSD Flow Rate",
                    hasDefault: false,
                    isCalculated: false,
                    type: FieldType.Boolean,
                    params: null,
                    multiFieldId: "addReturnToPSDFlowRate",
                },
                {
                    property: "plant.gasConsumptionMJH",
                    title: "Gas Consumption",
                    hasDefault: true,
                    isCalculated: false,
                    type: FieldType.Number,
                    params: { min: 0, max: null },
                    multiFieldId: "gasConsumptionMJH",
                    units: Units.MegajoulesPerHour,
                },
                {
                    property: "plant.gasPressureKPA",
                    title: "Gas Pressure",
                    hasDefault: true,
                    isCalculated: false,
                    type: FieldType.Number,
                    params: { min: 0, max: null },
                    multiFieldId: "gasPressureKPA",
                    units: Units.KiloPascals,
                }
            );
            break;
        case PlantType.TANK:
        case PlantType.PUMP:
            res.push(
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
                    property: "heightAboveFloorM",
                    title: "Height Above Floor",
                    hasDefault: false,
                    isCalculated: false,
                    type: FieldType.Number,
                    params: { min: null, max: null },
                    multiFieldId: "heightAboveFloorM",
                    units: Units.Meters,
                },
            );
            break;
        case PlantType.CUSTOM:
            res.push(
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
                    property: "heightAboveFloorM",
                    title: "Height Above Floor",
                    hasDefault: false,
                    isCalculated: false,
                    type: FieldType.Number,
                    params: { min: null, max: null },
                    multiFieldId: "heightAboveFloorM",
                    units: Units.Meters,
                },
                {
                    property: "plant.pressureLoss.pressureMethod",
                    title: "Pressure Type",
                    hasDefault: false,
                    isCalculated: false,
                    type: FieldType.Choice,
                    params: {
                        choices: [
                            { name: "Pump Duty", key: PressureMethod.PUMP_DUTY, disabled: false },
                            { name: "Dynamic Pressure Loss", key: PressureMethod.FIXED_PRESSURE_LOSS, disabled: false },
                        ]
                    },
                    multiFieldId: "pressureMethod"
                },
            );
            break;
        case PlantType.DRAINAGE_PIT:
            res.push(
                {
                    property: "name",
                    title: "Name",
                    hasDefault: false,
                    isCalculated: false,
                    type: FieldType.Text,
                    params: null,
                    multiFieldId: "name"
                },
            )
            break;
        case PlantType.DRAINAGE_GREASE_INTERCEPTOR_TRAP:
            const manufacturer = drawing.metadata.catalog.greaseInterceptorTrap![0]?.manufacturer || 'generic';

            res.splice(2, 0, {
                property: 'plant.location',
                title: 'Location',
                hasDefault: false,
                isCalculated: false,
                type: FieldType.Choice,
                params: {
                    choices: auCatalog.greaseInterceptorTrap!.location.map(i => ({name: i.name, key: i.uid})),
                },
                multiFieldId: 'plant.location',
            },
            {
                property: 'plant.position',
                title: 'Position',
                hasDefault: false,
                isCalculated: false,
                type: FieldType.Choice,
                params: {
                    choices: [
                        { name: 'Below Ground', key: 'belowGround' },
                        { name: 'Above Ground', key: 'aboveGround' },
                    ]
                },
                multiFieldId: 'plant.position',
            },
            {
                property: 'plant.capacity',
                title: 'Grease Interceptor Trap Capacity',
                hasDefault: false,
                isCalculated: false,
                type: FieldType.Choice,
                params: {
                    choices: Object.keys(auCatalog.greaseInterceptorTrap!.size[manufacturer]?.[entity.plant.location]?.[entity.plant.position] || [])
                        .map(key => ({
                            name: key,
                            key
                        }))
                },
                multiFieldId: 'plant.capacity',
                slot: true,
            });

            res.push(
                {
                    property: "widthMM",
                    title: "Width",
                    hasDefault: false,
                    isCalculated: false,
                    type: FieldType.Number,
                    params: { min: 0, max: null },
                    multiFieldId: "widthMM",
                    units: Units.Millimeters,
                    readonly: isReadonly(catalog, drawing, entity),
                },
                {
                    property: "lengthMM",
                    title: "Length",
                    hasDefault: false,
                    isCalculated: false,
                    type: FieldType.Number,
                    params: { min: 0, max: null },
                    multiFieldId: "lengthMM",
                    units: Units.Millimeters,
                    readonly: isReadonly(catalog, drawing, entity),
                }
            );
            break;
        default:
            assertUnreachable(entity.plant);
    }

    if (!iAmDrainage) {
        if (entity.plant.type !== PlantType.RETURN_SYSTEM) {
            switch (entity.plant.pressureLoss.pressureMethod) {
                case PressureMethod.PUMP_DUTY:
                    res.push({
                        property: "plant.pressureLoss.pumpPressureKPA",
                        title: "Pump Pressure",
                        hasDefault: true,
                        isCalculated: false,
                        type: FieldType.Number,
                        params: {min: 0, max: null},
                        multiFieldId: "pumpPressureKPA",
                        units: Units.KiloPascals,
                    });
                    break;
                case PressureMethod.FIXED_PRESSURE_LOSS:
                    res.push({
                        property: "plant.pressureLoss.pressureLossKPA",
                        title: "Pressure Loss",
                        hasDefault: true,
                        isCalculated: false,
                        type: FieldType.Number,
                        params: {min: 0, max: null},
                        multiFieldId: "pressureLossKPA",
                        units: Units.KiloPascals,
                    });
                    break;
                case PressureMethod.STATIC_PRESSURE:
                    res.push({
                        property: "plant.pressureLoss.staticPressureKPA",
                        title: "Static Pressure",
                        hasDefault: true,
                        isCalculated: false,
                        type: FieldType.Number,
                        params: {min: 0, max: null},
                        multiFieldId: "staticPressureKPA",
                        units: Units.KiloPascals,
                    });
                    break;
                default:
                    assertUnreachable(entity.plant.pressureLoss);
            }
        }

        res.push(
            {
                property: "outletTemperatureC",
                title: "Outlet Temperature",
                hasDefault: true,
                highlightOnOverride: COLORS.YELLOW,
                isCalculated: false,
                type: FieldType.Number,
                params: { min: null, max: null },
                multiFieldId: "outletTemperatureC",
                units: Units.Celsius,
            },

        );
    }

    if (entity.plant.type !== PlantType.DRAINAGE_GREASE_INTERCEPTOR_TRAP) {
        res.push(
            {
                property: "widthMM",
                title: "Width",
                hasDefault: false,
                isCalculated: false,
                type: FieldType.Number,
                params: { min: 0, max: null },
                multiFieldId: "widthMM",
                units: Units.Millimeters,
                readonly: isReadonly(catalog, drawing, entity),
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
                readonly: isReadonly(catalog, drawing, entity),
            }
        );
    }

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
            if (result.plant.gasConsumptionMJH === null) {
                result.plant.gasConsumptionMJH = 500;
            }
            if (result.plant.gasPressureKPA === null) {
                result.plant.gasPressureKPA = 2.75;
            }
            break;
        case PlantType.TANK:
        case PlantType.CUSTOM:
        case PlantType.PUMP:
        case PlantType.DRAINAGE_PIT:
        case PlantType.DRAINAGE_GREASE_INTERCEPTOR_TRAP:
            break;
        default:
            assertUnreachable(result.plant);
    }

    return result;
}

function isReadonly(catalog: Catalog, drawing: DrawingState, entity: PlantEntity) {
    let isReadonly = false;
    switch(entity.plant.type) {
        case PlantType.RETURN_SYSTEM:
        case PlantType.TANK:
        case PlantType.CUSTOM:
        case PlantType.PUMP:
        case PlantType.DRAINAGE_PIT:
            break;
        case PlantType.DRAINAGE_GREASE_INTERCEPTOR_TRAP:
            const manufacturer = drawing.metadata.catalog.greaseInterceptorTrap![0]?.manufacturer || 'generic';
            isReadonly = manufacturer !== 'generic';
            break;
        default:
            assertUnreachable(entity.plant);
    }
    return isReadonly;
}
