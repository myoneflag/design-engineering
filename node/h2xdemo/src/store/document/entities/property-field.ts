import {FlowSystemParameters} from '@/store/document/types';
import {Choice} from '@/lib/types';

export enum FieldType {
    Text = 'text',
    TextArea = 'textarea',
    Number = 'number',
    Color = 'color',
    Choice = 'choice',
    FlowSystemChoice = 'flow-system-choice',
    Rotation = 'rotation',
}

export interface NumberParams {
    min: number | null;
    max: number | null;
}

export interface TextAreaParams {
    rows: number;
}

export interface ChoiceParams {
    choices: Choice[];
}

export interface FlowSystemChoiceParams {
    systems: FlowSystemParameters[];
}

export interface CalculationParams {
    initialValue: any;
}

export interface PropertyField {
    property: string;
    title: string;
    hasDefault: boolean;
    isCalculated: boolean;
    requiresInput?: boolean;
    type: FieldType;
    params: (NumberParams | TextAreaParams | ChoiceParams | FlowSystemChoiceParams) & (CalculationParams | {}) | null;
}
