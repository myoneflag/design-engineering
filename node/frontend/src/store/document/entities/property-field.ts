import { FlowSystemParameters } from "../../../../src/store/document/types";
import { Choice } from "../../../../src/lib/types";

export enum FieldType {
    Text = "text",
    TextArea = "textarea",
    Number = "number",
    Color = "color",
    Choice = "choice",
    FlowSystemChoice = "flow-system-choice",
    Rotation = "rotation",
    Boolean = "boolean",
    TwoPointScale = "two-point-scale",
    Title = "title"
}

export interface NumberParams extends FieldParams {
    min: number | null;
    max: number | null;
}

export interface TextAreaParams extends FieldParams {
    rows: number;
}

export interface ChoiceParams extends FieldParams {
    choices: Choice[];
}

export interface FlowSystemChoiceParams extends FieldParams {
    systems: FlowSystemParameters[];
}

export interface FieldParams {
    initialValue?: any;
}

export interface PropertyFieldBase {
    property: string;
    title: string;
    hasDefault: boolean;
    isCalculated: boolean;
    requiresInput?: boolean;
    readonly?: boolean;
    multiFieldId: string | null;
    type: FieldType;
}

export interface NumberField extends PropertyFieldBase {
    type: FieldType.Number;
    params: NumberParams;
}

export interface FlowSystemChoiceField extends PropertyFieldBase {
    type: FieldType.FlowSystemChoice;
    params: FlowSystemChoiceParams;
}

export interface ChoiceField extends PropertyFieldBase {
    type: FieldType.Choice;
    params: ChoiceParams;
}

export interface TextAreaField extends PropertyFieldBase {
    type: FieldType.TextArea;
    params: TextAreaParams;
}

export interface ColorField extends PropertyFieldBase {
    type: FieldType.Color;
    params: null;
}

export interface RotationField extends PropertyFieldBase {
    type: FieldType.Rotation;
    params: null;
}

export interface TextField extends PropertyFieldBase {
    type: FieldType.Text;
    params: null;
}

export interface BooleanField extends PropertyFieldBase {
    type: FieldType.Boolean;
    params: null;
}

export interface TitleField extends PropertyFieldBase {
    type: FieldType.Title;
    hasDefault: false;
    isCalculated: false;
    params: null;
}

export type PropertyField =
    | NumberField
    | ChoiceField
    | TextAreaField
    | FlowSystemChoiceField
    | ColorField
    | RotationField
    | TextField
    | BooleanField
    | TitleField;
