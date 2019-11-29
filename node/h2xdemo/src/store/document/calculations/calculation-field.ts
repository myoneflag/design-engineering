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
    attachUid?: string;
    systemUid?: string;
}

export interface CalculationData extends CalculationField {
    property: string;
    title: string;
    short: string;
    units: Units;
    category: FieldCategory;
    attachUid: string;
    value: number | null;
    systemUid?: string;
}
