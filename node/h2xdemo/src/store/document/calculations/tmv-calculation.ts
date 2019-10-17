import {FieldCategory, MessageField} from '@/store/document/calculations/message-field';
import {PsdCalculation} from '@/store/document/calculations/types';
import Tmv from '@/htmlcanvas/objects/tmv/tmv';
import TmvEntity from '@/store/document/entities/tmv/tmv-entity';

export default interface TmvCalculation {
    coldTemperatureC: number | null;
    coldPressureKPA: number | null;
    coldPeakFlowRate: number | null;
    coldPsdUs: number | null;

    hotTemperatureC: number | null;
    hotPressureKPA: number | null;
    hotPeakFlowRate: number | null;
    hotPsdUs: number | null;

    warmOutTemperature: number | null;
    warmOutPressureKPA: number | null;
    warmOutFlowRateLS: number | null;

    coldOutTemperature: number | null;
    coldOutPressureKPA: number | null;
    coldOutFlowRateLS: number | null;
}


export function makeTmvCalculationFields(tmv: TmvEntity): MessageField[] {
    const result = [
        {property: 'coldTemperatureC', title: 'Cold Rough-In Temperature (C)', category: FieldCategory.Temperature},
        {property: 'coldPressureKPA', title: 'Cold Rough-In Pressure (kPa)', category: FieldCategory.Pressure},
        {property: 'coldPeakFlowRate', title: 'Cold Rough-In Peak Flow Rate (L/s)', category: FieldCategory.FlowRate},

        {property: 'hotTemperatureC', title: 'Hot Rough-In Temperature (C)', category: FieldCategory.Temperature},
        {property: 'hotPressureKPA', title: 'Hot Rough-In Pressure (kPa)', category: FieldCategory.Pressure},
        {property: 'hotPeakFlowRate', title: 'Hot Rough-In Peak Flow Rate (L/s)', category: FieldCategory.FlowRate},

        {property: 'warmOutTemperatureC', title: 'Warm Temperature (C)', category: FieldCategory.Temperature},
        {property: 'warmOutPressureKPA', title: 'Warm Pressure (kPa)', category: FieldCategory.Pressure},
        {property: 'warmOutFlowRateLS', title: 'Warm Flow Rate (L/s)', category: FieldCategory.FlowRate},
    ];

    if (tmv.coldOutputUid) {
        result.push(
            {property: 'coldOutTemperatureC', title: 'Cold Temperature (C)', category: FieldCategory.Temperature},
            {property: 'coldOutPressureKPA', title: 'Cold Pressure (kPa)', category: FieldCategory.Pressure},
            {property: 'coldOutFlowRateLS', title: 'Cold Flow Rate (L/s)', category: FieldCategory.FlowRate},
        );
    }

    return result;
}

export function emptyTmvCalculation(): TmvCalculation {
    return {
        coldPressureKPA: null,
        coldTemperatureC: null,
        coldPeakFlowRate: null,
        coldPsdUs: null,

        hotPressureKPA: null,
        hotTemperatureC: null,
        hotPeakFlowRate: null,
        hotPsdUs: null,

        warmOutFlowRateLS: null,
        warmOutPressureKPA: null,
        warmOutTemperature: null,

        coldOutFlowRateLS: null,
        coldOutPressureKPA: null,
        coldOutTemperature: null,
    };
}
