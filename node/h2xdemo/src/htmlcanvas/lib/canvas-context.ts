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


// Expose the members of CanvasContext (a vue object) to other classes and methods
// (regular javascript objects). For some reason, extended methods and members are
// invisible in other files, so this is needed.
export default interface CanvasContext {
    backgroundLayer: BackgroundLayer;
    hydraulicsLayer: HydraulicsLayer;
    objectStore: ObjectStore;
    document: DocumentState;

    $store: Store<RootState>;

    interactive: DrawableEntity[] | null;

    lastDrawingContext: DrawingContext | null;

    lockDrawing(): void;
    unlockDrawing(): void;

    offerInteraction(
        interaction: Interaction,
        filter?: (objects: DrawableEntity[]) => boolean,
        sortBy?: (objects: DrawableEntity[]) => any,
    ): DrawableEntity[] | null;

    scheduleDraw(): void;
    processDocument(): void;

    deleteEntity(object: BaseBackedObject): void;
}


