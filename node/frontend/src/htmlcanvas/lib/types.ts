import { ViewPort } from "../../../src/htmlcanvas/viewport";
import { DocumentState } from "../../../src/store/document/types";
import { ValveType } from "../../../src/store/document/entities/directed-valves/valve-types";
import { Catalog } from "../../../src/store/catalog/types";
import { GlobalStore } from "./global-store";

export interface DrawingContext {
    ctx: CanvasRenderingContext2D;
    vp: ViewPort;
    doc: DocumentState;
    catalog: Catalog;
    globalStore: GlobalStore;
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
