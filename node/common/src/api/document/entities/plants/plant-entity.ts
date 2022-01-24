import { GasRegulator } from './../directed-valves/valve-types';
import {
    CenteredEntity,
    COLORS,
    Coord,
    DrawingState
} from "../../drawing";
import { EntityType } from "../types";
import {
    FieldType,
    PropertyField,
} from "../property-field";
import {
    PlantType,
    PlantConcrete,
    PlantManufacturers,
    HotWaterPlantManufacturers,
    GreaseInterceptorTrapManufacturers,
    PressureMethod,
    ReturnSystemPlant,
    RheemVariantValues,
} from "./plant-types";
import {
    assertUnreachable,
    isDrainage,
} from "../../../config";
import { auCatalog } from "../../../catalog/initial-catalog/au-catalog";
import {
    Catalog,
    HotWaterPlant,
    HotWaterPlantSizePropsElectric,
    HotWaterPlantSizePropsHeatPump,
} from './../../../catalog/types';
import { Units } from "../../../../lib/measurements";
import { cloneSimple } from "../../../../lib/utils";
import DirectedValveEntity from "../directed-valves/directed-valve-entity";

export default interface PlantEntity extends CenteredEntity {
    center: Coord;
    rotation: number;
    rightToLeft: boolean;

    inletUid: string;
    inletSystemUid: string;
    outletUid: string;
    outletSystemUid: string;

    name: string;
    type: EntityType.PLANT;

    widthMM: number | null;
    heightMM: number | null;
    heightAboveFloorM: number | null;
    outletTemperatureC: number | null;

    plant: PlantConcrete;

    calculation: {
        widthMM: number | null;
        depthMM: number | null;
    };
}

export function makePlantEntityFields(
    entity: PlantEntity,
    drawing: DrawingState,
    catalog: Catalog,
    regulator?: DirectedValveEntity,
): PropertyField[] {
    const filled = fillPlantDefaults(entity, drawing, catalog, regulator);

    const iAmDrainage = isDrainage(filled.outletSystemUid, drawing.metadata.flowSystems) ||
        isDrainage(filled.inletSystemUid, drawing.metadata.flowSystems);

    const res: PropertyField[] = [
        {
            property: 'plant.type',
            title: 'Plant Type',
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Choice,
            params: {
                choices: [
                    { name: 'Return System', key: PlantType.RETURN_SYSTEM },
                    { name: 'Tank', key: PlantType.TANK },
                    { name: 'Pump', key: PlantType.PUMP },
                    { name: 'Custom', key: PlantType.CUSTOM },
                    { name: 'Drainage Pit', key: PlantType.DRAINAGE_PIT },
                    { name: 'Grease Interceptor Trap', key: PlantType.DRAINAGE_GREASE_INTERCEPTOR_TRAP },
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
            params: { systems: drawing.metadata.flowSystems },
            multiFieldId: "inletSystemUid"
        },
        {
            property: "outletSystemUid",
            title: "Outlet Flow System",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.FlowSystemChoice,
            params: { systems: drawing.metadata.flowSystems },
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

    switch (filled.plant.type) {
        case PlantType.RETURN_SYSTEM:
            resolvePlantReturnSystemFields(res, drawing, filled, catalog.hotWaterPlant)
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
                    hasDefault: true,
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
                    hasDefault: true,
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
                    multiFieldId: "plant.pressureLoss.pressureMethod",
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
            const manufacturer = drawing.metadata.catalog.greaseInterceptorTrap![0].manufacturer as GreaseInterceptorTrapManufacturers;

            res.splice(2, 0,
                {
                    property: 'plant.location',
                    title: 'Location',
                    hasDefault: true,
                    isCalculated: false,
                    type: FieldType.Choice,
                    params: {
                        choices: auCatalog.greaseInterceptorTrap!.location.map((i) => ({ name: i.name, key: i.uid })),
                    },
                    multiFieldId: 'plant.location',
                },
                {
                    property: 'plant.position',
                    title: 'Position',
                    hasDefault: true,
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
                    title: 'Capacity',
                    hasDefault: true,
                    isCalculated: false,
                    type: FieldType.Choice,
                    params: {
                        choices: Object.keys(
                            auCatalog.greaseInterceptorTrap!.size[manufacturer]?.[filled.plant.location!]?.[filled.plant.position!] || []
                        ).map((key) => ({
                            name: key,
                            key
                        })),
                    },
                    multiFieldId: 'plant.capacity',
                    slot: true,
                }
            );

            res.push(
                {
                    property: "widthMM",
                    title: "Width",
                    hasDefault: true,
                    isCalculated: false,
                    type: FieldType.Number,
                    params: { min: 0, max: null },
                    multiFieldId: null,
                    units: Units.Millimeters,
                    readonly: isReadonly(drawing, filled),
                },
                {
                    property: "plant.lengthMM",
                    title: "Length",
                    hasDefault: true,
                    isCalculated: false,
                    type: FieldType.Number,
                    params: { min: 0, max: null },
                    multiFieldId: null,
                    units: Units.Millimeters,
                    readonly: isReadonly(drawing, filled),
                }
            );
            break;
        default:
            assertUnreachable(filled.plant);
    }

    if (!iAmDrainage) {
        if (filled.plant.type !== PlantType.RETURN_SYSTEM) {
            switch (filled.plant.pressureLoss.pressureMethod) {
                case PressureMethod.PUMP_DUTY:
                    res.push({
                        property: "plant.pressureLoss.pumpPressureKPA",
                        title: "Pump Pressure",
                        hasDefault: true,
                        isCalculated: false,
                        type: FieldType.Number,
                        params: { min: 0, max: null },
                        multiFieldId: "plant.pressureLoss.pumpPressureKPA",
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
                        params: { min: 0, max: null },
                        multiFieldId: "plant.pressureLoss.pressureLossKPA",
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
                        params: { min: 0, max: null },
                        multiFieldId: "plant.pressureLoss.staticPressureKPA",
                        units: Units.KiloPascals,
                    });
                    break;
                default:
                    assertUnreachable(filled.plant.pressureLoss);
            }
        }

        if (!(filled.plant.type === PlantType.RETURN_SYSTEM
            && drawing.metadata.catalog.hotWaterPlant.find((i) => i.uid === 'hotWaterPlant')?.manufacturer === 'rheem')) {

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
    }

    const hasDefault = filled.plant.type === PlantType.RETURN_SYSTEM && drawing.metadata.catalog.hotWaterPlant.find((i) => i.uid === 'hotWaterPlant')?.manufacturer === 'rheem';

    if (filled.plant.type !== PlantType.DRAINAGE_GREASE_INTERCEPTOR_TRAP) {
        res.push(
            {
                property: "widthMM",
                title: "Width",
                hasDefault,
                isCalculated: false,
                type: FieldType.Number,
                params: { min: 0, max: null },
                multiFieldId: null,
                units: Units.Millimeters,
                readonly: isReadonly(drawing, filled),
            },
            {
                property: "heightMM",
                title: "Height",
                hasDefault,
                isCalculated: false,
                type: FieldType.Number,
                params: { min: 0, max: null },
                multiFieldId: null,
                units: Units.Millimeters,
                readonly: isReadonly(drawing, filled),
            }
        );
    }

    return res;
}

export function fillPlantDefaults(
    entity: PlantEntity,
    drawing: DrawingState,
    catalog: Catalog,
    regulator?: DirectedValveEntity,
) {
    const result = cloneSimple(entity);

    if (result.plant.type !== PlantType.RETURN_SYSTEM) {
        switch (result.plant.pressureLoss.pressureMethod) {
            case PressureMethod.PUMP_DUTY:
                if (result.plant.pressureLoss.pumpPressureKPA === null) {
                    result.plant.pressureLoss.pumpPressureKPA = 0;
                }
                break;
            case PressureMethod.STATIC_PRESSURE:
                if (result.plant.pressureLoss.staticPressureKPA === null) {
                    result.plant.pressureLoss.staticPressureKPA = 0;
                }
                break;
            case PressureMethod.FIXED_PRESSURE_LOSS:
                if (result.plant.pressureLoss.pressureLossKPA === null) {
                    result.plant.pressureLoss.pressureLossKPA = 0;
                }
                break;
            default:
                assertUnreachable(result.plant.pressureLoss);
        }
    }

    if (result.outletTemperatureC === null) {
        const outSystem = drawing.metadata.flowSystems.find(
            (s) => s.uid === result.outletSystemUid
        );

        result.outletTemperatureC = outSystem
            && Number(outSystem.temperature)
            || Number(drawing.metadata.calculationParams.roomTemperatureC);
    }

    let manufacturer: PlantManufacturers = 'generic';
    let size;

    switch (result.plant.type) {
        case PlantType.RETURN_SYSTEM:
            const gasRegulator = regulator?.valve as GasRegulator;

            manufacturer = drawing.metadata.catalog.hotWaterPlant.find(
                (i) => i.uid === 'hotWaterPlant'
            )?.manufacturer as HotWaterPlantManufacturers || manufacturer;

            if (result.plant.returnMinimumTemperatureC === null) {
                result.plant.returnMinimumTemperatureC = result.outletTemperatureC - 5;
            }
            if (result.plant.returnVelocityMS === null) {
                const outSystem = drawing.metadata.flowSystems.find((s) => s.uid === result.outletSystemUid)!;
                result.plant.returnVelocityMS = Number(outSystem.returnMaxVelocityMS);
            }

            if (manufacturer === 'rheem') {
                if (result.plant.rheemVariant === null) {
                    result.plant.rheemVariant = RheemVariantValues.continuousFlow;
                }
                if (result.plant.rheemPeakHourCapacity === null) {
                    result.plant.rheemPeakHourCapacity = 0;
                }
                if (!result.plant.rheemMinimumInitialDelivery) {
                    result.plant.rheemMinimumInitialDelivery = 50;
                }
                if (!result.plant.rheemkWRating) {
                    result.plant.rheemkWRating = 16;
                }
                if (!result.plant.rheemStorageTankSize) {
                    result.plant.rheemStorageTankSize = 325;
                }

                size = catalog.hotWaterPlant.size.rheem![result.plant.rheemVariant]!;

                if (result.heightAboveFloorM === null) {
                    result.heightAboveFloorM = 2;
                }
                if (result.plant.gasConsumptionMJH === null) {
                    result.plant.gasConsumptionMJH = size[1].gas.requirement;
                }
                if (result.plant.gasPressureKPA === null) {
                    result.plant.gasPressureKPA = gasRegulator?.downStreamPressureKPA || size[1].gas.pressure;
                }
            } else {
                if (result.plant.gasConsumptionMJH === null) {
                    result.plant.gasConsumptionMJH = 500;
                }
                if (result.plant.gasPressureKPA === null) {
                    result.plant.gasPressureKPA = gasRegulator?.downStreamPressureKPA || 2.75;
                }
            }

            break;
        case PlantType.DRAINAGE_GREASE_INTERCEPTOR_TRAP:
            manufacturer = drawing.metadata.catalog.greaseInterceptorTrap![0].manufacturer as GreaseInterceptorTrapManufacturers;

            if (result.plant.location === null) {
                result.plant.location = 'nsw';
            }
            if (result.plant.position === null) {
                result.plant.position = 'belowGround';
            }
            if (result.plant.capacity === null) {
                result.plant.capacity = manufacturer === 'generic'
                    ? '1000L'
                    : '1000';
            }

            size = catalog.greaseInterceptorTrap!.size[manufacturer][result.plant.location][result.plant.position][result.plant.capacity];

            if (result.widthMM === null) {
                result.widthMM = size.widthMM;
            }
            if (result.heightMM === null) {
                result.heightMM = size.heightMM;
            }
            if (result.plant.lengthMM === null) {
                result.plant.lengthMM = size.lengthMM;
            }

            break;
        case PlantType.TANK:
        case PlantType.CUSTOM:
        case PlantType.PUMP:
        case PlantType.DRAINAGE_PIT:
            break;
        default:
            assertUnreachable(result.plant);
    }

    if (result.widthMM === null) {
        result.widthMM = result.calculation.widthMM || 500;
    }
    if (result.heightMM === null) {
        result.heightMM = result.calculation.depthMM || 300;
    }
    if (result.heightAboveFloorM === null) {
        result.heightAboveFloorM = 0.75;
    }

    if (hasGas(manufacturer, result)) {
        const returnSystem = result.plant as ReturnSystemPlant;
        if (returnSystem.diversity === null) {
            returnSystem.diversity = 100;
        }
    }

    return result;
}

function resolvePlantReturnSystemFields(
    fields: PropertyField[],
    drawing: DrawingState,
    entity: PlantEntity,
    hotWaterPlantCatalog: HotWaterPlant,
): PropertyField[] {
    const plant = entity.plant as ReturnSystemPlant;
    const manufacturer = drawing.metadata.catalog.hotWaterPlant.find(
        (i) => i.uid === 'hotWaterPlant'
    )?.manufacturer as HotWaterPlantManufacturers || 'generic';

    if (manufacturer === 'rheem') {
        fields.splice(0, 1, {
            property: 'plant.rheemVariant',
            title: 'Plant Type',
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Choice,
            params: {
                choices: hotWaterPlantCatalog.rheemVariants.map((i) => ({ name: i.name, key: i.uid }))
            },
            multiFieldId: 'plant.rheemVariant',
        });

        if (plant.rheemVariant === 'tankpak' || plant.rheemVariant === 'electric' || plant.rheemVariant === 'heatPump') {
            const newFields: PropertyField[] = [
                {
                    property: 'plant.rheemPeakHourCapacity',
                    title: 'Peak Hour Capacity',
                    hasDefault: false,
                    isCalculated: false,
                    type: FieldType.Number,
                    params: {
                        min: 0,
                        max: null,
                    },
                    multiFieldId: 'plant.rheemPeakHourCapacity',
                    slot: true,
                }
            ];

            if (plant.rheemVariant === 'electric') {
                newFields.push({
                    property: 'plant.rheemMinimumInitialDelivery',
                    title: 'Minimum Initial Delivery',
                    hasDefault: false,
                    isCalculated: false,
                    type: FieldType.Choice,
                    params: {
                        choices: [...new Set((Object.values(hotWaterPlantCatalog.size.rheem![plant.rheemVariant]!) as HotWaterPlantSizePropsElectric[]).map((i) => i.minimumInitialDelivery))].map((i) => ({ name: `${i}`, key: i }))
                    },
                    multiFieldId: 'plant.rheemMinimumInitialDelivery',
                });
            }

            if (plant.rheemVariant === 'heatPump') {
                newFields.splice(0, 0,
                    {
                        property: 'plant.rheemkWRating',
                        title: 'kW Rating',
                        hasDefault: false,
                        isCalculated: false,
                        type: FieldType.Choice,
                        params: {
                            choices: [...new Set((Object.values(hotWaterPlantCatalog.size.rheem![plant.rheemVariant]!) as HotWaterPlantSizePropsHeatPump[]).map((i) => i.kW))].map((i) => ({ name: `${i}`, key: i }))
                        },
                        multiFieldId: 'plant.rheemkWRating',
                    },
                    {
                        property: 'plant.rheemStorageTankSize',
                        title: 'Storage Tank Size (L)',
                        hasDefault: false,
                        isCalculated: false,
                        type: FieldType.Choice,
                        params: {
                            choices: Object.values(hotWaterPlantCatalog.storageTanks).map((i) => ({ name: `${i.capacity}`, key: i.capacity }))
                        },
                        multiFieldId: 'plant.rheemStorageTankSize',
                    })
            }

            fields.splice(1, 0, ...newFields);
        }
    }

    const otherFields: PropertyField[] = [
        ...(manufacturer !== 'rheem' && [
            {
                property: "name",
                title: "Name",
                hasDefault: false,
                isCalculated: false,
                type: FieldType.Text,
                params: null,
                multiFieldId: "name"
            }
        ] as PropertyField[] || []),
        {
            property: "heightAboveFloorM",
            title: "Height Above Floor",
            hasDefault: true,
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
            multiFieldId: "plant.returnMinimumTemperatureC",
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
            multiFieldId: "plant.returnVelocityMS",
            units: Units.MetersPerSecond,
        },
        {
            property: "plant.addReturnToPSDFlowRate",
            title: "Add Return to PSD Flow Rate",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Boolean,
            params: null,
            multiFieldId: "plant.addReturnToPSDFlowRate",
        },
        ...(hasGas(manufacturer, entity) && [
            {
                property: "plant.gasConsumptionMJH",
                title: "Gas Consumption",
                hasDefault: true,
                isCalculated: false,
                type: FieldType.Number,
                params: { min: 0, max: null },
                multiFieldId: "plant.gasConsumptionMJH",
                units: Units.MegajoulesPerHour,
            },
            {
                property: "plant.diversity",
                title: "Diversity",
                hasDefault: false,
                isCalculated: false,
                type: FieldType.Number,
                params: { min: 0, max: null },
                multiFieldId: "diversity",
                units: Units.Percent,
            },
            {
                property: "plant.gasPressureKPA",
                title: "Gas Pressure",
                hasDefault: true,
                isCalculated: false,
                type: FieldType.Number,
                params: { min: 0, max: null },
                multiFieldId: "plant.gasPressureKPA",
                units: Units.GasKiloPascals,
            }
        ] as PropertyField[] || []),

    ];

    fields.push(...otherFields);

    return fields;
}

function hasGas(manufacturer: PlantManufacturers, entity: PlantEntity) {
    if (entity.plant.type === PlantType.RETURN_SYSTEM &&
        (manufacturer === 'generic' ||
            (manufacturer === 'rheem' &&
                ![RheemVariantValues.electric, RheemVariantValues.heatPump].includes(entity.plant.rheemVariant!)))) {
        return true;
    }

    return false;
}

function isReadonly(drawing: DrawingState, entity: PlantEntity) {
    const catalog = drawing.metadata.catalog;

    let readOnly = false;

    switch (entity.plant.type) {
        case PlantType.DRAINAGE_GREASE_INTERCEPTOR_TRAP:
            readOnly = catalog.greaseInterceptorTrap![0].manufacturer as GreaseInterceptorTrapManufacturers !== 'generic';
            break;
        case PlantType.RETURN_SYSTEM:
        case PlantType.TANK:
        case PlantType.CUSTOM:
        case PlantType.PUMP:
        case PlantType.DRAINAGE_PIT:
            break;
        default:
            assertUnreachable(entity.plant);
    }

    return readOnly;
}
