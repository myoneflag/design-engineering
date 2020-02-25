import { FieldType, PropertyField } from "./property-field";
import { EntityType } from "./types";
import { CenteredEntity, Coord, FlowSystemParameters } from "../drawing";
import { cloneSimple } from "../../../lib/utils";
import { DocumentState } from "../../../../../frontend/src/store/document/types";

export interface PlantEntityV3 extends CenteredEntity {
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

    pressureMethod: PressureMethod;
    pumpPressureKPA: number | null;
    pressureLossKPA: number | null;
    staticPressureKPA: number | null;

    inletUid: string;
    outletUid: string;
}

export function plantV3toCurrent(entity: PlantEntityV3): PlantEntity {
    if (entity.hasOwnProperty("pressureMethod")) {
        return (entity as any) as PlantEntity;
    }

    let pressureMethod: PressureMethod = PressureMethod.FIXED_PRESSURE_LOSS;
    if (entity.pumpPressureKPA !== null) {
        pressureMethod = PressureMethod.PUMP_DUTY;
    }
    if (entity.pressureLossKPA !== null) {
        pressureMethod = PressureMethod.FIXED_PRESSURE_LOSS;
    }

    const result: PlantEntity = {
        uid: entity.uid,
        parentUid: entity.parentUid,
        type: entity.type,
        center: entity.center,
        inletSystemUid: entity.inletSystemUid,
        outletSystemUid: entity.outletSystemUid,
        outletTemperatureC: null,

        name: entity.name,
        rotation: entity.rotation,
        rightToLeft: entity.rightToLeft || false,
        heightAboveFloorM: entity.heightAboveFloorM,
        widthMM: entity.widthMM,
        heightMM: entity.heightMM,
        inletUid: entity.inletUid,
        outletUid: entity.outletUid,
        pumpPressureKPA: entity.pumpPressureKPA,
        pressureLossKPA: entity.pressureLossKPA,

        staticPressureKPA: null,
        pressureMethod
    };
    return result;
}

export enum PressureMethod {
    PUMP_DUTY = "PUMP_DUTY",
    FIXED_PRESSURE_LOSS = "FIXED_PRESSURE_LOSS",
    STATIC_PRESSURE = "STATIC_PRESSURE"
}

export function makePlantEntityFields(entity: PlantEntity, systems: FlowSystemParameters[]): PropertyField[] {
    const outSystem = systems.find((u) => u.uid === entity.outletSystemUid);

    const res: PropertyField[] = [
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

        {
            property: "pressureMethod",
            title: "Pressure Type",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Choice,
            params: {
                choices: [
                    { name: "Pump Duty", key: PressureMethod.PUMP_DUTY, disabled: false },
                    { name: "Constant Pressure Loss", key: PressureMethod.FIXED_PRESSURE_LOSS, disabled: false },
                    { name: "Static Pressure", key: PressureMethod.STATIC_PRESSURE, disabled: false }
                ]
            },
            multiFieldId: "pressureMethod"
        }
    );

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

    switch (entity.pressureMethod) {
        case PressureMethod.PUMP_DUTY:
            res.push({
                property: "pumpPressureKPA",
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
                property: "pressureLossKPA",
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
                property: "staticPressureKPA",
                title: "Static Pressure (kPa)",
                hasDefault: true,
                isCalculated: false,
                type: FieldType.Number,
                params: { min: 0, max: null },
                multiFieldId: "staticPressureKPA"
            });
            break;
    }




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

export function fillPlantDefaults(value: PlantEntity, doc: DocumentState) {
    const result = cloneSimple(value);

    if (value.pressureLossKPA === null) {
        result.pressureLossKPA = 0;
    }
    if (value.pumpPressureKPA === null) {
        result.pumpPressureKPA = 0;
    }
    if (value.staticPressureKPA === null) {
        result.staticPressureKPA = 0;
    }
    if (value.outletTemperatureC === null) {
        const outSystem = doc.drawing.metadata.flowSystems.find((s) => s.uid === value.outletSystemUid);
        result.outletTemperatureC = outSystem ? outSystem.temperature : doc.drawing.metadata.calculationParams.roomTemperatureC;
    }

    return result;
}
