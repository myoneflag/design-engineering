export type DirectedValveConcrete =
    | CheckValve
    | IsolationValve
    | PressureReliefValve
    | WaterMeter
    | Strainer
    | RPZDSingle
    | RPZDDoubleShared
    | RPZDDoubleIsolated;

export interface DirectedValve {
    type: ValveType;
    catalogId: string;
}

export interface CheckValve extends DirectedValve {
    type: ValveType.CHECK_VALVE;
    catalogId: "checkValve";
}

export interface IsolationValve extends DirectedValve {
    type: ValveType.ISOLATION_VALVE;
    catalogId: "gateValve" | "ballValve" | "butterflyValve";
    isClosed: boolean;
}

export interface PressureReliefValve extends DirectedValve {
    type: ValveType.PRESSURE_RELIEF_VALVE;
    catalogId: "prv1";
    targetPressureKPA: number | null;
}

export interface WaterMeter extends DirectedValve {
    type: ValveType.WATER_METER;
    catalogId: "waterMeter";
}

export interface Strainer extends DirectedValve {
    type: ValveType.STRAINER;
    catalogId: "strainer";
}

export interface RPZDSingle extends DirectedValve {
    type: ValveType.RPZD_SINGLE;
    catalogId: "RPZD";
    sizeMM: number | null;
}

export interface RPZDDoubleShared extends DirectedValve {
    type: ValveType.RPZD_DOUBLE_SHARED;
    catalogId: "RPZD";
    sizeMM: number | null;
}

export interface RPZDDoubleIsolated extends DirectedValve {
    type: ValveType.RPZD_DOUBLE_ISOLATED;
    catalogId: "RPZD";
    sizeMM: number | null;
    isolateOneWhenCalculatingHeadLoss: boolean;
}

export enum ValveType {
    CHECK_VALVE = "CHECK_VALVE",
    ISOLATION_VALVE = "ISOLATION_VALVE",
    PRESSURE_RELIEF_VALVE = "PRESSURE_RELIEF_VALVE",
    RPZD_SINGLE = "RPZD",
    RPZD_DOUBLE_SHARED = "RPZD_DOUBLE_SHARED",
    RPZD_DOUBLE_ISOLATED = "RPZD_DOUBLE_ISOLATED",
    WATER_METER = "WATER_METER",
    STRAINER = "STRAINER"
}
