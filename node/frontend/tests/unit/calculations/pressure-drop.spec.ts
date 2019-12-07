import {getDarcyWeisbachMH, getFrictionFactor, getReynoldsNumber} from '../../../src/calculations/pressure-drops';
import exports = Mocha.interfaces.exports;
import { expect } from 'chai';

describe('pressure-drop.ts', () => {
    it('calculates reynolds number correctly', () => {
        const rn = getReynoldsNumber(
            997,
            1.309917227,
            10.8,
            0.00100005,
        );
        expect(rn).closeTo(14103.95954, 0.0001);
    });

    it ('calculates friction factor correctly', () => {
        const ff = getFrictionFactor(
            10.8, 0.00015, 14104.9595,
        );
        expect(ff).closeTo(0.028269640029, 0.0001);
    });

    it ('calculates Darcy Weisbach correctly', () => {
        const dw = getDarcyWeisbachMH(
            0.037355726,
            74.5,
            203.1,
            2.57222542,
            9.81,
        );
        expect(dw).closeTo(4.620857567, 0.0001);
    });
});
