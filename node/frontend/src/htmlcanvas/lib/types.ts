import { ViewPort } from "../../../src/htmlcanvas/viewport";
import { DocumentState } from "../../../src/store/document/types";
import { ValveType } from "../../../../common/src/api/document/entities/directed-valves/valve-types";
import { GlobalStore } from "./global-store";
import { Catalog } from "../../../../common/src/api/catalog/types";
import {PriceTable} from "../../../../common/src/api/catalog/price-table";

export interface DrawingContext {
    ctx: CanvasRenderingContext2D;
    vp: ViewPort;
    doc: DocumentState;
    catalog: Catalog;
    priceTable: PriceTable;
    globalStore: GlobalStore;
    selectedUids: Set<string>;
}

// Manages objects, and also keeps track of connections. This basic one is to

export interface SelectionTarget {
    uid: string | null;
    property?: string;
    message?: string;
    variant?: string;
    title?: string;
    recenter?: boolean;
}

export interface ValveId {
    type: ValveType;
    name: string;
    catalogId: string;
}

export type ValidationResult = {success: true} | {success: false, message: string, modified: boolean};

export interface CostBreakdown {
    cost: number;
    breakdown: Array<{
        qty: number;
        path: string;
    }>,
}
