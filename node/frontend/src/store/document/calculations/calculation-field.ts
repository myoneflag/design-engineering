import { FlowSystemParameters, UnitsParameters } from "../../../../../common/src/api/document/drawing";

export enum FieldCategory {
    Pressure,
    Velocity,
    FlowRate,
    Size,
    Temperature,
    LoadingUnits,
    FixtureUnits,
    Height,
    HeatLoss,
    Volume,
    Length,
}

export enum Units {
    None = "",

    // Metric
    LitersPerSecond = "L/s",
    Millimeters = "mm",
    Meters = "m",
    KiloPascals = "kPa",
    MetersPerSecond = "m/s",
    MetersPerSecondSquared = "m/s\u0178",
    Celsius = "\u00B0C",
    KiloWatts = 'kW',
    Kv = 'Kv',
    Liters = 'L',

    // Imperial equivalents where applicable
    GallonsPerMinute = "gal/min",
    USGallonsPerMinute = "US gal/min", // wtf usa
    Inches = 'in',
    Feet = 'ft',
    FeetPerSecondSquared = "ftt/s\u0178",
    Psi = 'psi',
    FeetPerSecond = 'ft/s',
    Fahrenheit = '\u00B0F',
    // keep it at kilowatts
    // Kv is unitless
    Gallons = 'gal',
    USGallons = 'US gal', // wtf usa
}

export interface CalculationField {
    property: string;
    title: string;
    short: string;
    units: Units;
    category: FieldCategory;
    defaultEnabled?: boolean;
    significantDigits?: number;
    fontMultiplier?: number;
    hideUnits?: boolean;
    attachUid?: string;
    systemUid?: string;
    bold?: boolean;
    format?: (v: any) => string;
    hideIfNull?: boolean;
    convert?: (unitPrefs: UnitsParameters, units: Units, value: number | null) => [Units, number | string | null];
}

export enum CalculationDataType {
    VALUE,
    MESSAGE
}

export interface CalculationFieldWithValue extends CalculationField {
    type: CalculationDataType.VALUE;
    attachUid: string;
    value: number | null;
}

export interface CalculationMessage {
    type: CalculationDataType.MESSAGE;
    attachUid: string;
    message: string;
    systemUid?: string;
}

export type CalculationData = CalculationMessage | CalculationFieldWithValue;
