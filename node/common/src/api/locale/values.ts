import { SupportedLocales } from "./index";

export enum CurrencySymbol {
    DOLLARS = '$',
    POUNDS = '£'
}

export const I18N = {
    pressureReducingValve: {
        [SupportedLocales.AU]: "Pressure Reducing Valve",
        [SupportedLocales.US]: "Pressure Regulating Device",
        [SupportedLocales.UK]: "Pressure Reducing Valve",
    },

    balancingValve: {
        [SupportedLocales.AU]: "Balancing Valve",
        [SupportedLocales.US]: "Balancing Device",
        [SupportedLocales.UK]: "Balancing Valve",
    },

    loadingUnits: {
        [SupportedLocales.AU]: "Loading Units",
        [SupportedLocales.UK]: "Loading Units",
        [SupportedLocales.US]: "Water Supply Fixture Units",
    },

    loadingUnitMedium: {
        [SupportedLocales.AU]: "Loading Units",
        [SupportedLocales.UK]: "Loading Units",
        [SupportedLocales.US]: "WSFU",
    },

    loadingUnitShort: {
        [SupportedLocales.AU]: "LU",
        [SupportedLocales.UK]: "LU",
        [SupportedLocales.US]: "WSFU",
    },

    currency: {
        [SupportedLocales.AU]: "AUD",
        [SupportedLocales.UK]: "GBP",
        [SupportedLocales.US]: "USD",
    },

    currencySymbol: {
        [SupportedLocales.AU]: CurrencySymbol.DOLLARS,
        [SupportedLocales.UK]: CurrencySymbol.POUNDS,
        [SupportedLocales.US]: CurrencySymbol.DOLLARS,
    },

    floorWaste: {
        [SupportedLocales.AU]: "Floor Waste",
        [SupportedLocales.US]: "Floor Waste",
        [SupportedLocales.UK]: "Floor Waste",
    },

    inspectionOpening: {
        [SupportedLocales.AU]: "Inspection Opening",
        [SupportedLocales.US]: "Inspection Opening",
        [SupportedLocales.UK]: "Inspection Opening",
    },
}
