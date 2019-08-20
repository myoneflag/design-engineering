import * as Operations from './operationTransforms';
import Doc = Mocha.reporters.Doc;
/**
 * A drawing is a snapshot of a drawing - its shapes, pipes, fixtures, entities, title, etc, as is.
 */
export interface DrawingState {
    title: string;

    background: {
        centerX: number;
        centerY: number;
        paper: string;
        uri: string;
        scale: number;
        paperScale: string;
        crop: {
            x: number;
            y: number;
            w: number;
            h: number;
        };
    };

    paper: {
        name: string;
        scale: string;
    };
}

/**
 * A document is a drawing + all of its history and meta attributes.
 */
export interface DocumentState {
    drawing: DrawingState;
    history: Operations.OperationTransform[];
    lastOrder: number;
    isOpen: boolean;
}

export const initialValue: DocumentState = {
    drawing: {
        title: 'Your First Project',
        background: {
            centerX: 0,
            centerY: 0,
            paper: 'A1',
            uri: '',
            scale: 1,
            paperScale: "1:100",
            crop: {
                x: 0,
                y: 0,
                w: 0,
                h: 0,
            },
        },
        paper: {
            name: 'A1',
            scale: '1:100',
        },
    },
    history: [],
    lastOrder: 0,
    isOpen: false,
};
