import {FlowSystemParameters} from '@/store/document/types';

export enum FieldType {
    Text = 'text',
    TextArea = 'textarea',
    Number = 'number',
    Color = 'color',
    Choice = 'choice',
    FlowSystemChoice = 'flow-system-choice',
}

export interface NumberParams {
    min: number | null;
    max: number | null;
}

export interface TextAreaParams {
    rows: number;
}

export interface ChoiceParams {
    choices: any[];
}

export interface FlowSystemChoiceParams {
    systems: FlowSystemParameters[];
}

export interface PropertyField {
    property: string;
    title: string;
    hasDefault: boolean;
    type: FieldType;
    params: NumberParams | TextAreaParams | ChoiceParams | FlowSystemChoiceParams | null;
}
