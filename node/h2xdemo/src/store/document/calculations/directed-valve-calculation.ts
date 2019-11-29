import {FieldCategory, CalculationField, Units} from '@/store/document/calculations/calculation-field';

export default interface DirectedValveCalculation {
    flowRateLS: number | null;
    pressureDropKPA: number | null;
    pressureKPA: number | null;
}

export function makeDirectedValveCalculationFields(): CalculationField[] {
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
            short: 'In',
            units: Units.KiloPascals,
            category: FieldCategory.Pressure,
        },
    ];
}

export function emptyDirectedValveCalculation(): DirectedValveCalculation {
    return {
        flowRateLS: null,
        pressureDropKPA: null,
        pressureKPA: null,
    };
}
