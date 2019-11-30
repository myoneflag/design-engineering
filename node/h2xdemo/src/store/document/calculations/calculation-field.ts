import {FlowSystemParameters} from '@/store/document/types';

export enum FieldCategory {
    Pressure,
    Velocity,
    FlowRate,
    Size,
    Temperature,
    LoadingUnits,
    FixtureUnits,
}

export enum Units {
    None = '',
    LitersPerSecond = 'L/s',
    Millimeters = 'mm',
    KiloPascals = 'kPa',
    MetersPerSecond = 'm/s',
    Celsius = '\u00B0C',
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
}

export interface CalculationData extends CalculationField {
    attachUid: string;
    value: number | null;
}
