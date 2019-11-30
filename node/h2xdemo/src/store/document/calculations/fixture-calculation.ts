import {FieldCategory, CalculationField, Units} from '@/store/document/calculations/calculation-field';
import {StandardFlowSystemUids} from '@/store/catalog';

export default interface FixtureCalculation {
    coldPressureKPA: number | null;
    warmPressureKPA: number | null;
}

export function makeFixtureCalculationFields(): CalculationField[] {
    return [
        {property: 'coldPressureKPA',
            title: 'Cold water pressure',
            short: 'cold',
            systemUid: StandardFlowSystemUids.ColdWater,
            units: Units.KiloPascals,
            category: FieldCategory.Pressure,
            defaultEnabled: true,
        },
        {property: 'warmPressureKPA',
            title: 'Warm water pressure',
            short: 'warm',
            systemUid: StandardFlowSystemUids.WarmWater,
            units: Units.KiloPascals,
            category: FieldCategory.Pressure,
            defaultEnabled: true,
        },
    ];
}

export function emptyFixtureCalculation(): FixtureCalculation {
    return {
        coldPressureKPA: null, warmPressureKPA: null,
    };
}
