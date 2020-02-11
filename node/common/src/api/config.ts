import { Catalog } from "./catalog/types";
import { Choice, cloneSimple } from "../lib/utils";

export enum SupportedPsdStandards {
    as35002018LoadingUnits = "as35002018LoadingUnits",
    barriesBookLoadingUnits = "barriesBookLoadingUnits",

    din1988300Residential = "din1988300Residential",
    din1988300Hospital = "din1988300Hospital",
    din1988300Hotel = "din1988300Hotel",
    din1988300School = "din1988300School",
    din1988300Office = "din1988300Office",
    din1988300AssistedLiving = "din1988300AssistedLiving",
    din1988300NursingHome = "din1988300NursingHome"
}

export function isSupportedPsdStandard(arg: any): arg is SupportedPsdStandards {
    return Object.values(SupportedPsdStandards).includes(arg);
}

export function assertUnreachable(x: never, shouldThrow: boolean = true) {
    if (shouldThrow) {
        throw new Error("Didn't expect to get here. Object is: " + JSON.stringify(x));
    }
}

export function isGermanStandard(psd: SupportedPsdStandards) {
    switch (psd) {
        case SupportedPsdStandards.as35002018LoadingUnits:
        case SupportedPsdStandards.barriesBookLoadingUnits:
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

//
export const DISPLAY_PSD_METHODS: Choice[] = [
    { name: "AS3500 2018 Loading Units", key: SupportedPsdStandards.as35002018LoadingUnits },
    { name: "Barrie's Book Loading Units", key: SupportedPsdStandards.barriesBookLoadingUnits },
    { name: "DIN 1988-300 - Residential", key: SupportedPsdStandards.din1988300Residential },
    { name: "DIN 1988-300 - Hospital", key: SupportedPsdStandards.din1988300Hospital },
    { name: "DIN 1988-300 - Hotel", key: SupportedPsdStandards.din1988300Hotel },
    { name: "DIN 1988-300 - School", key: SupportedPsdStandards.din1988300School },
    { name: "DIN 1988-300 - Office", key: SupportedPsdStandards.din1988300Office },
    { name: "DIN 1988-300 - Assisted Living", key: SupportedPsdStandards.din1988300AssistedLiving },
    { name: "DIN 1988-300 - Nursing Home", key: SupportedPsdStandards.din1988300NursingHome },
    { name: "BS 806", disabled: true, key: "BS806" },
    { name: "CIBSE Guide G", disabled: true, key: "CIBSEGuideG" },
    { name: "Uniform Plumbing Code 2018", disabled: true, key: "UnifromPlumbingCode2018" },
    { name: "International Plumbing Code 2018", disabled: true, key: "InternationalPlumbingCode2018" }
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

export enum SupportedDwellingStandards {
    as35002018Dwellings = "as35002018Dwellings",
    barriesBookDwellings = "barriesBookDwellings"
}


export enum RingMainCalculationMethod {
    PSD_FLOW_RATE_DISTRIBUTED = 'PSD_FLOW_RATE_DISTRIBUTED',
    ISOLATION_CASES = 'ISOLATION_CASES',
    MAX_DISTRIBUTED_AND_ISOLATION_CASES = 'MAX_DISTRIBUTED_AND_ISOLATION_CASES',
}

export const RING_MAIN_CALCULATION_METHODS: Choice[] = [
    { name: "Isolation Cases by Closing any Isolation Valve", disabled: false, key: RingMainCalculationMethod.ISOLATION_CASES },
    { name: "PSD Flow rate distributed according to Loading/Dwelling Units", disabled: true, key:  RingMainCalculationMethod.PSD_FLOW_RATE_DISTRIBUTED},

    { name: "Max. of Distributed PSD or Isolation Method", disabled: true, key: RingMainCalculationMethod.MAX_DISTRIBUTED_AND_ISOLATION_CASES },
    { name: "99th percentile computer simulated PSD", disabled: true, key: "monteCarlo" }
];
export const PIPE_SIZING_METHODS: Choice[] = [
    { name: "Keep maximum velocity within bounds", key: "velocity" },
    { name: "Keep maximum pressure drop within bounds", key: "pressure", disabled: true }
];

export enum ComponentPressureLossMethod {
    INDIVIDUALLY = "INDIVIDUALLY",
    PERCENT_ON_TOP_OF_PIPE = "PERCENT_ON_TOP_OF_PIPE",
}

export const COMPONENT_PRESSURE_LOSS_METHODS: Choice[] = [
    { name: "Based on all system component's specific pressure loss", key: ComponentPressureLossMethod.INDIVIDUALLY },
    { name: "Percentage on top of pipe lengths only", key: ComponentPressureLossMethod.PERCENT_ON_TOP_OF_PIPE },
];

export const LEVEL_HEIGHT_DIFF_M = 3;
