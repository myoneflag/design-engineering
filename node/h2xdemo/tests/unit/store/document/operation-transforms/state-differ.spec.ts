import { expect } from 'chai';
import * as _ from 'lodash';
import {diffState} from '@/store/document/operation-transforms/state-differ';
import {applyOtOnState} from '@/store/document/operation-transforms/state-ot-apply';

import {
    Background,
    CalculationParameters,
    DrawingState,
    GeneralInfo,
    FlowSystemParameters,
} from '@/store/document/types';

function roundTripTest(prev: DrawingState, next: DrawingState, expectedOps: number = -1) {
    const prevCopy = _.cloneDeep(prev);
    const ops = diffState(prev, next);
    ops.forEach((o) => applyOtOnState(prevCopy, o));
    expect(prevCopy).eql(next);
    if (expectedOps !== -1) {
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
        widthMM: 12,
        heightMM: 200,
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
        widthMM: 100,
        heightMM: 200,
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
        widthMM: 100,
        heightMM: 200,
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
        widthMM: 100,
        heightMM: 200,
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

const bg4: Background = {
    center: {x: 100, y: 2},
    crop: {x: -1, y: 2.5, w: 100, h: 101},
    offset: {x: 1, y: 4},
    page: 0,
    paperSize: {
        name: 'asdf',
        widthMM: 100,
        heightMM: 200,
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
        widthMM: 100,
        heightMM: 200,
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
        widthMM: 100,
        heightMM: 200,
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

const gi1: GeneralInfo = {
    approved: '',
    client: '',
    description: '',
    designer: '',
    projectNumber: '',
    projectStage: '',
    reviewed: '',
    revision: 1,
    title: 'asdfwef',
};

const gi2: GeneralInfo = {
    approved: '',
    client: '',
    description: 'wefwe',
    designer: '',
    projectNumber: 'egreg',
    projectStage: '',
    reviewed: 'fewfwe',
    revision: 2,
    title: 'tkrjhnreigjmriofjer',
};

const gi3: GeneralInfo = {
    approved: '',
    client: '',
    description: 'wefwe',
    designer: '',
    projectNumber: 'egreg',
    projectStage: '',
    reviewed: '',
    revision: 3,
    title: '',
};

const ws1: FlowSystemParameters = {
    color: {hex: '#0000ff'},
    material: 'wat',
    name: 'the',
    spareCapacity: 0,
    temperature: 1,
    velocity: 0,
    uid: 'bweuyifgwe',
};

const ws2: FlowSystemParameters = {
    color: {hex: '#ff0000'},
    material: 'wat',
    name: 'the',
    spareCapacity: 0,
    temperature: 1,
    velocity: 1,
    uid: 'werfewjknfhwiejhb',
};

const cp1: CalculationParameters = {
    pipeSizingMethod: '', psdMethod: '', ringMainCalculationMethod: '',
};

describe('state-differ.ts', () => {
    it('does not emit on no change', () => {

        const prev: DrawingState = {
            backgrounds: [bg2],
            generalInfo: gi1,
            flowSystems: [ws1],
            calculationParams: cp1,
            entities: [],
        };

        const next: DrawingState = {
            backgrounds: [bg2],
            generalInfo: gi1,
            flowSystems: [ws1],
            calculationParams: cp1,
            entities: [],
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
        };

        const next: DrawingState = {
            backgrounds: [],
            generalInfo: gi2,
            flowSystems: [ws2],
            calculationParams: cp1,
            entities: [],
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
        };

        const next: DrawingState = {
            backgrounds: [bg2],
            generalInfo: gi1,
            flowSystems: [],
            calculationParams: cp1,
            entities: [],
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
        };

        const next: DrawingState = {
            backgrounds: [],
            generalInfo: gi1,
            flowSystems: [],
            calculationParams: cp1,
            entities: [],
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
        };

        const next: DrawingState = {
            backgrounds: [bg2B],
            generalInfo: gi1,
            flowSystems: [],
            calculationParams: cp1,
            entities: [],
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
        };

        const next: DrawingState = {
            backgrounds: [bg2, bg3, bg1],
            generalInfo: gi1,
            flowSystems: [],
            calculationParams: cp1,
            entities: [],
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
        };

        const next: DrawingState = {
            backgrounds: [bg1, bg2, bg3],
            generalInfo: gi1,
            flowSystems: [],
            calculationParams: cp1,
            entities: [],
        };

        roundTripTest(prev, next, 1);
    });

    it ('Does a single change in static array', () => {

        const prev: DrawingState = {
            backgrounds: [bg2, bg3, bg4],
            generalInfo: gi1,
            flowSystems: [ws2, ws2, ws1, ws1],
            calculationParams: cp1,
            entities: [],
        };

        const next: DrawingState = {
            backgrounds: [bg2, bg3, bg4],
            generalInfo: gi1,
            flowSystems: [ws2],
            calculationParams: cp1,
            entities: [],
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
        };

        const next: DrawingState = {
            backgrounds: [bg1, bg2B],
            generalInfo: gi1,
            flowSystems: [ws1],
            calculationParams: cp1,
            entities: [],
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
        };

        const next: DrawingState = {
            backgrounds: [bg2, bg3, bg4],
            generalInfo: gi2,
            flowSystems: [ws2, ws1],
            calculationParams: cp1,
            entities: [],
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
        };

        const next: DrawingState = {
            backgrounds: [bg4C],
            generalInfo: gi3,
            flowSystems: [],
            calculationParams: cp1,
            entities: [],
        };

        roundTripTest(prev, next, 1);
    });
});
