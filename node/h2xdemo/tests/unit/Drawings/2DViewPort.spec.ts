import { expect } from 'chai';
import {ViewPort} from '@/Drawings/2DViewport';

describe('2DViewPort.ts', () => {
    /*
    it('does a round trip with coordinates', () => {
        const vp = new ViewPort(100, 200, 300, 400, 0.4);
        const wc = [50, -350];
        const sc = vp.toScreenCoord(wc[0], wc[1]);
        const nwc = vp.toWorldCoord(sc[0], sc[1]);
        expect(wc).deep.equal(nwc);
    });

    it ('creates correct viewports from 2 points', () => {
        const [x, y] = [2000, 1000];
        const [w, h] = [100, 50];
        const vp = ViewPort.from2Points(0, 0, 0, h, x, y, w, 0, w, h);
        expect(vp.centerX).to.equal(x/2);
        expect(vp.centerY).to.equal(y/2);

        const [pwx, pwy] = vp.toWorldCoord(75, 12.5);
        expect(pwx).to.eq(1500);
        expect(pwy).to.eq(750);
    });*/
});
