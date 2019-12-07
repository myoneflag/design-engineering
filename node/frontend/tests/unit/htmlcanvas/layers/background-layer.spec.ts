/* tslint:disable:no-unused-expression */
import {shouldBehaveLikeLayer} from './layer.spec';
import {SelectMode} from '../../../../src/htmlcanvas/layers/layer';
import {createDummyCanvas} from '../../../utils/example-canvas';
import {expect} from 'chai';
import * as _ from 'lodash';
import {examplePipeEntity} from '../../../utils/example-drawable-entitites';
import {bg1} from '../../../utils/example-backgrounds';
import {EntityType} from '../../../../src/store/document/entities/types';
import CanvasContext from '../../../../src/htmlcanvas/lib/canvas-context';
import {createExampleDocument} from '../../../utils/example-document';

describe('background-layer.ts', () => {
    let canvas: CanvasContext;

    beforeEach(() => {
        canvas = createDummyCanvas(createExampleDocument());
        canvas.backgroundLayer.update(canvas.document);
    });

    it ('should accept background items only', () => {
        const allBackgrounds = canvas.document.drawing.backgrounds.map((b) => canvas.objectStore.get(b.uid)!);
        expect(allBackgrounds.map((b) => b.uid).sort()).eql(_.clone(canvas.backgroundLayer.uidsInOrder.sort()));

        canvas.backgroundLayer.addEntity(examplePipeEntity);
        expect(!canvas.backgroundLayer.uidsInOrder.includes(examplePipeEntity.uid));

        canvas.backgroundLayer.addEntity(bg1);
        expect(canvas.backgroundLayer.uidsInOrder.includes(bg1.uid));
    });

    it ('should get a correct background at a location', () => {
        const centerbg1 = {x: 4836.871701696131, y: -9697.453648803843};
        const centerbg2 = {x: -69856.88127970912, y: -22780.591501116403};

        const bga = canvas.backgroundLayer.getBackgroundAt(centerbg1);
        const bgb = canvas.backgroundLayer.getBackgroundAt(centerbg2);
        expect(Array.from(canvas.backgroundLayer.objectStore.values()).filter((o) =>
            o.type === EntityType.BACKGROUND_IMAGE).length).lte(2);
        expect(canvas.document.drawing.backgrounds.length).eq(2);
        expect(canvas.backgroundLayer.uidsInOrder.length).eq(2);
        expect(bga).to.be.ok;
        expect(bgb).to.be.ok;
        expect(canvas.document.drawing.backgrounds[0].uid).eq(bga!.uid);
        expect(canvas.document.drawing.backgrounds[1].uid).eq(bgb!.uid);

        // click on crop psty
        const centerbgcrop = {x: -47934.171398119404, y: -62957.33891688941};
        const bgCropped = canvas.backgroundLayer.getBackgroundAt(centerbgcrop);
        expect(bgCropped).to.be.null;

        // click on shared part
        const centerShared = {x: -24320.96017665227, y: -10073.755882549995};
        let sharedBg = canvas.backgroundLayer.getBackgroundAt(centerShared);
        expect(sharedBg).to.be.ok;
        expect(sharedBg!.uid === canvas.document.drawing.backgrounds[1].uid);

        // select #0, and still at #1.
        canvas.backgroundLayer.select(
            [canvas.objectStore.get(canvas.document.drawing.backgrounds[0].uid)!],
            SelectMode.Add,
        );
        sharedBg = canvas.backgroundLayer.getBackgroundAt(centerShared);
        expect(sharedBg).to.be.ok;
        expect(sharedBg!.uid === canvas.document.drawing.backgrounds[1].uid);
    });

    canvas = createDummyCanvas(createExampleDocument());
    shouldBehaveLikeLayer(canvas.backgroundLayer, canvas);
});
