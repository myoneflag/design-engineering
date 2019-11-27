import CanvasContext from '@/htmlcanvas/lib/canvas-context';
import {Interaction} from '@/htmlcanvas/lib/interaction';
import {DrawableEntityConcrete} from '@/store/document/entities/concrete-entity';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import BackgroundLayer from '@/htmlcanvas/layers/background-layer';
import {ObjectStore} from '@/htmlcanvas/lib/types';
import {ViewPort} from '@/htmlcanvas/viewport';
import * as TM from 'transformation-matrix';
import {Store} from 'vuex';
import {DocumentState, initialDocumentState} from '@/store/document/types';
import {RootState} from '@/store/types';
import {Catalog} from '@/store/catalog/types';
import HydraulicsLayer from '@/htmlcanvas/layers/hydraulics-layer';
import {createExampleDocument} from './example-document';
import CalculationLayer from '@/htmlcanvas/layers/calculation-layer';
import {registerObjectBuilders} from '@/htmlcanvas/objects';
import { expect } from 'chai';
import {createTestCatalog} from './default-test-catalog';

export function createDummyCanvas(document: DocumentState = initialDocumentState): CanvasContext {
    const objectStore = new ObjectStore();
    const canvas = {
        get $store(): Store<RootState> {
            throw new Error();
        },
        backgroundLayer: new BackgroundLayer(objectStore, () => {/**/}, () => {/**/}, () => {/**/}),
        document,
        effectiveCatalog: createTestCatalog(),
        hydraulicsLayer: new HydraulicsLayer(objectStore, () => {/**/}, () => {/**/}, () => {/**/}),
        calculationLayer: new CalculationLayer(objectStore, () => {/**/}, () => {/**/}, () => {/**/}),
        interactive: null,
        isLayerDragging: false,
        lastDrawingContext: null,
        objectStore,
        viewPort: new ViewPort(TM.identity(), 100, 100),
        deleteEntity(object: BaseBackedObject, throwIfNotFound?: boolean): void {/**/},
        offerInteraction(
            interaction: Interaction,
            filter?: (objects: DrawableEntityConcrete[]) => boolean,
            sortBy?: (objects: DrawableEntityConcrete[]) => any,
        ): DrawableEntityConcrete[] | null {
            return [];
        },
        processDocument(redraw?: boolean): void {/**/},
        scheduleDraw(): void {/**/},
    };


    registerObjectBuilders();

    canvas.backgroundLayer.update(canvas.document);
    canvas.hydraulicsLayer.update(canvas.document);
    canvas.calculationLayer.update(canvas.document);

    return canvas;
}
