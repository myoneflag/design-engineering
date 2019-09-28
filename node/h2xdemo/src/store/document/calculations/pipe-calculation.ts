import {FieldCategory, MessageField} from '@/store/document/calculations/message-field';

export default interface PipeCalculation {
    flowRateLS: number | null;
    optimalInnerPipeDiameterMM: number | null;
    realNominalPipeDiameterMM: number | null;
    pressureDropKpa: number | null;

    velocityOptimalPipeDiameterMS: number | null;
    velocityRealMS: number | null;

    temperatureRange: string | null;
    loadingUnitRange: string | null;
}


export function makePipeCalculationFields(): MessageField[] {
    return [
        {property: 'flowRateLS', title: 'Flow rate (L/s)', category: FieldCategory.FlowRate},
        {property: 'realNominalPipeDiameterMM', title: 'Pipe Diameter (mm)', category: FieldCategory.Size},
        {property: 'pressureDropKpa', title: 'Pressure drop (kPa)', category: FieldCategory.Pressure},
        {property: 'velocityRealMS', title: 'velocity (m/s)', category: FieldCategory.Velocity},
        {property: 'temperatureRange', title: 'Temperature range (C)', category: FieldCategory.Temperature},
        {property: 'loadingUnitRange', title: 'Loading Unit Range', category: FieldCategory.LoadingUnits},
    ];
}

export function emptyPipeCalculation(): PipeCalculation {
    return {
        flowRateLS: null,
        loadingUnitRange: null,
        optimalInnerPipeDiameterMM: null,
        pressureDropKpa: null,
        realNominalPipeDiameterMM: null,
        temperatureRange: null,
        velocityOptimalPipeDiameterMS: null,
        velocityRealMS: null,
    };
}
