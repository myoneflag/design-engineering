import { DwellingStandardType } from "./psd-standard/types";
import LoadingUnitTable from "./psd-standard/loading-unit-table";
import LoadingUnitHotColdTable from "./psd-standard/loading-unit-hot-cold-table";
import PsdEquation from "./psd-standard/psdEquation";

export interface DwellingUnitHotColdTable {
    type: DwellingStandardType.DWELLING_HOT_COLD_LOOKUP_TABLE;
    name: string;
    hotColdTable: { [key: string]: { cold: string; hot: string } };
}

export interface DwellingEquation {
    type: DwellingStandardType.EQUATION;
    name: string;
    equation: string;
    variables: { [key: string]: string };
}

export type Diameter = number | string;
export type PSDSpec = LoadingUnitTable | LoadingUnitHotColdTable | PsdEquation;
export type DwellingSpec = DwellingUnitHotColdTable | DwellingEquation;

export interface BackflowValveSize {
    sizeMM: string;
    minInletPressureKPA: string | null;
    maxInletPressureKPA: string | null;
    minFlowRateLS: string | null;
    maxFlowRateLS: string | null;
    pressureLossKPAByFlowRateLS: { [key: string]: string };
}

export interface BackflowValveSpec {
    name: string;
    valvesBySize: { [key: string]: BackflowValveSize };
}

export interface Catalog {
    fixtures: { [key: string]: FixtureSpec };
    pipes: { [key: string]: PipeMaterial };
    valves: { [key: string]: ValveSpec };
    mixingValves: { [key: string]: MixingValveSpec };
    backflowValves: { [key: string]: BackflowValveSpec };
    psdStandards: { [key: string]: PSDSpec };
    dwellingStandards: { [key: string]: DwellingSpec };
    fluids: { [key: string]: FluidsSpec };
}

export interface FixtureSpec {
    name: string;
    abbreviation: string;
    uid: string;

    fixtureUnits: string | null;
    loadingUnits: { [key: string]: LoadingUnit };
    qLS: FlowRateSpec;
    continuousFlowLS?: FlowRateSpec;
    roughIns: string[];

    maxInletPressureKPA: string | null;
    minInletPressureKPA: string | null;
    probabilityOfUsagePCT: string | null;

    outletAboveFloorM: string | null;

    warmTempC: string | null;
}

export interface LoadingUnit {
    [key: string]: string | null;
}

export interface FlowRateSpec {
    [key: string]: string | null;
}

export interface ValveSpec {
    name: string;
    uid: string;
    abbreviation: string | null;
    valvesBySize: { [key: string]: ValveSize };
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
    pipesBySize: { [key: string]: PipeSpec };
}

export interface PipeSpec {
    pipeUid: string;
    diameterNominalMM: Diameter | null;
    diameterInternalMM: Diameter | null;
    colebrookWhiteCoefficient: string | null;
    safeWorkingPressureKPA: string | null;
}

export interface MixingValveSpec {
    name: string;
    uid: string;
    minInletPressureKPA: string;
    maxInletPressureKPA: string;
    minFlowRateLS: string;
    maxFlowRateLS: string;
    pressureLossKPAbyFlowRateLS: { [key: string]: string };
}

export interface FluidsSpec {
    name: string;
    densityKGM3: string;
    dynamicViscosityByTemperature: { [key: string]: string };
}