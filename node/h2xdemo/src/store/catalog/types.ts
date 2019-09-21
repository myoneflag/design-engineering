export default interface CatalogState {
    defaultCatalog: Catalog;
    loaded: boolean;
}

export type Diameter = number | string;

export interface Catalog {
    fixtures: {[key: string]: FixtureSpec};
    pipes: {[key: string]: PipeMaterial};
    valves: {[key: string]: ValveSpec};
    mixingValves: {[key: string]: MixingValveSpec};
}

export interface FixtureSpec {
    name: string;
    uid: string;

    fixtureUnits: number | null;
    loadingUnits: {[key: string]: LoadingUnit};

    maxInletPressureKPA: number | null;
    minInletPressureKPA: number | null;
    probabilityOfUsagePCT: number | null;

    outletAboveFloorM: number | null;

    warmTempC: number | null;
}

export interface LoadingUnit {
    cold: number | null;
    hot: number | null;
}

export interface  ValveSpec {
    name: string;
    uid: string;
    abbreviation: string | null;
    valvesBySize: {[key: string]: Valve};
}

export interface Valve {
    valveUid: string;
    symbol: string | null;
    diameterNominalMM: Diameter | null;
    kValue: number | null;
}

export interface PipeMaterial {
    name: string;
    uid: string;
    pipesBySize: {[key: number]: Pipe};
}

export interface Pipe {
    name: string;
    uid: string;
    diameterNominalMM: Diameter | null;
    diameterInternalMM: Diameter | null;
    colebrookWhiteCoefficient: number | null;
    safeWorkingPressureKPA: number | null;
}

export interface MixingValveSpec {
    minInletPressureKPA: number;
    maxInletPressureKPA: number;
    maxHotColdPressureDifferentialPCT: number;
    minFlowRateLS: number;
    maxFlowRateLS: number;
}
