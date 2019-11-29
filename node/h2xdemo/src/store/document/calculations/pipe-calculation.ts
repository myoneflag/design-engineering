import {FieldCategory, CalculationField, Units} from '@/store/document/calculations/calculation-field';
import {PsdCalculation} from '@/store/document/calculations/types';
import {DrawingState} from '@/store/document/types';
import {isGermanStandard} from '@/config';

export default interface PipeCalculation extends PsdCalculation {
    peakFlowRate: number | null;
    optimalInnerPipeDiameterMM: number | null;
    realNominalPipeDiameterMM: number | null;
    realInternalDiameterMM: number | null;
    pressureDropKpa: number | null;

    velocityRealMS: number | null;

    temperatureRange: string | null;
}


export function makePipeCalculationFields(settings: DrawingState): CalculationField[] {
    const psdUnit = isGermanStandard(settings.calculationParams.psdMethod) ? 'Design Flow Rate' : 'Loading Units';
    const psdUnitShort = isGermanStandard(settings.calculationParams.psdMethod) ? 'D. Flow' : 'LU';
    return [
        {property: 'peakFlowRate',
            title: 'Peak Flow rate',
            short: 'Peak',
            units: Units.LitersPerSecond,
            category: FieldCategory.FlowRate,
        },
        {property: 'realNominalPipeDiameterMM',
            title: 'Pipe Diameter',
            short: 'Nominal',
            units: Units.Millimeters,
            category: FieldCategory.Size,
        },
        {property: 'realInternalDiameterMM',
            title: 'Internal Diameter',
            short: 'Internal',
            units: Units.Millimeters,
            category: FieldCategory.Size,
        },
        {property: 'pressureDropKpa',
            title: 'Peak pressure drop',
            short: 'Drop',
            units: Units.KiloPascals,
            category: FieldCategory.Pressure,
        },
        {property: 'velocityRealMS',
            title: 'Peak Velocity',
            short: '',
            units: Units.MetersPerSecond,
            category: FieldCategory.Velocity,
        },
        {property: 'temperatureRange',
            title: 'Temperature range',
            short: '',
            units: Units.Celsius,
            category: FieldCategory.Temperature,
        },
        {property: 'psdUnits',
            title: psdUnit,
            short: psdUnitShort,
            units: Units.None,
            category: FieldCategory.LoadingUnits,
        },
    ];
}

export function emptyPipeCalculation(): PipeCalculation {
    return {
        peakFlowRate: null,
        psdUnits: null,
        optimalInnerPipeDiameterMM: null,
        realInternalDiameterMM: null,
        pressureDropKpa: null,
        realNominalPipeDiameterMM: null,
        temperatureRange: null,
        velocityRealMS: null,
    };
}
