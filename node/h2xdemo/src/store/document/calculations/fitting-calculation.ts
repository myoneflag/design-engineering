import {FieldCategory, CalculationField, Units} from '@/store/document/calculations/calculation-field';
import {PsdCalculation} from '@/store/document/calculations/types';

export interface DeadlegAttribute {
    numConnections: 1 | null;
}

export interface TwoConnectionAttribute {
    numConnections: 2 | null;
    nominalDiameterAMM: number | null;
    nominalDiameterBMM: number | null;
    angle: number | null;
}

export interface ThreeConnectionAttribute {
    numConnections: 3 | null;
    nominalDiameterMM: number | null;
}

export default interface FittingCalculation {
    flowRateLS: number | null;
    pressureDropKPA: number | null;
    pressureKPA: number | null;

    valveAttributes: DeadlegAttribute | TwoConnectionAttribute | ThreeConnectionAttribute | null;
}

export function makeFittingCalculationFields(): CalculationField[] {
    return [
        {property: 'flowRateLS',
            title: 'Flow Rate',
            short: 'Flow',
            units: Units.LitersPerSecond,
            category: FieldCategory.FlowRate,
        },
        {property: 'pressureDropKPA',
            title: 'Pressure Drop',
            short: 'Drop',
            units: Units.KiloPascals,
            category: FieldCategory.Pressure,
        },
        {property: 'pressureKPA',
            title: 'Pressure',
            short: '',
            units: Units.KiloPascals,
            category: FieldCategory.Pressure,
            defaultEnabled: true,
        },
    ];
}

export function emptyFittingCalculation(): FittingCalculation {
    return {
        flowRateLS: null,
        pressureDropKPA: null,
        pressureKPA: null,
        valveAttributes: null,
    };
}
