import LoadingUnitTable from '../../../src/store/catalog/psd-standard/loading-unit-table';
import LoadingUnitHotColdTable from '../../../src/store/catalog/psd-standard/loading-unit-hot-cold-table';
import Equation from '../../../src/store/catalog/psd-standard/equation';
import {DwellingStandardType, PsdStandard, PSDStandardType} from "./psd-standard/types";

export default interface CatalogState {
    defaultCatalog: Catalog;
    loaded: boolean;
}

export interface DwellingUnitHotColdTable {
    type: PSDStandardType.LU_HOT_COLD_LOOKUP_TABLE;
    name: string;
    table: {[key: string]: {cold: string, hot: string}};
}


export type Diameter = number | string;
export type PSDSpec = LoadingUnitTable | LoadingUnitHotColdTable | Equation;
export type DwellingSpec = DwellingUnitHotColdTable | Equation;

export interface Catalog {
    fixtures: {[key: string]: FixtureSpec};
    pipes: {[key: string]: PipeMaterial};
    valves: {[key: string]: ValveSpec};
    mixingValves: {[key: string]: MixingValveSpec};
    psdStandards: {[key: string]: PSDSpec};
    dwellingStandards: {[key: string]: DwellingSpec};
    fluids: {[key: string]: FluidsSpec};
}

export interface FixtureSpec {
    name: string;
    abbreviation: string;
    uid: string;

    fixtureUnits: string | null;
    loadingUnits: {[key: string]: LoadingUnit};
    qLS: FlowRateSpec;
    continuousFlowLS?: FlowRateSpec;


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

export interface FlowRateSpec {
    cold: string | null;
    hot: string | null;
}

export interface  ValveSpec {
    name: string;
    uid: string;
    abbreviation: string | null;
    valvesBySize: {[key: string]: ValveSize};
}

export interface ValveSize {
    valveUid: string;
    symbol: string | null;
    diameterNominalMM: Diameter | null;
    kValue: string | null;
}

export interface PipeMaterial {
    name: string;
    uid: string;
    abbreviation: string;
    pipesBySize: {[key: string]: PipeSpec};
}

export interface PipeSpec {
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
    pressureLossKPAbyFlowRateLS: {[key: string]: string};
}

export interface FluidsSpec {
    name: string;
    densityKGM3: string;
    dynamicViscosityByTemperature: {[key: string]: string};
}
