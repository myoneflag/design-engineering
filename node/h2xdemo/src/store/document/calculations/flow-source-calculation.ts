import {FieldCategory, MessageField} from '@/store/document/calculations/message-field';
import {PsdCalculation} from '@/store/document/calculations/types';

export default interface FlowSourceCalculation extends PsdCalculation {
    pressureKPA: number | null;
    flowRateLS: number | null;
}

export function makeFlowSourceCalculationFields(): MessageField[] {
    return [
        {property: 'pressureKPA', title: 'Pressure (kPa)', category: FieldCategory.Pressure},
        {property: 'flowRateLS', title: 'Flow rate (L/s)', category: FieldCategory.FlowRate},
        {property: 'loadingUnits', title: 'Loading Units', category: FieldCategory.LoadingUnits},
    ];
}

export function emptyFlowSourceCalculation(): FlowSourceCalculation {
    return {
        flowRateLS: null, loadingUnits: null, pressureKPA: null,
    };
}
