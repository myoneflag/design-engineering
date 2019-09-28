import {FieldCategory, MessageField} from '@/store/document/calculations/message-field';
import {PsdPointCalculation} from '@/store/document/calculations/types';

export interface DeadlegAttribute {
    numConnections: 1 | null;
}

export interface TwoConnectionAttribute {
    numConnections: 2 | null;
    nominalDiameterAMM: number | null;
    nominalDiameterBMM: number | null;
    angle: number | null;
}

export interface ThreeConnectionAttribute {
    numConnections: 3 | null;
    nominalDiameterMM: number | null;
}

export default interface ValveCalculation extends PsdPointCalculation {
    flowRateLS: number | null;
    pressureDropKPA: number | null;
    pressureKPA: number | null;

    valveAttributes: DeadlegAttribute | TwoConnectionAttribute | ThreeConnectionAttribute | null;
}

export function makeValveCalculationFields(): MessageField[] {
    return [
        {property: 'flowRateLS', title: 'Flow Rate (L/s)', category: FieldCategory.FlowRate},
        {property: 'pressureDropKPA', title: 'Pressure Drop (kPa)', category: FieldCategory.Pressure},
        {property: 'pressureKPA', title: 'Pressure (kPa)', category: FieldCategory.Pressure},
        {property: 'loadingUnits', title: 'Loading Units', category: FieldCategory.LoadingUnits},
    ];
}

export function emptyValveCalculation(): ValveCalculation {
    return {
        flowRateLS: null,
        loadingUnits: null,
        pressureDropKPA: null,
        pressureKPA: null,
        valveAttributes: null,
    };
}
