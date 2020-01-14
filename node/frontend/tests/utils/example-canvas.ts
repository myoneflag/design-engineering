import CanvasContext from '../../src/htmlcanvas/lib/canvas-context';
import {Interaction} from '../../src/htmlcanvas/lib/interaction';
import {DrawableEntityConcrete} from '../../../common/src/api/document/entities/concrete-entity';
import BaseBackedObject from '../../src/htmlcanvas/lib/base-backed-object';
import BackgroundLayer from '../../src/htmlcanvas/layers/background-layer';
import {ViewPort} from '../../src/htmlcanvas/viewport';
import * as TM from 'transformation-matrix';
import {Store} from 'vuex';
import {DocumentState, initialDocumentState} from '../../src/store/document/types';
import {RootState} from '../../src/store/types';
import HydraulicsLayer from '../../src/htmlcanvas/layers/hydraulics-layer';
import {createExampleDocument} from './example-document';
import CalculationLayer from '../../src/htmlcanvas/layers/calculation-layer';
import {registerObjectBuilders} from '../../src/htmlcanvas/objects';
import { expect } from 'chai';
import {createTestCatalog} from './default-test-catalog';
import { ObjectStore } from "../../src/htmlcanvas/lib/object-store";
import { Catalog } from "../../../common/src/api/catalog/types";

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

    canvas.backgroundLayer.resetDocument(canvas.document);
    canvas.hydraulicsLayer.resetDocument(canvas.document);
    canvas.calculationLayer.resetDocument(canvas.document);

    return canvas;
}
