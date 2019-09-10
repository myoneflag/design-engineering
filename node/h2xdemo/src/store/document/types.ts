import * as Operations from './operation-transforms/operation-transforms';
import {PaperSize, PIPE_SIZING_METHODS, PSD_METHODS, RING_MAIN_CALCULATION_METHODS} from '@/config';
import * as _ from 'lodash';

// Because of how the diffing engine works, there are restrictions on the data structure for the document state.
// Rules are:
// 1. Structure is to remain static, except naturally Arrays.
// 2. Objects in arrays must be the same type.
// 3. Objects with uids can be placed as direct array elements to take advantage of the update, add, and delete
//    operations.
// 4. 'uid' is a special field. Use it only as a uuid and for atomic objects where different operations on it
//    should be combined.

export interface Coord {
    x: number;
    y: number;
}

export interface Dimensions {
    w: number;
    h: number;
}

export interface Rectangle {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface WithID {
    uid: string;
}

export interface DrawableEntity extends WithID {
    parentUid: string | null;
    type: string;
}

export interface ConnectableEntity extends DrawableEntity {
    center: Coord;
    connections: string[];
}

export interface Background extends WithID {
    center: Coord;
    scaleName: string;
    scaleFactor: number;
    uri: string;
    crop: Rectangle;
    paperSize: PaperSize;
    rotation: number;

    // For scaling:
    pointA: Coord | null;
    pointB: Coord | null;

    // For replacing pdfs that need adjustments later:
    offset: Coord;

    // Backgrounds are part of PDFs and so may have many pages.
    page: number;
    totalPages: number;
}

/**
 * A drawing is a snapshot of a drawing - its shapes, pipes, fixtures, entities, title, etc, as is.
 */
export interface DrawingState {
    generalInfo: GeneralInfo;
    backgrounds: Background[];
    flowSystems: FlowSystemParameters[];
    calculationParams: CalculationParameters;
    entities: DrawableEntity[];
}

/**
 * A document is a drawing + all of its history and meta attributes.
 */
export interface DocumentState {
    // This is the drawing that we last received or last sent to the server.
    committedDrawing: DrawingState;
    // This is the current drawing that is connected in real time to vue components.
    // Operations are generated by diffing this view with the drawing state.
    drawing: DrawingState;

    optimisticHistory: Operations.OperationTransform[];
    // A list of operations that have been performed on the committedDrawing.
    // This implies that changes in the drawing state are not reflected in operations.
    // This also implies that changes are updated from the server.
    history: Operations.OperationTransform[];
    nextId: number;
}

export interface GeneralInfo {
    title: string;
    projectNumber: string;
    projectStage: string;
    designer: string;
    reviewed: string;
    approved: string;
    revision: number;
    client: string;
    description: string;
}

export interface Color {
    hex: string;
}

export interface FlowSystemParameters extends WithID {
    name: string;
    velocity: number;
    temperature: number;
    spareCapacity: number;
    material: string;
    color: Color;
}

export interface CalculationParameters {
    psdMethod: string;
    ringMainCalculationMethod: string;
    pipeSizingMethod: string;
}

export const initialDrawing: DrawingState = {
    generalInfo: {
        title: 'Untitled',
        projectNumber: '',
        projectStage: '',
        designer: '',
        reviewed: '',
        approved: '',
        revision: 1,
        client: '',
        description: '',
    },
    flowSystems: [
        // TODO: these values should get got from the database.
        {
            name: 'Cold Water',
            velocity: 10,
            temperature: 20,
            spareCapacity: 10,
            material : 'Material A',
            color: {hex: '#009CE0'},
            uid: 'jhrwekvgjuyh',
        },
        {
            name: 'Hot Water',
            velocity: 10,
            temperature: 60,
            spareCapacity: 10,
            material : 'Material B',
            color: {hex: '#F44E3B'},
            uid: 'ebhwujfbguiwehig',
        },
    ],
    calculationParams: {
        psdMethod: PSD_METHODS[0],
        ringMainCalculationMethod: RING_MAIN_CALCULATION_METHODS[0],
        pipeSizingMethod: PIPE_SIZING_METHODS[0],
    },
    backgrounds: [],
    entities: [],
};

export const initialValue: DocumentState = {
    committedDrawing: _.cloneDeep(initialDrawing),
    drawing: _.cloneDeep(initialDrawing),
    optimisticHistory: [],
    history: [],
    nextId: 1,
};
