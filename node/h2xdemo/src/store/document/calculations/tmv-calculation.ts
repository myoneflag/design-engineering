import {FieldCategory, CalculationField, Units} from '@/store/document/calculations/calculation-field';
import TmvEntity from '@/store/document/entities/tmv/tmv-entity';
import {StandardFlowSystemUids} from '@/store/catalog';

export default interface TmvCalculation {
    coldTemperatureC: number | null;
    coldPressureKPA: number | null;
    coldPeakFlowRate: number | null;
    coldPsdUs: number | null;

    hotTemperatureC: number | null;
    hotPressureKPA: number | null;
    hotPeakFlowRate: number | null;
    hotPsdUs: number | null;

    warmOutTemperatureC: number | null;
    warmOutPressureKPA: number | null;
    warmOutPressureDropKPA: number | null;

    coldOutTemperatureC: number | null;
    coldOutPressureKPA: number | null;
    coldOutPressureDropKPA: number | null;
}


export function makeTmvCalculationFields(tmv: TmvEntity): CalculationField[] {
    const result: CalculationField[] = [
        {property: 'warmOutPressureDropKPA',
            title: 'Warm Pressure Drop',
            short: 'drop',
            attachUid: tmv.warmOutputUid,
            systemUid: StandardFlowSystemUids.WarmWater,
            units: Units.KiloPascals,
            category: FieldCategory.Pressure,
        },
    ];

    if (tmv.coldOutputUid) {
        result.push(
            {property: 'coldOutPressureDropKPA',
                title: 'Cold Pressure Drop (kPa)',
                short: 'drop',
                attachUid: tmv.coldOutputUid,
                systemUid: StandardFlowSystemUids.ColdWater,
                units: Units.KiloPascals,
                category: FieldCategory.Pressure,
            },
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

        warmOutPressureDropKPA: null,
        warmOutPressureKPA: null,
        warmOutTemperatureC: null,

        coldOutPressureDropKPA: null,
        coldOutPressureKPA: null,
        coldOutTemperatureC: null,
    };
}
