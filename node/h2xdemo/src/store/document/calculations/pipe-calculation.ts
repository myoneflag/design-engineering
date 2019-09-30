import {FieldCategory, MessageField} from '@/store/document/calculations/message-field';
import {PsdCalculation} from '@/store/document/calculations/types';

export default interface PipeCalculation extends PsdCalculation {
    flowRateLS: number | null;
    optimalInnerPipeDiameterMM: number | null;
    realNominalPipeDiameterMM: number | null;
    pressureDropKpa: number | null;

    velocityRealMS: number | null;

    temperatureRange: string | null;
}


export function makePipeCalculationFields(): MessageField[] {
    return [
        {property: 'flowRateLS', title: 'Flow rate (L/s)', category: FieldCategory.FlowRate},
        {property: 'realNominalPipeDiameterMM', title: 'Pipe Diameter (mm)', category: FieldCategory.Size},
        {property: 'pressureDropKpa', title: 'Pressure drop (kPa)', category: FieldCategory.Pressure},
        {property: 'velocityRealMS', title: 'velocity (m/s)', category: FieldCategory.Velocity},
        {property: 'temperatureRange', title: 'Temperature range (C)', category: FieldCategory.Temperature},
        {property: 'loadingUnits', title: 'Loading Units', category: FieldCategory.LoadingUnits},
    ];
}

export function emptyPipeCalculation(): PipeCalculation {
    return {
        flowRateLS: null,
        loadingUnits: null,
        optimalInnerPipeDiameterMM: null,
        pressureDropKpa: null,
        realNominalPipeDiameterMM: null,
        temperatureRange: null,
        velocityRealMS: null,
    };
}
