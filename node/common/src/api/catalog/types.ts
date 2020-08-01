import { DwellingStandardType } from "./psd-standard/types";
import LoadingUnitTable from "./psd-standard/loading-unit-table";
import LoadingUnitHotColdTable from "./psd-standard/loading-unit-hot-cold-table";
import PsdEquation from "./psd-standard/psdEquation";
import LoadingUnitMaxTable from "./psd-standard/loading-unit-max-table";
import { SupportedPsdStandards } from "../config";
import {PipesTable} from "./price-table";

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
export type PSDSpec = LoadingUnitTable | LoadingUnitHotColdTable | PsdEquation | LoadingUnitMaxTable;
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
    uid: string;
    abbreviation: string;
    manufacturer: Array<Manufacturer<'RPZD'>>;
    valvesBySize: { [key: string]: { [key: string]: BackflowValveSize } };
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
    prv: PRVSpec;
    balancingValves: BalancingValveSpec;
    hotWaterPlant: HotWaterPlant;
}

export interface BalancingValveSpec {
    manufacturer: Array<Manufacturer<'Balancing Valve'>>;
}

export interface HotWaterPlant {
    manufacturer: Manufacturer[];
    grundfosPressureDrop: { 
        [key: string]: { 
            [key: string]: string
        }
    }
}

export interface PRVSpec {
    manufacturer: Array<Manufacturer<'PRV'>>;
    size: { [key: string]: { [key: string]: PRVSize } };
}

export interface PRVSize {
    minInletPressureKPA: string | null;
    maxInletPressureKPA: string | null;
    minFlowRateLS: string | null;
    maxFlowRateLS: string | null;
    maxPressureDropRatio: string | null;
    diameterNominalMM: Diameter;
}

export interface FixtureSpec {
    name: string;
    priceTableName: string;
    abbreviation: string;
    uid: string;

    fixtureUnits: string | null;
    loadingUnits: {
        [SupportedPsdStandards.as35002018LoadingUnits]: LoadingUnit,
        [SupportedPsdStandards.barriesBookLoadingUnits]: LoadingUnit,
        [SupportedPsdStandards.bs806]: LoadingUnit,
        [SupportedPsdStandards.cibseGuideG]: LoadingUnit,
        [SupportedPsdStandards.ipc2018FlushTanks]: LoadingUnit,
        [SupportedPsdStandards.ipc2018Flushometer]: LoadingUnit,
        [SupportedPsdStandards.upc2018FlushTanks]: LoadingUnit,
        [SupportedPsdStandards.upc2018Flushometer]: LoadingUnit,
    };
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
    manufacturer: Array<Manufacturer<keyof PipesTable>>;
    pipesBySize: { [key: string]: { [key: string]: PipeSpec } };
}

export interface Manufacturer<ManufacturerEntryNames> {
    name: string;
    abbreviation: string;
    priceTableName: ManufacturerEntryNames;
    uid: string;
}

export interface PipeSpec {
    pipeUid: string;
    diameterNominalMM: Diameter | null;
    diameterInternalMM: Diameter | null;
    diameterOutsideMM: Diameter | null;
    colebrookWhiteCoefficient: string | null;
    safeWorkingPressureKPA: string | null;
}

export interface MixingValveSpec {
    name: string;
    uid: string;
    minInletPressureKPA: {
        generic: string;
        caleffi: string;
        [key: string]: string;
    };
    maxInletPressureKPA: {
        generic: string;
        caleffi: string;
        [key: string]: string;
    };
    minFlowRateLS: {
        generic: string;
        caleffi: string;
        [key: string]: string;
    };
    maxFlowRateLS: {
        generic: string;
        caleffi: string;
        [key: string]: string;
    };
    pressureLossKPAbyFlowRateLS: {
        generic: { [key: string]: string };
        caleffi: { [key: string]: string };
        [key: string]: { [key: string]: string };
    };
    manufacturer: Array<Manufacturer<'Tempering Valve' | 'TMV'>>;
}

export interface FluidsSpec {
    name: string;
    densityKGM3: string;
    dynamicViscosityByTemperature: { [key: string]: string };
    specificHeatByTemperatureKJ_KGK: { [key: string]: string };
}
