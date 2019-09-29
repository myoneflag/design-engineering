import {FieldCategory, MessageField} from '@/store/document/calculations/message-field';
import {PsdCalculation} from '@/store/document/calculations/types';

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

export default interface ValveCalculation {
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
    ];
}

export function emptyValveCalculation(): ValveCalculation {
    return {
        flowRateLS: null,
        pressureDropKPA: null,
        pressureKPA: null,
        valveAttributes: null,
    };
}
