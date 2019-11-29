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
        {property: 'coldTemperatureC',
            title: 'Cold Rough-In Temperature',
            short: '',
            attachUid: tmv.coldRoughInUid,
            systemUid: StandardFlowSystemUids.ColdWater,
            units: Units.Celsius,
            category: FieldCategory.Temperature,
        },
        {property: 'coldPressureKPA',
            title: 'Cold Rough-In Pressure',
            short: '',
            attachUid: tmv.coldRoughInUid,
            systemUid: StandardFlowSystemUids.ColdWater,
            units: Units.KiloPascals,
            category: FieldCategory.Pressure,
        },
        {property: 'coldPeakFlowRate',
            title: 'Cold Rough-In Peak Flow Rate',
            short: 'peak',
            attachUid: tmv.coldRoughInUid,
            systemUid: StandardFlowSystemUids.ColdWater,
            units: Units.LitersPerSecond,
            category: FieldCategory.FlowRate,
        },

        {property: 'hotTemperatureC',
            title: 'Hot Rough-In Temperature',
            short: '',
            attachUid: tmv.hotRoughInUid,
            systemUid: StandardFlowSystemUids.HotWater,
            units: Units.Celsius,
            category: FieldCategory.Temperature,
        },
        {property: 'hotPressureKPA',
            title: 'Hot Rough-In Pressure',
            short: '',
            attachUid: tmv.coldRoughInUid,
            systemUid: StandardFlowSystemUids.HotWater,
            units: Units.KiloPascals,
            category: FieldCategory.Pressure,
        },
        {property: 'hotPeakFlowRate',
            title: 'Hot Rough-In Peak Flow Rate',
            short: 'peak',
            attachUid: tmv.hotRoughInUid,
            systemUid: StandardFlowSystemUids.HotWater,
            units: Units.LitersPerSecond,
            category: FieldCategory.FlowRate,
        },

        {property: 'warmOutTemperatureC',
            title: 'Warm Temperature',
            short: '',
            attachUid: tmv.warmOutputUid,
            systemUid: StandardFlowSystemUids.WarmWater,
            units: Units.Celsius,
            category: FieldCategory.Temperature,
        },
        {property: 'warmOutPressureKPA',
            title: 'Warm Pressure',
            short: '',
            attachUid: tmv.warmOutputUid,
            systemUid: StandardFlowSystemUids.WarmWater,
            units: Units.KiloPascals,
            category: FieldCategory.Pressure,
        },
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
            {property: 'coldOutTemperatureC',
                title: 'Cold Temperature (C)',
                short: '',
                attachUid: tmv.coldOutputUid,
                systemUid: StandardFlowSystemUids.ColdWater,
                units: Units.Celsius,
                category: FieldCategory.Temperature,
            },
            {property: 'coldOutPressureKPA',
                title: 'Cold Pressure (kPa)',
                short: '',
                attachUid: tmv.coldOutputUid,
                systemUid: StandardFlowSystemUids.ColdWater,
                units: Units.KiloPascals,
                category: FieldCategory.Pressure,
            },
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
