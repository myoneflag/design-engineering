import { DocumentState } from "../../src/store/document/types";
import { GlobalStore } from "../htmlcanvas/lib/global-store";
import { Catalog } from "../../../common/src/api/catalog/types";
import { DrawingState } from "../../../common/src/api/document/drawing";
import {PriceTable} from "../../../common/src/api/catalog/price-table";

export interface CalculationContext {
    drawing: DrawingState;
    catalog: Catalog;
    priceTable: PriceTable;
    globalStore: GlobalStore;
    doc: DocumentState;
}

export enum PressurePushMode {
    PSD,
    CirculationFlowOnly,
    Static,
}
