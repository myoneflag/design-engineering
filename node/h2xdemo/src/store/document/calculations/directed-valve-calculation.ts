import {FieldCategory, MessageField} from '@/store/document/calculations/message-field';
import {PsdCalculation} from '@/store/document/calculations/types';

export default interface DirectedValveCalculation {
    flowRateLS: number | null;
    pressureDropKPA: number | null;
    pressureKPA: number | null;
}

export function makeDirectedValveCalculationFields(): MessageField[] {
    return [
        {property: 'flowRateLS', title: 'Flow Rate (L/s)', category: FieldCategory.FlowRate},
        {property: 'pressureDropKPA', title: 'Pressure Drop (kPa)', category: FieldCategory.Pressure},
        {property: 'pressureKPA', title: 'Pressure (kPa)', category: FieldCategory.Pressure},
    ];
}

export function emptyDirectedValveCalculation(): DirectedValveCalculation {
    return {
        flowRateLS: null,
        pressureDropKPA: null,
        pressureKPA: null,
    };
}
