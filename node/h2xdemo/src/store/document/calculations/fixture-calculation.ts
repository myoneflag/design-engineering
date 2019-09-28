import {FieldCategory, MessageField} from '@/store/document/calculations/message-field';
import {PsdPointCalculation} from '@/store/document/calculations/types';

export default interface FixtureCalculation {
    coldPressureKPA: number | null;
    warmPressureKPA: number | null;
}

export function makeFixtureCalculationFields(): MessageField[] {
    return [
        {property: 'coldPressureKPA', title: 'Cold water pressure (kPa)', category: FieldCategory.Pressure},
        {property: 'warmPressureKPA', title: 'Warm water pressure (kPa)', category: FieldCategory.Pressure},
    ];
}

export function emptyFixtureCalculation(): FixtureCalculation {
    return {
        coldPressureKPA: null, warmPressureKPA: null,
    };
}
