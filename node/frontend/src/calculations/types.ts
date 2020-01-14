import { DocumentState} from "../../src/store/document/types";
import { GlobalStore } from "../htmlcanvas/lib/global-store";
import { Catalog } from "../../../common/src/api/catalog/types";
import { DrawingState } from "../../../common/src/api/document/drawing";

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
