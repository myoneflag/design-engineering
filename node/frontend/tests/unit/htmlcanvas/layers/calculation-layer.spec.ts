import {createDummyCanvas} from '../../../utils/example-canvas';
import {expect} from 'chai';
import * as _ from 'lodash';
import {examplePipeEntity} from '../../../utils/example-drawable-entitites';
import { bg1 } from 'tests/utils/example-backgrounds';
import {shouldBehaveLikeLayer} from './layer.spec';
import {DocumentState} from '../../../../src/store/document/types';
import CanvasContext from '../../../../src/htmlcanvas/lib/canvas-context';
import {createExampleDocument} from '../../../utils/example-document';

describe('calculation-layer.ts', () => {
    let canvas: CanvasContext;

    beforeEach(() => {
        canvas = createDummyCanvas(createExampleDocument());
        canvas.hydraulicsLayer.update(canvas.document);
    });

    canvas = createDummyCanvas(createExampleDocument());
    shouldBehaveLikeLayer(canvas.hydraulicsLayer, canvas);
});
