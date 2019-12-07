import {FieldCategory, CalculationField, Units} from '../../../../src/store/document/calculations/calculation-field';
import {StandardFlowSystemUids} from '../../../../src/store/catalog';
import {Calculation} from '../../../../src/store/document/calculations/types';

export default interface FixtureCalculation extends Calculation {
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
        coldPressureKPA: null, warmPressureKPA: null, warning: null,
    };
}
