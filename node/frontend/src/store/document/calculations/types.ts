import {DrawableEntity} from '../../../../src/store/document/types';

export interface CalculationTarget<T> extends DrawableEntity {
    calculation: T | null;
}

export interface PsdCalculation {
    psdUnits: number | null;
}

export interface Calculation {
    warning: string | null;
}
