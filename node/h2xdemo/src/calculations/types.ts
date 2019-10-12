import {DrawingState} from '@/store/document/types';
import {Catalog} from '@/store/catalog/types';
import {ObjectStore} from '@/htmlcanvas/lib/types';

export enum DemandType {
    PSD,
    Typical,
    Zero,
}

export interface CalculationContext {
    drawing: DrawingState;
    catalog: Catalog;
    objectStore: ObjectStore;
}
