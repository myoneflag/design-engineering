import {expect} from 'chai';
import {diffState} from '@/store/document/operation-transforms/state-differ';
import {applyOtOnState} from '@/store/document/operation-transforms/state-ot-apply';

import {CalculationParameters, DrawingState, FlowSystemParameters, GeneralInfo} from '@/store/document/types';
import {EntityType} from '@/store/document/entities/types';
import {BackgroundEntity} from '@/store/document/entities/background-entity';
import {SupportedPsdStandards} from '@/config';
import {cloneSimple} from '@/lib/utils';
import {bg1, bg2, bg2B, bg3, bg4, bg4B, bg4C} from '../../../../utils/example-backgrounds';
import {cp1, gi1, gi2, gi3, ws1, ws2} from '../../../../utils/example-project-settings';

function roundTripTest(prev: DrawingState, next: DrawingState, expectedOps: number = -1) {
    const prevCopy = cloneSimple(prev);
    const ops = diffState(cloneSimple(prev), cloneSimple(next));
    ops.forEach((o) => applyOtOnState(prevCopy, o));
    expect(prevCopy).eql(next);
    if (expectedOps !== -1) {
        expect(ops.length).eq(expectedOps);
    }
}


describe('state-differ.ts', () => {
    it('does not emit on no change', () => {

        const prev: DrawingState = {
            backgrounds: [bg2],
            generalInfo: gi1,
            flowSystems: [ws1],
            calculationParams: cp1,
            entities: [],
            availableFixtures: [],
        };

        const next: DrawingState = {
            backgrounds: [bg2],
            generalInfo: gi1,
            flowSystems: [ws1],
            calculationParams: cp1,
            entities: [],
            availableFixtures: [],
        };

        roundTripTest(prev, next, 0);
    });

    it ('emits a change for static properties', () => {

        const prev: DrawingState = {
            backgrounds: [],
            generalInfo: gi1,
            flowSystems: [ws1],
            calculationParams: cp1,
            entities: [],
            availableFixtures: [],
        };

        const next: DrawingState = {
            backgrounds: [],
            generalInfo: gi2,
            flowSystems: [ws1],
            calculationParams: cp1,
            entities: [],
            availableFixtures: [],
        };

        roundTripTest(prev, next, 1);
    });

    it ('adds to lists', () => {

        const prev: DrawingState = {
            backgrounds: [],
            generalInfo: gi1,
            flowSystems: [],
            calculationParams: cp1,
            entities: [],
            availableFixtures: [],
        };

        const next: DrawingState = {
            backgrounds: [bg2],
            generalInfo: gi1,
            flowSystems: [],
            calculationParams: cp1,
            entities: [],
            availableFixtures: [],
        };

        roundTripTest(prev, next, 1);
    });

    it ('removes from lists', () => {

        const prev: DrawingState = {
            backgrounds: [bg1, bg2, bg3],
            generalInfo: gi1,
            flowSystems: [],
            calculationParams: cp1,
            entities: [],
            availableFixtures: [],
        };

        const next: DrawingState = {
            backgrounds: [],
            generalInfo: gi1,
            flowSystems: [],
            calculationParams: cp1,
            entities: [],
            availableFixtures: [],
        };

        roundTripTest(prev, next, 3);
    });


    it ('Updates from lists', () => {

        const prev: DrawingState = {
            backgrounds: [bg2],
            generalInfo: gi1,
            flowSystems: [],
            calculationParams: cp1,
            entities: [],
            availableFixtures: [],
        };

        const next: DrawingState = {
            backgrounds: [bg2B],
            generalInfo: gi1,
            flowSystems: [],
            calculationParams: cp1,
            entities: [],
            availableFixtures: [],
        };

        roundTripTest(prev, next, 1);
    });

    it ('Moves within lists', () => {

        const prev: DrawingState = {
            backgrounds: [bg1, bg2, bg3],
            generalInfo: gi1,
            flowSystems: [],
            calculationParams: cp1,
            entities: [],
            availableFixtures: [],
        };

        const next: DrawingState = {
            backgrounds: [bg2, bg3, bg1],
            generalInfo: gi1,
            flowSystems: [],
            calculationParams: cp1,
            entities: [],
            availableFixtures: [],
        };

        roundTripTest(prev, next, 1);
    });

    it ('Moves within lists 2', () => {

        const prev: DrawingState = {
            backgrounds: [bg2, bg3, bg1],
            generalInfo: gi1,
            flowSystems: [],
            calculationParams: cp1,
            entities: [],
            availableFixtures: [],
        };

        const next: DrawingState = {
            backgrounds: [bg1, bg2, bg3],
            generalInfo: gi1,
            flowSystems: [],
            calculationParams: cp1,
            entities: [],
            availableFixtures: [],
        };

        roundTripTest(prev, next, 1);
    });

    it ('Does a single change in static array', () => {

        const prev: DrawingState = {
            backgrounds: [bg2, bg3, bg4],
            generalInfo: gi1,
            flowSystems: [ws2, ws1],
            calculationParams: cp1,
            entities: [],
            availableFixtures: [],
        };

        const next: DrawingState = {
            backgrounds: [bg2, bg3, bg4],
            generalInfo: gi1,
            flowSystems: [ws2],
            calculationParams: cp1,
            entities: [],
            availableFixtures: [],
        };

        roundTripTest(prev, next, 1);
    });

    it ('Does a combination of operations', () => {

        const prev: DrawingState = {
            backgrounds: [bg2, bg3, bg4],
            generalInfo: gi1,
            flowSystems: [ws2, ws1],
            calculationParams: cp1,
            entities: [],
            availableFixtures: [],
        };

        const next: DrawingState = {
            backgrounds: [bg1, bg2B],
            generalInfo: gi1,
            flowSystems: [ws1],
            calculationParams: cp1,
            entities: [],
            availableFixtures: [],
        };

        roundTripTest(prev, next);
    });


    it ('Does a combination of operations 2', () => {

        const prev: DrawingState = {
            backgrounds: [bg1, bg2B],
            generalInfo: gi2,
            flowSystems: [ws1],
            calculationParams: cp1,
            entities: [],
            availableFixtures: [],
        };

        const next: DrawingState = {
            backgrounds: [bg2, bg3, bg4],
            generalInfo: gi2,
            flowSystems: [ws2, ws1],
            calculationParams: cp1,
            entities: [],
            availableFixtures: [],
        };

        roundTripTest(prev, next);
    });

    it ('Detects a change in crop', () => {

        const prev: DrawingState = {
            backgrounds: [bg4B],
            generalInfo: gi3,
            flowSystems: [],
            calculationParams: cp1,
            entities: [],
            availableFixtures: [],
        };

        const next: DrawingState = {
            backgrounds: [bg4C],
            generalInfo: gi3,
            flowSystems: [],
            calculationParams: cp1,
            entities: [],
            availableFixtures: [],
        };

        roundTripTest(prev, next, 1);
    });
});
