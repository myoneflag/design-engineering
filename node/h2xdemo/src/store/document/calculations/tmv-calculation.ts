import {FieldCategory, MessageField} from '@/store/document/calculations/message-field';
import {PsdCalculation} from '@/store/document/calculations/types';

export default interface TmvCalculation {
    coldPressureKPA: number | null;
    hotPressureKPA: number | null;
    coldTemperatureC: number | null;
    hotTemperatureC: number | null;

    outputTemperatureC: number | null;
    outputPressureKPA: number | null;
    outputFlowRateLS: number | null;
}


export function makeTmvCalculationFields(): MessageField[] {
    return [
        {property: 'coldPressureKPA', title: 'Cold Rough-In Pressure (kPa)', category: FieldCategory.Pressure},
        {property: 'hotPressureKPA', title: 'Hot Rough-In Pressure (kPa)', category: FieldCategory.Pressure},
        {property: 'coldTemperatureC', title: 'Cold Rough-In Temperature (C)', category: FieldCategory.Temperature},
        {property: 'hotTemperatureC', title: 'Hot Rough-In Temperature (C)', category: FieldCategory.Temperature},


        {property: 'outputTemperatureC', title: 'Output Temperature (C)', category: FieldCategory.Temperature},
        {property: 'outputPressureKPA', title: 'Output Pressure (kPa)', category: FieldCategory.Pressure},
        {property: 'outputFlowRateLS', title: 'Output Flow Rate (L/s)', category: FieldCategory.FlowRate},
    ];
}

export function emptyTmvCalculation(): TmvCalculation {
    return {
        coldPressureKPA: null,
        coldTemperatureC: null,
        hotPressureKPA: null,
        hotTemperatureC: null,
        outputFlowRateLS: null,
        outputPressureKPA: null,
        outputTemperatureC: null,
    };
}
