import { DwellingStandardType } from "./psd-standard/types";
import LoadingUnitTable from "./psd-standard/loading-unit-table";
import LoadingUnitHotColdTable from "./psd-standard/loading-unit-hot-cold-table";
import PsdEquation from "./psd-standard/psdEquation";
import LoadingUnitMaxTable from "./psd-standard/loading-unit-max-table";
import {EN12056FrequencyFactor, SupportedPsdStandards } from "../config";
import {FixturesTable, PipesTable} from "./price-table";

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

export type BackflowValveManufacturer = Manufacturer<'RPZD'>;

export interface BackflowValveSpec {
    name: string;
    uid: string;
    abbreviation: string;
    manufacturer: BackflowValveManufacturer[];
    valvesBySize: { [key: string]: { [key: string]: BackflowValveSize } };
}

export type GreaseInterceptorTrapManufacturer = Manufacturer<'Generic' | 'Viking'>;

export enum GreaseInterceptorTrapLocationCategory {
    'belowGround' = 'Below Ground',
    'aboveGround' = 'Above Ground',
}

export interface GreaseInterceptorTrap {
    manufacturer: GreaseInterceptorTrapManufacturer[];
    location: any[];
    size: {
        [key: string]: {
            [key: string]: {
                [key in keyof typeof GreaseInterceptorTrapLocationCategory | string]: {
                    [key: string]: {
                        [key: string]: any;
                        capacity: number;
                        lengthMM: number;
                        widthMM: number;
                        heightMM: number;
                        product?: string;
                    }
                }
            }
        }
    },
}



export interface Catalog {
    fixtures: { [key: string]: FixtureSpec };
    pipes: { [key: string]: PipeMaterial };
    valves: { [key: string]: ValveSpec };
    mixingValves: { [key: string]: MixingValveSpec };
    backflowValves: { [key: string]: BackflowValveSpec };
    psdStandards: { [key: string]: PSDSpec };
    dwellingStandards: { [key: string]: DwellingSpec };
    en12056FrequencyFactor: { [key in EN12056FrequencyFactor]: number};
    gasDiversification: DwellingDiversificationTable;
    fluids: { [key: string]: FluidsSpec };
    prv: PRVSpec;
    balancingValves: BalancingValveSpec;
    hotWaterPlant: HotWaterPlant;
    greaseInterceptorTrap?: GreaseInterceptorTrap;
}

export type DwellingDiversificationTable = {[key: number]: number};

export type BalancingValveManufacturer = Manufacturer<'Balancing Valve'>;

export interface BalancingValveSpec {
    manufacturer: BalancingValveManufacturer[];
}

export type HotWaterPlantManufacturer = Manufacturer<'Hot Water Plant'>;

export interface HotWaterPlant {
    manufacturer: HotWaterPlantManufacturer[];
    grundfosPressureDrop: { 
        [key: string]: { 
            [key: string]: string
        }
    };
}
export type PRVManufacturer = Manufacturer<'PRV'>;

export interface PRVSpec {
    manufacturer: PRVManufacturer[];
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
    continuousFlowLS?: ContinuousFlowRateSpec;
    roughIns: string[];



    maxInletPressureKPA: string | null;
    minInletPressureKPA: string | null;
    probabilityOfUsagePCT: string | null;

    // Drainage
    asnzFixtureUnits: string | null;
    enDischargeUnits: string | null;
    upcFixtureUnits: string | null;

    outletAboveFloorM: string | null;

    warmTempC: string | null;

    manufacturer: FixtureManufacturer[]
}

export type FixtureManufacturer = Manufacturer<keyof FixturesTable>;

export interface LoadingUnit {
    [key: string]: string | null;
}

export interface ContinuousFlowRateSpec {
    [key: string]: string | null;
}

export interface FlowRateSpec {
    [key: string]: {
        [key: string]: { [key: string]: string }
    };
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

export type PipeManufacturer = Manufacturer<keyof PipesTable>;

export interface PipeMaterial {
    name: string;
    uid: string;
    abbreviation: string;
    manufacturer: PipeManufacturer[];
    pipesBySize: { [key: string]: { [key: string]: PipeSpec } };
}

export interface Manufacturer<ManufacturerEntryNames> {
    name: string;
    abbreviation: string;
    priceTableName: ManufacturerEntryNames;
    uid: string;
    option?: string[]
}

export interface PipeSpec {
    pipeUid: string;
    diameterNominalMM: Diameter | null;
    diameterInternalMM: Diameter | null;
    diameterOutsideMM: Diameter | null;
    colebrookWhiteCoefficient: string | null;
    safeWorkingPressureKPA: string | null;
}

export type MixingValveManufacturer = Manufacturer<'Tempering Valve' | 'TMV'>;

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
    manufacturer: MixingValveManufacturer[];
}

export enum State {
    GAS = 'gas',
    LIQUID = 'liquid',
}

export interface FluidsSpec {
    name: string;
    densityKGM3: string;
    state: State;
    dynamicViscosityByTemperature: { [key: string]: string };
    specificHeatByTemperatureKJ_KGK: { [key: string]: string };
}
