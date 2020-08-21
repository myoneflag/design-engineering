export enum PlantType {
    RETURN_SYSTEM = 'RETURN_SYSTEM',
    PUMP = 'PUMP',
    TANK = 'TANK',
    CUSTOM = 'CUSTOM',
}

export enum HotWaterPlantGrundfosSettingsName {
    "20-60-1" = 'Grundfos UPS 20-60 N Setting 1',
    "20-60-2" = 'Grundfos UPS 20-60 N Setting 2',
    "20-60-3" = 'Grundfos UPS 20-60 N Setting 3',
    "32-80-1" = 'Grundfos UPS 32-80 N Setting 1',
    "32-80-2" = "Grundfos UPS 32-80 N Setting 2",
    "32-80-3" = "Grundfos UPS 32-80 N Setting 3",
}

export interface Plant {
    type: PlantType;
}

export enum PressureMethod {
    PUMP_DUTY = "PUMP_DUTY",
    FIXED_PRESSURE_LOSS = "FIXED_PRESSURE_LOSS",
    STATIC_PRESSURE = "STATIC_PRESSURE"
}

export interface StaticPressure {
    pressureMethod: PressureMethod.STATIC_PRESSURE;
    staticPressureKPA: number | null;
}

export interface FixedPressureLoss {
    pressureMethod: PressureMethod.FIXED_PRESSURE_LOSS;
    pressureLossKPA: number | null;
}

export interface PumpPressure {
    pressureMethod: PressureMethod.PUMP_DUTY;
    pumpPressureKPA: number | null;
}

export interface AnyPressure {
    pressureMethod: PressureMethod;
    staticPressureKPA: number | null;
    pressureLossKPA: number | null;
    pumpPressureKPA: number | null;
}

export interface TankPlant extends Plant {
    type: PlantType.TANK;
    pressureLoss: StaticPressure;
}

export interface ReturnSystemPlant extends Plant {
    returnMinimumTemperatureC: number | null;
    type: PlantType.RETURN_SYSTEM;
    returnUid: string;
    addReturnToPSDFlowRate: boolean;
    returnVelocityMS: number | null;
    gasConsumptionMJH: number | null;
    gasNodeUid: string;
}


export interface PumpPlant extends Plant {
    type: PlantType.PUMP;
    pressureLoss: PumpPressure;
}

export interface CustomPlant extends Plant {
    type: PlantType.CUSTOM;
    pressureLoss: AnyPressure;
}

export type PlantConcrete = ReturnSystemPlant | TankPlant | CustomPlant | PumpPlant;
