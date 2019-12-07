import {DrawingState} from '../../src/store/document/types';
import {Catalog} from '../../src/store/catalog/types';
import {ObjectStore} from '../../src/htmlcanvas/lib/types';

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
