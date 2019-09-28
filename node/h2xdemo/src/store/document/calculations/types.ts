import {DrawableEntity} from '@/store/document/types';

export interface CalculationTarget<T> extends DrawableEntity {
    calculation: T | null;
}

export interface PsdPointCalculation {
    loadingUnits: number | null;
}
