import BackgroundLayer from "../../../src/htmlcanvas/layers/background-layer";
import BackedDrawableObject from "../../../src/htmlcanvas/lib/backed-drawable-object";
import BaseBackedObject from "../../../src/htmlcanvas/lib/base-backed-object";
import DrawableObject from "../../../src/htmlcanvas/lib/drawable-object";
import { DocumentState, DrawableEntity } from "../../../src/store/document/types";
import { Store } from "vuex";
import { RootState } from "../../../src/store/types";
import { Interaction } from "../../../src/htmlcanvas/lib/interaction";
import HydraulicsLayer from "../../../src/htmlcanvas/layers/hydraulics-layer";
import { DrawingContext} from "../../../src/htmlcanvas/lib/types";
import { Catalog } from "../../../src/store/catalog/types";
import { ViewPort } from "../../../src/htmlcanvas/viewport";
import { DrawableEntityConcrete } from "../../../src/store/document/entities/concrete-entity";
import CalculationLayer from "../../../src/htmlcanvas/layers/calculation-layer";
import { GlobalStore } from "./global-store";
import { ObjectStore } from "./object-store";

// Expose the members of CanvasContext (a vue object) to other classes and methods
// (regular javascript objects). For some reason, extended methods and members are
// invisible in other files, so this is needed.
export default interface CanvasContext {
    backgroundLayer: BackgroundLayer;
    hydraulicsLayer: HydraulicsLayer;
    calculationLayer: CalculationLayer;

    objectStore: ObjectStore;
    globalStore: GlobalStore;
    document: DocumentState;
    effectiveCatalog: Catalog;
    isLayerDragging: boolean;

    $store: Store<RootState>;
    viewPort: ViewPort;

    interactive: DrawableEntityConcrete[] | null;

    lastDrawingContext: DrawingContext | null;

    offerInteraction(
        interaction: Interaction,
        filter?: (objects: DrawableEntityConcrete[]) => boolean,
        sortBy?: (objects: DrawableEntityConcrete[]) => any
    ): DrawableEntityConcrete[] | null;

    scheduleDraw(): void;

    deleteEntity(object: BaseBackedObject, throwIfNotFound?: boolean): void;
}
