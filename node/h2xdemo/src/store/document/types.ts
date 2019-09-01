import * as Operations from './operation-transforms';
import Doc = Mocha.reporters.Doc;
import {PaperSize} from '@/config';

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

export interface Selectable {
    selectId: string;
}

export interface Background extends Selectable {
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

    // Backgrounds are part of PDFs and so may have many pages.
    page: number;
    totalPages: number;
}

/**
 * A drawing is a snapshot of a drawing - its shapes, pipes, fixtures, entities, title, etc, as is.
 */
export interface DrawingState {
    title: string;
    backgrounds: Background[];
}

/**
 * A document is a drawing + all of its history and meta attributes.
 */
export interface DocumentState {
    drawing: DrawingState;
    history: Operations.OperationTransform[];
    nextId: number;
}

export const initialValue: DocumentState = {
    drawing: {
        title: 'Your First Project',
        backgrounds: [],
    },
    history: [],
    nextId: 1,
};
