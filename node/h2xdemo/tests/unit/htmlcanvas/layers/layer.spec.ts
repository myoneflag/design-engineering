import Layer, {SelectMode} from '@/htmlcanvas/layers/layer';
import {expect} from 'chai';
import {initialDocumentState} from '@/store/document/types';
import * as BG from '../../../utils/example-backgrounds';
import CanvasContext from '@/htmlcanvas/lib/canvas-context';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import * as _ from 'lodash';
import {createExampleDocument} from '../../../utils/example-document';

function getPopulatedDcoument() {
    const doc = initialDocumentState;
    doc.drawing.backgrounds.push(BG.bg1, BG.bg2, BG.bg3, BG.bg4);

}

function checkSelected(layer: Layer, b: BaseBackedObject[], checkObjects?: BaseBackedObject[]) {

    const auids = layer.selectedObjects.map((o) => o.uid);
    const buids = layer.selectedEntities.map((o) => o.uid);
    const cuids = b.map((o) => o.uid);
    expect(auids.sort()).eql(cuids.sort());
    expect(buids.sort()).eql(cuids.sort());

    if (checkObjects) {
        checkObjects.forEach((o) => {
            expect(layer.isSelected(o)).eq(buids.includes(o.uid));
        });
    }
}

export function shouldBehaveLikeLayer(layer: Layer, canvas: CanvasContext) {
    beforeEach (() => {
        layer.select([], SelectMode.Replace);
        canvas.document = createExampleDocument();
        layer.update(canvas.document);
    });

    it ('should clear its selection', () => {
        layer.select([], SelectMode.Replace);
        expect(layer.selectedEntities).eql([]);
        expect(layer.selectedObjects).eql([]);
    });

    it ('should select all objects', () => {
        const allBackgrounds = canvas.document.drawing.backgrounds.map((b) => canvas.objectStore.get(b.uid)!);
        const allHydraulics = canvas.document.drawing.entities.map((o) => canvas.objectStore.get(o.uid)!);
        const allObjects = _.clone(allBackgrounds);
        allObjects.push(...allHydraulics);

        layer.select(allObjects, SelectMode.Replace);
        checkSelected(layer, allObjects);
    });

    it ('should toggle, remove, and add to selection', () => {
        const allHydraulics = canvas.document.drawing.entities.map((o) => canvas.objectStore.get(o.uid)!);
        const allBackgrounds = canvas.document.drawing.backgrounds.map((b) => canvas.objectStore.get(b.uid)!);
        const allObjects = _.clone(allBackgrounds);
        allObjects.push(...allHydraulics);

        layer.select(allBackgrounds, SelectMode.Replace);
        checkSelected(layer, allBackgrounds, allObjects);

        layer.select(allObjects, SelectMode.Toggle);
        checkSelected(layer, allHydraulics, allObjects);

        layer.select(allObjects, SelectMode.Add);
        checkSelected(layer, allObjects, allObjects);

        layer.select(allBackgrounds, SelectMode.Exclude);
        checkSelected(layer, allHydraulics, allObjects);

        layer.select(allObjects, SelectMode.Exclude);
        checkSelected(layer, [], allObjects);
    });

    it ('should remove deleted item from selection', () => {
        const allHydraulics = canvas.document.drawing.entities.map((o) => canvas.objectStore.get(o.uid)!);
        const allBackgrounds = canvas.document.drawing.backgrounds.map((b) => canvas.objectStore.get(b.uid)!);
        const allObjects = _.clone(allBackgrounds);
        allObjects.push(...allHydraulics);

        layer.select(allObjects, SelectMode.Replace);
        try {
            layer.deleteEntity(allObjects[0].entity);
        } catch (e) {
            // Do nothing
        }
        checkSelected(layer, allObjects.splice(1));
    });

    it ('should delete an item', () => {
        const toDelete = layer.uidsInOrder[0];
        const newUids = _.clone(layer.uidsInOrder).splice(1);
        layer.deleteEntity(canvas.objectStore.get(toDelete)!.entity);
        expect(newUids.sort()).eql(layer.uidsInOrder.sort());
    });

    afterEach (() => {
        layer.select([], SelectMode.Replace);
        layer.update(initialDocumentState);
    });
}
