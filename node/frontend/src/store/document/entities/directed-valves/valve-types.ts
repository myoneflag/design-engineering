export type DirectedValveConcrete =
    CheckValve |
    IsolationValve |
    PressureReliefValve |
    RPZDValve |
    WaterMeter |
    Strainer;

export interface DirectedValve {
    type: ValveType;
    catalogId: string;
}

export interface CheckValve extends DirectedValve {
    type: ValveType.CHECK_VALVE;
    catalogId: 'checkValve';
}

export interface IsolationValve extends DirectedValve {
    type: ValveType.ISOLATION_VALVE;
    catalogId: 'gateValve' | 'ballValve' | 'butterflyValve';
    isClosed: boolean;
}

export interface PressureReliefValve extends DirectedValve {
    type: ValveType.PRESSURE_RELIEF_VALVE;
    catalogId: 'prv1';
    targetPressureKPA: number | null;
}

export interface RPZDValve extends DirectedValve {
    type: ValveType.RPZD;
    catalogId: 'rpzd';
}

export interface WaterMeter extends DirectedValve {
    type: ValveType.WATER_METER;
    catalogId: 'waterMeter';
}

export interface Strainer extends DirectedValve {
    type: ValveType.STRAINER;
    catalogId: 'strainer';
}


export enum ValveType {
    CHECK_VALVE = 'CHECK_VALVE',
    ISOLATION_VALVE = 'ISOLATION_VALVE',
    PRESSURE_RELIEF_VALVE = 'PRESSURE_RELIEF_VALVE',
    RPZD = 'RPZD',
    WATER_METER = 'WATER_METER',
    STRAINER = 'STRAINER',
}
