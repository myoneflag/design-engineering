import {FlowSystemParameters} from '@/store/document/types';

export enum FieldCategory {
    Pressure,
    Velocity,
    FlowRate,
    Size,
    Temperature,
    LoadingUnits,
    FixtureUnits,
}


export interface MessageField {
    property: string;
    title: string;
    category: FieldCategory;
}
