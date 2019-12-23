import {FlowSystemParameters} from '../../../../src/store/document/types';

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
    Meters = 'm',
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
    format?: (v: any) => string;
}

export enum CalculationDataType {
    VALUE,
    MESSAGE,
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
