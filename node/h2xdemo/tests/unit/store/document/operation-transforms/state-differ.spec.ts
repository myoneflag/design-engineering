import { expect } from 'chai';
import {ViewPort} from '@/htmlcanvas/viewport';
import {findOptimalSwaps, longestIncreasingSubsequence} from '@/store/document/operation-transforms/uid-lis';
import * as _ from 'lodash';
import {diffState} from '@/store/document/operation-transforms/state-differ';
import {applyOtOnState} from '@/store/document/operation-transforms/state-ot-apply';
import {Background, DrawingState} from '@/store/document/types';

function roundTripTest(prev: DrawingState, next: DrawingState, expectedOps: number = -1) {
    const prevCopy = _.clone(prev);
    const ops = diffState(prev, next);
    ops.forEach((o) => applyOtOnState(prevCopy, o));
    expect(prevCopy).eql(next);
    if (expectedOps != -1) {
        expect(ops.length).eq(expectedOps);
    }
}

const bg1: Background = {
    center: {x: 1, y: 2},
    crop: {x: -1, y: 2.4, w: 100, h: 101},
    offset: {x: 1, y: 2},
    page: 0,
    paperSize: {
        name: 'awwefew',
        width: 12,
        height: 200,
    },
    pointA: {x: -1, y: 2},
    pointB: {x: 3, y: 5},
    rotation: 12,
    scaleFactor: 1,
    scaleName: '1:200',
    totalPages: 100,
    uid: 'uid1',
    uri: 'awuhevgfyhwe',
};


const bg2: Background = {
    center: {x: 1, y: 2},
    crop: {x: -1, y: 2.5, w: 100, h: 101},
    offset: {x: 1, y: 2},
    page: 0,
    paperSize: {
        name: 'asdf',
        width: 100,
        height: 200,
    },
    pointA: {x: -1, y: 2},
    pointB: {x: 3, y: 4},
    rotation: 12,
    scaleFactor: 1,
    scaleName: '1:200',
    totalPages: 100,
    uid: 'uid2',
    uri: 'awuhevgfyhwe',
};

const bg2B: Background = {
    center: {x: 1, y: 2},
    crop: {x: -1, y: 2.5, w: 100, h: 101},
    offset: {x: 1, y: 2},
    page: 0,
    paperSize: {
        name: 'asdf',
        width: 100,
        height: 200,
    },
    pointA: {x: -1, y: 2},
    pointB: {x: 3, y: 4},
    rotation: 12,
    scaleFactor: 1,
    scaleName: '1:200',
    totalPages: 100,
    uid: 'uid2',
    uri: 'wefjnwkeifjw',
};

const bg3: Background = {
    center: {x: 100, y: 2},
    crop: {x: -1, y: 2.5, w: 100, h: 101},
    offset: {x: 1, y: 4},
    page: 0,
    paperSize: {
        name: 'asdf',
        width: 100,
        height: 200,
    },
    pointA: {x: -1, y: 2},
    pointB: {x: 3, y: 4},
    rotation: 12,
    scaleFactor: 1,
    scaleName: '1:200',
    totalPages: 100,
    uid: 'uid3',
    uri: 'gerreger',
};


const bg3B: Background = {
    center: {x: 100, y: 2},
    crop: {x: -1, y: 2.5, w: 100, h: 101},
    offset: {x: 1, y: 4},
    page: 0,
    paperSize: {
        name: 'asdf',
        width: 100,
        height: 200,
    },
    pointA: {x: -1, y: 2},
    pointB: {x: 3, y: 4},
    rotation: 12,
    scaleFactor: 1,
    scaleName: '1:200',
    totalPages: 100,
    uid: 'uid3',
    uri: 'wkefnkwenf',
};


const bg4: Background = {
    center: {x: 100, y: 2},
    crop: {x: -1, y: 2.5, w: 100, h: 101},
    offset: {x: 1, y: 4},
    page: 0,
    paperSize: {
        name: 'asdf',
        width: 100,
        height: 200,
    },
    pointA: {x: -1, y: 2},
    pointB: {x: 3, y: 4},
    rotation: 12,
    scaleFactor: 1,
    scaleName: '1:200',
    totalPages: 100,
    uid: 'uid4',
    uri: 'ewoikfkweo',
};

const bg4B: Background = {
    center: {x: 100, y: 2},
    crop: {x: -1, y: 2.5, w: 10, h: 101},
    offset: {x: 1, y: 4},
    page: 0,
    paperSize: {
        name: 'asdf',
        width: 100,
        height: 200,
    },
    pointA: {x: -1, y: 2},
    pointB: {x: 3, y: 4},
    rotation: 12,
    scaleFactor: 1,
    scaleName: '1:200',
    totalPages: 100,
    uid: 'uid4',
    uri: 'fwkemfewpokfowe',
};

const bg4C: Background = {
    center: {x: 100, y: 2},
    crop: {x: -1, y: 2.0, w: 10, h: 101},
    offset: {x: 1, y: 4},
    page: 0,
    paperSize: {
        name: 'asdf',
        width: 100,
        height: 200,
    },
    pointA: {x: -1, y: 2},
    pointB: {x: 3, y: 4},
    rotation: 12,
    scaleFactor: 1,
    scaleName: '1:200',
    totalPages: 100,
    uid: 'uid4',
    uri: 'fwkemfewpokfowe',
};

describe('state-differ.ts', () => {
    it('does not emit on no change', () => {

        const prev: DrawingState = {
            backgrounds: [bg2],
            title: 'whbfhewj',
        };

        const next: DrawingState = {
            backgrounds: [bg2],
            title: 'whbfhewj',
        };

        roundTripTest(prev, next, 0);
    });

    it ('emits a change for static properties', () => {

        const prev: DrawingState = {
            backgrounds: [],
            title: 'whbfhewj',
        };

        const next: DrawingState = {
            backgrounds: [],
            title: 'whbfhewjqwjkndkqw',
        };

        roundTripTest(prev, next, 1);
    });

    it ('adds to lists', () => {

        const prev: DrawingState = {
            backgrounds: [],
            title: 'whbfhewj',
        };

        const next: DrawingState = {
            backgrounds: [bg2],
            title: 'whbfhewj',
        };

        roundTripTest(prev, next, 1);
    });

    it ('removes from lists', () => {

        const prev: DrawingState = {
            backgrounds: [bg1, bg2, bg3],
            title: 'whbfhewj',
        };

        const next: DrawingState = {
            backgrounds: [],
            title: 'whbfhewj',
        };

        roundTripTest(prev, next, 3);
    });


    it ('Updates from lists', () => {

        const prev: DrawingState = {
            backgrounds: [bg2],
            title: 'whbfhewj',
        };

        const next: DrawingState = {
            backgrounds: [bg2B],
            title: 'whbfhewj',
        };

        roundTripTest(prev, next, 1);
    });

    it ('Moves within lists', () => {

        const prev: DrawingState = {
            backgrounds: [bg1, bg2, bg3],
            title: 'whbfhewj',
        };

        const next: DrawingState = {
            backgrounds: [bg2, bg3, bg1],
            title: 'whbfhewj',
        };

        roundTripTest(prev, next, 1);
    });

    it ('Moves within lists 2', () => {

        const prev: DrawingState = {
            backgrounds: [bg2, bg3, bg1],
            title: 'whbfhewj',
        };

        const next: DrawingState = {
            backgrounds: [bg1, bg2, bg3],
            title: 'whbfhewj',
        };

        roundTripTest(prev, next, 1);
    });

    it ('Does a combination of operations', () => {

        const prev: DrawingState = {
            backgrounds: [bg2, bg3, bg4],
            title: 'whbfhewj',
        };

        const next: DrawingState = {
            backgrounds: [bg1, bg2B],
            title: 'whbfhewj',
        };

        roundTripTest(prev, next);
    });


    it ('Does a combination of operations 2', () => {

        const prev: DrawingState = {
            backgrounds: [bg1, bg2B],
            title: 'whbfhewj',
        };

        const next: DrawingState = {
            backgrounds: [bg2, bg3, bg4],
            title: 'whbfhewj',
        };

        roundTripTest(prev, next);
    });

    it ('Detects a change in crop', () => {

        const prev: DrawingState = {
            backgrounds: [bg4B],
            title: 'whbfhewj',
        };

        const next: DrawingState = {
            backgrounds: [bg4C],
            title: 'whbfhewj',
        };

        roundTripTest(prev, next, 1);
    });
});
