import { DocumentState, DrawingState } from "../../src/store/document/types";
import { Catalog } from "../../src/store/catalog/types";
import { GlobalStore } from "../htmlcanvas/lib/global-store";

export enum DemandType {
    PSD,
    Typical,
    Static
}

export interface CalculationContext {
    drawing: DrawingState;
    catalog: Catalog;
    globalStore: GlobalStore;
    doc: DocumentState;
}
