import BackgroundLayer from "../../../src/htmlcanvas/layers/background-layer";
import BackedDrawableObject from "../../../src/htmlcanvas/lib/backed-drawable-object";
import BaseBackedObject from "../../../src/htmlcanvas/lib/base-backed-object";
import DrawableObject from "../../../src/htmlcanvas/lib/drawable-object";
import { DocumentState } from "../../../src/store/document/types";
import { Store } from "vuex";
import { RootState } from "../../../src/store/types";
import { Interaction } from "../../../src/htmlcanvas/lib/interaction";
import HydraulicsLayer from "../../../src/htmlcanvas/layers/hydraulics-layer";
import { DrawingContext } from "../../../src/htmlcanvas/lib/types";
import { ViewPort } from "../../../src/htmlcanvas/viewport";
import { DrawableEntityConcrete } from "../../../../common/src/api/document/entities/concrete-entity";
import CalculationLayer from "../../../src/htmlcanvas/layers/calculation-layer";
import { GlobalStore } from "./global-store";
import { ObjectStore } from "./object-store";
import { Catalog } from "../../../../common/src/api/catalog/types";
import { DrawableEntity } from "../../../../common/src/api/document/drawing";
import Layer from "../layers/layer";
import {PriceTable} from "../../../../common/src/api/catalog/price-table";
import { SupportedLocales } from "../../../../common/src/api/locale";

// Expose the members of CanvasContext (a vue object) to other classes and methods
// (regular javascript objects). For some reason, extended methods and members are
// invisible in other files, so this is needed.
export default interface CanvasContext {
    backgroundLayer: BackgroundLayer;
    hydraulicsLayer: HydraulicsLayer;
    calculationLayer: CalculationLayer;
    activeLayer: Layer;

    globalStore: GlobalStore;
    document: DocumentState;
    effectiveCatalog: Catalog;
    effectivePriceTable: PriceTable;
    isLayerDragging: boolean;

    $store: Store<RootState>;
    viewPort: ViewPort;

    interactive: DrawableEntityConcrete[] | null;

    lastDrawingContext: DrawingContext | null;

    visibleObjects: BaseBackedObject[];

    offerInteraction(
        interaction: Interaction,
        filter?: (objects: DrawableEntityConcrete[]) => boolean,
        sortBy?: (objects: DrawableEntityConcrete[]) => any
    ): DrawableEntityConcrete[] | null;

    scheduleDraw(): void;

    drawFull(ctx?: CanvasRenderingContext2D, vp?: ViewPort, forExport?: boolean): Promise<void>;

    deleteEntity(object: BaseBackedObject, throwIfNotFound?: boolean): void;

    isSelected(uid: string): boolean;
}
