export type DirectedValveConcrete =
    | CheckValve
    | IsolationValve
    | WaterMeter
    | Strainer
    | RPZDSingle
    | RPZDDoubleShared
    | RPZDDoubleIsolated
    | PressureReliefValveSingle
    | PressureReliefValveDouble
    | PressureReliefValveTriple
    | ReturnPump;

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
    makeIsolationCaseOnRingMains: boolean;
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

export interface PressureReliefValveSingle extends DirectedValve {
    type: ValveType.PRV_SINGLE;
    targetPressureKPA: number | null;
    catalogId: "prv";
    sizeMM: number | null;
}

export interface PressureReliefValveDouble extends DirectedValve {
    type: ValveType.PRV_DOUBLE;
    targetPressureKPA: number | null;
    catalogId: "prv";
    sizeMM: number | null;
    isolateOneWhenCalculatingHeadLoss: boolean;
}

export interface PressureReliefValveTriple extends DirectedValve {
    type: ValveType.PRV_TRIPLE;
    targetPressureKPA: number | null;
    catalogId: "prv";
    sizeMM: number | null;
    isolateOneWhenCalculatingHeadLoss: boolean;
}

export interface ReturnPump extends DirectedValve {
    type: ValveType.RETURN_PUMP;
}

export enum ValveType {
    CHECK_VALVE = "CHECK_VALVE",
    ISOLATION_VALVE = "ISOLATION_VALVE",
    RPZD_SINGLE = "RPZD",
    RPZD_DOUBLE_SHARED = "RPZD_DOUBLE_SHARED",
    RPZD_DOUBLE_ISOLATED = "RPZD_DOUBLE_ISOLATED",
    WATER_METER = "WATER_METER",
    STRAINER = "STRAINER",
    PRV_SINGLE = "PRV_SINGLE",
    PRV_DOUBLE = "PRV_DOUBLE",
    PRV_TRIPLE = "PRV_TRIPLE",
    RETURN_PUMP = "RETURN_PUMP",
}
