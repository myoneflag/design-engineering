import {Catalog, State} from "./catalog/types";
import {Choice, cloneSimple, SelectField} from "../lib/utils";
import {THERMAL_CONDUCTIVITY} from "./constants/air-properties";
import {evaluatePolynomial} from "../lib/polynomials";

export enum SupportedPsdStandards {
    as35002018LoadingUnits = "as35002018LoadingUnits",
    barriesBookLoadingUnits = "barriesBookLoadingUnits",

    ipc2018FlushTanks = 'ipc2018FlushTanks',
    ipc2018Flushometer = 'ipc2018Flushometer',
    cibseGuideG = 'cibseGuideG',
    upc2018FlushTanks = 'upc2018FlushTanks',
    upc2018Flushometer = 'upc2018Flushometer',
    bs806 = 'bs806',

    din1988300Residential = "din1988300Residential",
    din1988300Hospital = "din1988300Hospital",
    din1988300Hotel = "din1988300Hotel",
    din1988300School = "din1988300School",
    din1988300Office = "din1988300Office",
    din1988300AssistedLiving = "din1988300AssistedLiving",
    din1988300NursingHome = "din1988300NursingHome"
}

export type SupportedLUPsdStandards =
    SupportedPsdStandards.as35002018LoadingUnits |
    SupportedPsdStandards.barriesBookLoadingUnits |

    SupportedPsdStandards.ipc2018FlushTanks |
    SupportedPsdStandards.ipc2018Flushometer |
    SupportedPsdStandards.cibseGuideG |
    SupportedPsdStandards.upc2018FlushTanks |
    SupportedPsdStandards.upc2018Flushometer |
    SupportedPsdStandards.bs806;

export type SupportedEquationPSDStandards =
    SupportedPsdStandards.din1988300Residential |
    SupportedPsdStandards.din1988300Hospital |
    SupportedPsdStandards.din1988300Hotel |
    SupportedPsdStandards.din1988300School |
    SupportedPsdStandards.din1988300Office |
    SupportedPsdStandards.din1988300AssistedLiving |
    SupportedPsdStandards.din1988300NursingHome;

export enum SupportedDrainageMethods {
    AS2018FixtureUnits = 'AS2018FixtureUnits',
    EN1205622000DischargeUnits = 'EN1205622000DischargeUnits',
    UPC2018DrainageFixtureUnits = 'UPC2018DrainageFixtureUnits',
}

export const DRAINAGE_METHOD_CHOICES: Choice[] = [
    {
        name: "AS/NZS3500.2:2018 Fixture Unit",
        key: SupportedDrainageMethods.AS2018FixtureUnits
    },
    {
        name: "EN 12056-2:2000 Discharge Unit",
        key: SupportedDrainageMethods.EN1205622000DischargeUnits
    },
    {
        name: "2018 UPC Drainage Fixture Unit",
        key: SupportedDrainageMethods.UPC2018DrainageFixtureUnits
    },
];

export enum EN12056FrequencyFactor {
    IntermittentUse = "IntermittentUse",
    FrequentUse = "FrequentUse",
    CongestedUse = "CongestedUse",
    SpecialUse = "SpecialUse",
}

export function getEN_12506_FREQUENCY_FACTOR_CHOICES(catalog: Catalog): Choice[] {
    return [
        {
            name: `Intermittent Use (${catalog.en12056FrequencyFactor.IntermittentUse})`,
            key: EN12056FrequencyFactor.IntermittentUse,
        },
        {
            name: `Frequent Use (${catalog.en12056FrequencyFactor.FrequentUse})`,
            key: EN12056FrequencyFactor.FrequentUse,
        },
        {
            name: `Congested Use (${catalog.en12056FrequencyFactor.CongestedUse})`,
            key: EN12056FrequencyFactor.CongestedUse,
        },
        {
            name: `Special Use (${catalog.en12056FrequencyFactor.SpecialUse})`,
            key: EN12056FrequencyFactor.SpecialUse,
        },
    ];
}

export function isSupportedPsdStandard(arg: any): arg is SupportedPsdStandards {
    return Object.values(SupportedPsdStandards).includes(arg);
}

export function assertUnreachable(x: never, shouldThrow: boolean = true) {
    if (shouldThrow) {
        throw new Error("Didn't expect to get here. Object is: " + JSON.stringify(x));
    }
}

export function isGermanStandard(psd: SupportedPsdStandards): psd is SupportedEquationPSDStandards {
    switch (psd) {
        case SupportedPsdStandards.as35002018LoadingUnits:
        case SupportedPsdStandards.barriesBookLoadingUnits:
        case SupportedPsdStandards.bs806:
        case SupportedPsdStandards.cibseGuideG:
        case SupportedPsdStandards.ipc2018Flushometer:
        case SupportedPsdStandards.ipc2018FlushTanks:
        case SupportedPsdStandards.upc2018Flushometer:
        case SupportedPsdStandards.upc2018FlushTanks:
            return false;
        case SupportedPsdStandards.din1988300Residential:
        case SupportedPsdStandards.din1988300Hospital:
        case SupportedPsdStandards.din1988300Hotel:
        case SupportedPsdStandards.din1988300School:
        case SupportedPsdStandards.din1988300Office:
        case SupportedPsdStandards.din1988300AssistedLiving:
        case SupportedPsdStandards.din1988300NursingHome:
            return true;
    }
    assertUnreachable(psd, false);
    return false;
}

export function isLUStandard(psd: SupportedPsdStandards): psd is SupportedLUPsdStandards {
    switch (psd) {
        case SupportedPsdStandards.as35002018LoadingUnits:
        case SupportedPsdStandards.barriesBookLoadingUnits:
        case SupportedPsdStandards.bs806:
        case SupportedPsdStandards.cibseGuideG:
        case SupportedPsdStandards.ipc2018Flushometer:
        case SupportedPsdStandards.ipc2018FlushTanks:
        case SupportedPsdStandards.upc2018Flushometer:
        case SupportedPsdStandards.upc2018FlushTanks:
            return true;
        case SupportedPsdStandards.din1988300Residential:
        case SupportedPsdStandards.din1988300Hospital:
        case SupportedPsdStandards.din1988300Hotel:
        case SupportedPsdStandards.din1988300School:
        case SupportedPsdStandards.din1988300Office:
        case SupportedPsdStandards.din1988300AssistedLiving:
        case SupportedPsdStandards.din1988300NursingHome:
            return false;
    }
    assertUnreachable(psd, false);
    return false;
}

export function isGas(fluidId: string, catalog: Catalog) {
    const fluid = catalog.fluids[fluidId];
    return fluid.state === State.GAS;
}

export function isDrainage(systemUid: string): systemUid is DrainageSystemUid {
    switch (systemUid as StandardFlowSystemUids) {
        case StandardFlowSystemUids.SanitaryPlumbing:
        case StandardFlowSystemUids.SewerDrainage:
        case StandardFlowSystemUids.RisingMain:
        case StandardFlowSystemUids.TradeWaste:
        case StandardFlowSystemUids.GreaseWaste:
            return true;
    }
    return false;
}

//
export const DISPLAY_PSD_METHODS: Choice[] = [
    {
        name: "AS3500 2018 Loading Units",
        key: SupportedPsdStandards.as35002018LoadingUnits
    },
    {
        name: "Barrie's Book Loading Units",
        key: SupportedPsdStandards.barriesBookLoadingUnits
    },
    { name: "CIBSE Guide G", key: SupportedPsdStandards.cibseGuideG },
    { name: "BS 806", key: SupportedPsdStandards.bs806 },

    {
        name: "DIN 1988-300 - Residential",
        key: SupportedPsdStandards.din1988300Residential
    },
    {
        name: "DIN 1988-300 - Hospital",
        key: SupportedPsdStandards.din1988300Hospital
    },
    { name: "DIN 1988-300 - Hotel", key: SupportedPsdStandards.din1988300Hotel },
    {
        name: "DIN 1988-300 - School",
        key: SupportedPsdStandards.din1988300School
    },
    {
        name: "DIN 1988-300 - Office",
        key: SupportedPsdStandards.din1988300Office
    },
    {
        name: "DIN 1988-300 - Assisted Living",
        key: SupportedPsdStandards.din1988300AssistedLiving
    },
    {
        name: "DIN 1988-300 - Nursing Home",
        key: SupportedPsdStandards.din1988300NursingHome
    },

    { name: "International Plumbing Code 2018 Flushometer", key: SupportedPsdStandards.ipc2018Flushometer },
    { name: "International Plumbing Code 2018 Flush Tanks", key: SupportedPsdStandards.ipc2018FlushTanks },

    { name: "Uniform Plumbing Code 2018 Flushometer", key: SupportedPsdStandards.upc2018Flushometer },
    { name: "Uniform Plumbing Code 2018 Flush Tanks", key: SupportedPsdStandards.upc2018FlushTanks },

];

export function getPsdMethods(catalog: Catalog): Choice[] {
    const methods: Choice[] = cloneSimple(DISPLAY_PSD_METHODS);

    for (const key of Object.keys(catalog.psdStandards)) {
        const standard = catalog.psdStandards[key];
        const index = methods.findIndex((p) => p.key === key);
        if (index === -1) {
            methods.push({
                disabled: false,
                key,
                name: standard.name
            });
        } else {
            methods[index].disabled = false;
        }
    }

    return methods;
}


export enum InsulationMaterials {
    calciumSilicate = 'calciumSilicate',
    cellularGlass = 'cellularGlass',
    elastomeric = 'elastomeric',
    fiberglass = 'fiberglass',
    mineralWool = 'mineralWool',
    polyisocyanurate = 'polyisocyanurate',
    mmKemblaInsulation = 'mmKemblaInsulation',
}


export const INSULATION_MATERIAL_CHOICES: Choice[] = [
    { key: InsulationMaterials.calciumSilicate, name: 'Calcium Silicate' },
    { key: InsulationMaterials.cellularGlass, name: 'Cellular Glass' },
    { key: InsulationMaterials.elastomeric, name: 'Elastomeric' },
    { key: InsulationMaterials.fiberglass, name: 'Fiberglass' },
    { key: InsulationMaterials.mineralWool, name: 'Mineral Wool' },
    { key: InsulationMaterials.polyisocyanurate, name: 'Polyisocyanurate' },
    { key: InsulationMaterials.mmKemblaInsulation, name: 'MM Kembla Insulation' },
];

export function getInsulationMaterialChoicesWithThermalConductivity(tempC: number) {
    return INSULATION_MATERIAL_CHOICES.map((c) => {
        return {key: c.key, name: c.name + " (" + evaluatePolynomial(THERMAL_CONDUCTIVITY[c.key as string], tempC + 273.15).toFixed(3) + " W/m.K @ " + tempC.toFixed(3) + " °C)"};
    });
}

export enum InsulationJackets {
    noJacket = 'noJacket',
    pvcJacket = 'pvcJacket',
    allServiceJacket = 'allServiceJacket',
    paintedMetal = 'paintedMetal',
    aluminizedPaint = 'aluminizedPaint',
    stainlessSteelDull = 'stainlessSteelDull',
    galvanizedSteelDippedOrDull = 'galvanizedSteelDippedOrDull',
    stainlessSteelNewCleaned = 'stainlessSteelNewCleaned',
    galvanizedSteelNewBright = 'galvanizedSteelNewBright',
    aluminiumOxidedInService = 'aluminiumOxidedInService',
    aluminiumNewBright = 'aluminiumNewBright',
}

export const INSULATION_JACKET_CHOICES: Choice[] = [
    { key: InsulationJackets.noJacket, name: "No Jacket (0.90 \u03b5)" },
    { key: InsulationJackets.pvcJacket, name: "PVC Jacket (0.90 \u03b5)" },
    { key: InsulationJackets.allServiceJacket, name: "All Service Jacket (0.90 \u03b5)" },
    { key: InsulationJackets.paintedMetal, name: "Painted Metal (0.80 \u03b5)" },
    { key: InsulationJackets.aluminizedPaint, name: "Aluminized Paint (0.50 \u03b5)" },
    { key: InsulationJackets.stainlessSteelDull, name: "Stainless Steel (Dull, 0.30 \u03b5)" },
    { key: InsulationJackets.galvanizedSteelDippedOrDull, name: "Galvanized Steel (Dipped / Dull, 0.28 \u03b5)" },
    { key: InsulationJackets.stainlessSteelNewCleaned, name: "Stainless Steel (New / Cleaned, 0.13 \u03b5)" },
    { key: InsulationJackets.galvanizedSteelNewBright, name: "Galvanized Steel (New / Bright, 0.10 \u03b5)" },
    { key: InsulationJackets.aluminiumOxidedInService, name: "Aluminium Oxide (In Service, 0.10 \u03b5)" },
    { key: InsulationJackets.aluminiumNewBright, name: "Aluminium Oxide (Bright, 0.04 \u03b5)" },
];


export enum SupportedDwellingStandards {
    as35002018Dwellings = "as35002018Dwellings",
    barriesBookDwellings = "barriesBookDwellings"
}

export enum RingMainCalculationMethod {
    PSD_FLOW_RATE_DISTRIBUTED = "PSD_FLOW_RATE_DISTRIBUTED",
    ISOLATION_CASES = "ISOLATION_CASES",
    MAX_DISTRIBUTED_AND_ISOLATION_CASES = "MAX_DISTRIBUTED_AND_ISOLATION_CASES"
}

export const RING_MAIN_CALCULATION_METHODS: Choice[] = [
    {
        name: "Isolation Cases by Closing any Isolation Valve",
        disabled: false,
        key: RingMainCalculationMethod.ISOLATION_CASES
    },
    {
        name: "PSD Flow rate distributed according to Loading/Dwelling Units",
        disabled: true,
        key: RingMainCalculationMethod.PSD_FLOW_RATE_DISTRIBUTED
    },

    {
        name: "Max. of Distributed PSD or Isolation Method",
        disabled: true,
        key: RingMainCalculationMethod.MAX_DISTRIBUTED_AND_ISOLATION_CASES
    },
    {
        name: "99th percentile computer simulated PSD",
        disabled: true,
        key: "monteCarlo"
    }
];
export const PIPE_SIZING_METHODS: Choice[] = [
    { name: "Keep maximum velocity within bounds", key: "velocity" },
    {
        name: "Keep maximum pressure drop within bounds",
        key: "pressure",
        disabled: true
    }
];

export enum ComponentPressureLossMethod {
    INDIVIDUALLY = "INDIVIDUALLY",
    PERCENT_ON_TOP_OF_PIPE = "PERCENT_ON_TOP_OF_PIPE"
}

export const COMPONENT_PRESSURE_LOSS_METHODS: Choice[] = [
    {
        name: "Based on all system component's specific pressure loss",
        key: ComponentPressureLossMethod.INDIVIDUALLY
    },
    {
        name: "Percentage on top of pipe lengths only",
        key: ComponentPressureLossMethod.PERCENT_ON_TOP_OF_PIPE
    }
];

export const LEVEL_HEIGHT_DIFF_M = 3;
export const CURRENT_VERSION = 22;

export enum StandardFlowSystemUids {
    ColdWater = "cold-water",
    HotWater = "hot-water",
    WarmWater = "warm-water",

    Gas = 'gas',
    FireHydrant = "fire-hydrant",
    FireHoseReel = "fire-hose-reel",
    SewerDrainage = 'sewer-drainage',
    SanitaryPlumbing = 'sanitary-plumbing',
    GreaseWaste = 'grease-waste',
    TradeWaste = 'trade-waste',
    RisingMain = 'rising-main',
}

export type DrainageSystemUid =
    StandardFlowSystemUids.SewerDrainage
    | StandardFlowSystemUids.SanitaryPlumbing
    | StandardFlowSystemUids.GreaseWaste
    | StandardFlowSystemUids.TradeWaste
    | StandardFlowSystemUids.RisingMain;

export const ALL_DRAINAGE_SYSTEM_UIDS: DrainageSystemUid[] = [
    StandardFlowSystemUids.SewerDrainage,
    StandardFlowSystemUids.SanitaryPlumbing,
    StandardFlowSystemUids.GreaseWaste,
    StandardFlowSystemUids.TradeWaste,
    StandardFlowSystemUids.RisingMain,
];

export enum StandardMaterialUids {
    Copper = "copperTypeB",
    Pex = "pexSdr74"
}

export const INSULATION_THICKNESS_MMKEMBLA: SelectField[] = [
    { value: 9, text: '9' },
    { value: 13, text: '13' },
    { value: 19, text: '19' },
    { value: 25, text: '25' },
    { value: 32, text: '32' },
    { value: 38, text: '38' },
];
