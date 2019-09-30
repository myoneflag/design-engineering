import LoadingUnitTable from '@/store/catalog/psd-standard/loading-unit-table';

export default interface CatalogState {
    defaultCatalog: Catalog;
    loaded: boolean;
}

export type Diameter = number | string;
export type PSDSpec = LoadingUnitTable;

export interface Catalog {
    fixtures: {[key: string]: FixtureSpec};
    pipes: {[key: string]: PipeMaterial};
    valves: {[key: string]: ValveSpec};
    mixingValves: {[key: string]: MixingValveSpec};
    psdStandards: {[key: string]: PSDSpec};
}

export interface FixtureSpec {
    name: string;
    uid: string;

    fixtureUnits: number | null;
    loadingUnits: {[key: string]: LoadingUnit};

    maxInletPressureKPA: string | null;
    minInletPressureKPA: string | null;
    probabilityOfUsagePCT: string | null;

    outletAboveFloorM: string | null;

    warmTempC: string | null;
}

export interface LoadingUnit {
    cold: string | null;
    hot: string | null;
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
    kValue: string | null;
}

export interface PipeMaterial {
    name: string;
    uid: string;
    pipesBySize: {[key: string]: Pipe};
}

export interface Pipe {
    name: string;
    uid: string;
    diameterNominalMM: Diameter | null;
    diameterInternalMM: Diameter | null;
    colebrookWhiteCoefficient: string | null;
    safeWorkingPressureKPA: string | null;
}

export interface MixingValveSpec {
    minInletPressureKPA: string;
    maxInletPressureKPA: string;
    maxHotColdPressureDifferentialPCT: string;
    minFlowRateLS: string;
    maxFlowRateLS: string;
}
