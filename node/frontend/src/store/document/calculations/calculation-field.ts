import { Color, UnitsParameters } from "../../../../../common/src/api/document/drawing";
import { Units } from "../../../../../common/src/lib/measurements";

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
    Location,
    GreaseInterceptorTrap,
    EntityName,
}

export type CalculationLayout = 'pressure' | 'drainage';

export interface CalculationField {
    property: string;
    title: string;
    shortTitle?: string;
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
    static?: boolean;

    // If missing, assume it is just for ['pressure'].
    layouts?: CalculationLayout[];
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
