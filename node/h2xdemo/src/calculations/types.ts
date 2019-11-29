import {DrawingState} from '@/store/document/types';
import {Catalog} from '@/store/catalog/types';
import {ObjectStore} from '@/htmlcanvas/lib/types';

export enum DemandType {
    PSD,
    Typical,
    Static,
}

export interface CalculationContext {
    drawing: DrawingState;
    catalog: Catalog;
    objectStore: ObjectStore;
}
