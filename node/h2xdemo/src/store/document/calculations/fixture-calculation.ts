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
            short: '',
            systemUid: StandardFlowSystemUids.ColdWater,
            units: Units.KiloPascals,
            category: FieldCategory.Pressure,
        },
        {property: 'warmPressureKPA',
            title: 'Warm water pressure',
            short: '',
            systemUid: StandardFlowSystemUids.HotWater,
            units: Units.KiloPascals,
            category: FieldCategory.Pressure,
        },
    ];
}

export function emptyFixtureCalculation(): FixtureCalculation {
    return {
        coldPressureKPA: null, warmPressureKPA: null,
    };
}
