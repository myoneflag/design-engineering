import {createDummyCanvas} from '../../../utils/example-canvas';
import {expect} from 'chai';
import * as _ from 'lodash';
import {examplePipeEntity} from '../../../utils/example-drawable-entitites';
import { bg1 } from '../../../utils/example-backgrounds';
import {shouldBehaveLikeLayer} from './layer.spec';
import {DocumentState} from '../../../../src/store/document/types';
import CanvasContext from '../../../../src/htmlcanvas/lib/canvas-context';
import {createExampleDocument} from '../../../utils/example-document';

describe('hydraulics-layer.ts', () => {
    let canvas: CanvasContext;

    beforeEach(() => {
        canvas = createDummyCanvas(createExampleDocument());
        canvas.hydraulicsLayer.resetDocument(canvas.document);
    });

    it ('should only accept drawable entities', () => {
        const entities = canvas.document.drawing.entities.map((b) => canvas.objectStore.get(b.uid)!);
        expect(entities.map((b) => b.uid).sort()).eql(_.clone(canvas.hydraulicsLayer.uidsInOrder.sort()));

        canvas.hydraulicsLayer.addEntity(examplePipeEntity);
        expect(canvas.hydraulicsLayer.uidsInOrder.includes(examplePipeEntity.uid));

        try {
            canvas.hydraulicsLayer.addEntity(bg1);
        } catch (e) {
            // Do nothing
        }
        expect(!canvas.hydraulicsLayer.uidsInOrder.includes(bg1.uid));
    });

    canvas = createDummyCanvas(createExampleDocument());
    shouldBehaveLikeLayer(canvas.hydraulicsLayer, canvas);
});
