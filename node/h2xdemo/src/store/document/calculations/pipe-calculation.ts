import {FieldCategory, MessageField} from '@/store/document/calculations/message-field';
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


export function makePipeCalculationFields(settings: DrawingState): MessageField[] {
    const psdUnit = isGermanStandard(settings.calculationParams.psdMethod) ? 'Design Flow Rate' : 'Loading Units';
    return [
        {property: 'peakFlowRate', title: 'Peak Flow rate (L/s)', category: FieldCategory.FlowRate},
        {property: 'realNominalPipeDiameterMM', title: 'Pipe Diameter (mm)', category: FieldCategory.Size},
        {property: 'realInternalDiameterMM', title: 'Internal Diameter (mm)', category: FieldCategory.Size},
        {property: 'pressureDropKpa', title: 'Peak pressure drop (kPa)', category: FieldCategory.Pressure},
        {property: 'velocityRealMS', title: 'velocity (m/s)', category: FieldCategory.Velocity},
        {property: 'temperatureRange', title: 'Temperature range (C)', category: FieldCategory.Temperature},
        {property: 'psdUnits', title: psdUnit, category: FieldCategory.LoadingUnits},
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
