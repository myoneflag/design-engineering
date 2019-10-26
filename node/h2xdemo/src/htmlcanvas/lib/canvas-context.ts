import BackgroundLayer from '@/htmlcanvas/layers/background-layer';
import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import DrawableObject from '@/htmlcanvas/lib/drawable-object';
import {DocumentState, DrawableEntity} from '@/store/document/types';
import {Store} from 'vuex';
import {RootState} from '@/store/types';
import {Interaction} from '@/htmlcanvas/lib/interaction';
import HydraulicsLayer from '@/htmlcanvas/layers/hydraulics-layer';
import {DrawingContext, ObjectStore} from '@/htmlcanvas/lib/types';
import {Catalog} from '@/store/catalog/types';
import {ViewPort} from '@/htmlcanvas/viewport';
import {DrawableEntityConcrete} from '@/store/document/entities/concrete-entity';


// Expose the members of CanvasContext (a vue object) to other classes and methods
// (regular javascript objects). For some reason, extended methods and members are
// invisible in other files, so this is needed.
export default interface CanvasContext {
    backgroundLayer: BackgroundLayer;
    hydraulicsLayer: HydraulicsLayer;
    objectStore: ObjectStore;
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
        sortBy?: (objects: DrawableEntityConcrete[]) => any,
    ): DrawableEntityConcrete[] | null;

    scheduleDraw(): void;
    processDocument(redraw?: boolean): void;

    deleteEntity(object: BaseBackedObject): void;
}


