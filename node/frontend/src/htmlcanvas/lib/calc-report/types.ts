import { PressureOrDrainage } from "../../../../src/store/document/types";
import { BackflowValveSize, PipeSpec, PRVSize } from "../../../../../common/src/api/catalog/types";
import { GeneralInfo } from "../../../../../common/src/api/document/drawing";

/* Word report */
export interface ReportGeneralInfo extends GeneralInfo {
    reportDate: string;
    organizationName: string;
    levelCountTxt: string;
}

export interface ReportContent {
    dsn: number;
    dpn: number;
    psn: number;
    appA: number;
    appB: number;
    appC: number;
    appD: number;
    appE: number;
    appF: number;
}

export interface ReportUnits {
    "L/s": string;
    'mm': string;
    'kPa': string;
}

export interface DesignSummaryReport {
    hasWaterService: boolean;
    waterCalcMethod: string;
    waterLossMethod: string;

    hasGasService: boolean;

    hasWastewaterService: boolean;
    wastewaterCalcMethod: string;
}

export interface PressureFSParameterReport {
    hexFS: string;
    temperatureFS?: string;
    nameFS: string;
    // Styling module
    nameStyle: {
        cellBackground: string;
        textColor: string;
    }

    isHotwater?: boolean;
    isNotGasFS?: boolean;
    isGasFS?: boolean;
    gasTypeFS?: string;

    riserVelocityMS: string;
    reticulationVelocityMS: string;
    connectionsVelocityMS?: string;
    returnVelocityMS?: string;

    riserMaterial: string;
    reticulationMaterial: string;
    connectionsMaterial?: string;

    riserMinimumPipeSize: string;
    reticulationMinimumPipeSize: string;
    connectionsMinimumPipeSize?: string;

    riserSpareCapacityPCT: string;
    reticulationSpareCapacityPCT: string;
    connectionsSpareCapacityPCT?: string;

    insulationMaterial?: string;
    insulationThicknessMM?: string;
}

export interface DrainageFSParameterReport {
    hexFS: string;
    nameFS: string;
    // Styling module
    nameStyle: {
        cellBackground: string;
        textColor: string;
    }
    stacksMaterial: string;
    pipesMaterial: string;
    ventsMaterial: string;
    horizontalPipeSizing: {
        gradePCT: string;
        maxUnits: number;
        minUnits: number;
        sizeMM: string;
    }[];
    ventSizing: {
        maxUnits: number;
        minUnits: number;
        sizeMM: string;
    }[];
    stackPipeSizing: {
        maxUnits: number;
        maximumUnitsPerLevel: number;
        minUnits: number;
        sizeMM: string;
    }[];
    stackVentPipeSizing: {
        maxUnits: number;
        minUnits: number;
        sizeMM: string;
    }[];
    maxUnventedLengthM: {
        minLength: string;
        sizeMM: string;
    }[];
}

export interface DesignParameterReport {
    pressureFlowSystems: PressureFSParameterReport[];
    drainageFlowSystems: DrainageFSParameterReport[];
}

export type ProductSelectionReportKey =
    'backflowValves' |
    'balancingValves' |
    'greaseInterceptorTrap' |
    'circulatingPumps' |
    'hotWaterPlant' |
    'mixingValves' |
    'pipes' |
    'prv' |
    'floorWaste' |
    'inspectionOpening';

export interface ProductTechnicalKey {
    techKey: string;
}

export interface MixingValveTechnicalData {
    pressureLoss: string;
}

export interface HotWaterPlantTechnicalData {
}

export type ProductTechnicalData =
    PipeSpec |
    MixingValveTechnicalData |
    PRVSize |
    BackflowValveSize |
    HotWaterPlantTechnicalData;

export type ProductTechnicalReport =
    ProductTechnicalKey & ProductTechnicalData;

export interface ProductReport {
    productName: string;
    manufacturer: string;
    contact: string;
    technicalData: ProductTechnicalReport[];
    isSewer?: boolean;
    isNotSewer?: boolean;
}

export type ProductSelectionReport = {
    [key in ProductSelectionReportKey]: ProductReport[];
}

/* Excel report */
export interface ReferenceFlowSystem {
    'Reference': string;
    flowSystemUid: string | null;
}

export interface WaterFlowSourceCalcReport extends ReferenceFlowSystem {
    'Residual Pressure': string;
    'Static Pressure': string;
    'Height': string;
}

export interface GasFlowSourceCalcReport extends ReferenceFlowSystem {
    'Pressure': string;
    'Height': string;
}

export interface DrainageFlowSourceCalcReport extends ReferenceFlowSystem {
}

export interface WaterPipeCalcReport extends ReferenceFlowSystem {
    'Loading Units': string;
    'Continuous Flow Rates': string;
    'Peak Flow Rate': string;
    'Nominal Diameter': string;
    'Internal Diameter': string;
    'Material': string;
    'Velocity': string;
    'Colebrook White Coefficient': string;
    'Pressure Drop': string;
    'Length': string;
    'Heat Loss Flow Rate': string;
}

export interface GasPipeCalcReport extends ReferenceFlowSystem {
    'Peak Flow Rate': string;
    'Nominal Diameter': string;
    'Internal Diameter': string;
    'Material': string;
    'Velocity': string;
    'Length': string;
}

export interface DrainagePipeCalcReport extends ReferenceFlowSystem {
    'Fixture Units': string;
    'Nominal Diameter': string;
    'Material': string;
    'Length': string;
    'Grade': string;
    'Fall': string;
}

export interface PlantCalcReport extends ReferenceFlowSystem {
    'Type': string;
    'Model': string;
    'Inlet Pressure': string;
    'Outlet Pressure': string;
    'Dimensions': string;
}

export interface WaterValveCalcReport extends ReferenceFlowSystem {
    'Name': string;
    'Size': string;
    'kV Value': string;
    'Flow Rate': string;
    'Pressure Drop': string;
}

export interface GasValveCalcReport extends ReferenceFlowSystem {
    'Name': string;
    'Flow Rate': string;
}

export interface DrainageValveCalcReport extends ReferenceFlowSystem {
    'Name': string;
    'Size': string;
    'Fixture Units': string;
}

export interface WaterFittingCalcReport extends ReferenceFlowSystem {
    'Name': string;
    'Size': string;
    'kV Value': string;
    'Flow Rate': string;
    'Pressure Drop Including Height Change': string;
}

export interface GasFittingCalcReport extends ReferenceFlowSystem {
    'Name': string;
    'Size': string;
    'Flow Rate': string;
}

export interface DrainageFittingCalcReport extends ReferenceFlowSystem {
    'Name': string;
    'Size': string;
    'Fixture Units': string;
}

export interface WaterFixtureNodeCalcReport extends ReferenceFlowSystem {
    'Name': string;
    'Loading Units': string;
    'Continuous Flow Rates': string;
    'Residual Pressure': string;
    'Static Pressure': string;
    'Dead Leg Volume': string;
    'Dead Leg Length': string;
}

export interface GasOutletCalcReport extends ReferenceFlowSystem {
    'Name': string;
    'Inlet Pressure': string;
    'Flow Rates': string;
}

export interface DrainageFixtureNodeCalcReport extends ReferenceFlowSystem {
    'Name': string;
    'Fixture Units': string;
}

export interface DrainagePitCalcReport extends ReferenceFlowSystem {
    'Name': string;
    'Size': string;
    'Model': string;
}

export type WaterEntityReportKey =
    'Flow Sources' |
    'Pipes' |
    'Plants' |
    'Valves' |
    'Fittings' |
    'FixturesNodes';

export type GasEntityReportKey =
    'Flow Sources' |
    'Pipes' |
    'Valves' |
    'Fittings' |
    'Outlets';

export type DrainageEntityReportKey =
    'Flow Sources' |
    'Pipes' |
    'Valves' |
    'Fittings' |
    'FixturesNodes' |
    'Pits';

export type WaterEntityCalcReport =
    WaterFlowSourceCalcReport |
    WaterPipeCalcReport |
    PlantCalcReport |
    WaterValveCalcReport |
    WaterFittingCalcReport |
    WaterFixtureNodeCalcReport;

export type GasEntityCalcReport =
    GasFlowSourceCalcReport |
    GasPipeCalcReport |
    GasValveCalcReport |
    GasFittingCalcReport |
    GasOutletCalcReport;

export type DrainageEntityCalcReport =
    DrainageFlowSourceCalcReport |
    DrainagePipeCalcReport |
    DrainageValveCalcReport |
    DrainageFittingCalcReport |
    DrainageFixtureNodeCalcReport |
    DrainagePitCalcReport;

export type WaterCalculationReport = {
    [key in WaterEntityReportKey]: {
        [key: string]: WaterEntityCalcReport[];
    }
}

export type GasCalculationReport = {
    [key in GasEntityReportKey]: {
        [key: string]: GasEntityCalcReport[];
    }
}

export type DrainageCalculationReport = {
    [key in DrainageEntityReportKey]: {
        [key: string]: DrainageEntityCalcReport[];
    }
}

export type EntityCalcReport =
    WaterEntityCalcReport |
    GasEntityCalcReport |
    DrainageEntityCalcReport;

export enum DesignCalculationKey {
    WATER = 'Water',
    GAS = 'Gas',
    DRAINAGE = 'Drainage',
}

export interface DesignCalculationReport {
    [DesignCalculationKey.WATER]: WaterCalculationReport;
    [DesignCalculationKey.GAS]: GasCalculationReport;
    [DesignCalculationKey.DRAINAGE]: DrainageCalculationReport;
}

export type FluidCalculationReport =
    WaterCalculationReport |
    GasCalculationReport |
    DrainageCalculationReport;

export const initDesignCalculationReport: DesignCalculationReport = {
    [DesignCalculationKey.WATER]: {
        'Flow Sources': {},
        'Pipes': {},
        'Plants': {},
        'Valves': {},
        'Fittings': {},
        'FixturesNodes': {},
    },
    [DesignCalculationKey.GAS]: {
        'Flow Sources': {},
        'Pipes': {},
        'Valves': {},
        'Fittings': {},
        'Outlets': {},
    },
    [DesignCalculationKey.DRAINAGE]: {
        'Flow Sources': {},
        'Pipes': {},
        'Valves': {},
        'Fittings': {},
        'FixturesNodes': {},
        'Pits': {},
    },
};

/* PDF Appendix */
export interface ReferenceDrawing {
    reference: string;
    pressureOrDrainage: PressureOrDrainage;
}

/* Contacts */
export const contacts: { [key: string]: string } = {
    Kembla: 'Ali Rad - ali.rad@kembla.com.au',
    'Ke Kelit': 'Adam Lett - adam@kekelit.co.nz',
    REHAU: 'Nick Lucivero - nick.lucivero@rehau.com',
    Blucher: 'Matt Carman - mca@blucher.com',
    Caleffi: 'Dan Dillenback - daniel@allvalve.com.au',
    Cimberio: 'Dan Dillenback - daniel@allvalve.com.au',
    Apollo: 'Dan Dillenback - daniel@allvalve.com.au',
    Enware: 'Jordi Skelton - jordi.skelton@enware.com.au',
    Galvin: 'Clive Berrell - clive@galvinengineering.com.au',
    Grundfos: 'Daryl Vernon - daryl.vernon@rheem.com.au',
    Rheem: 'Daryl Vernon - daryl.vernon@rheem.com.au',
    Viking: 'Joe Ziino - sales4@vikingplastics.com.au',
    Rehau: 'Nick Lucivero - nick.lucivero@rehau.com',
};
