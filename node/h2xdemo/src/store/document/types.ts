import * as Operations from './operationTransforms';
import Doc = Mocha.reporters.Doc;
/**
 * A drawing is a snapshot of a drawing - its shapes, pipes, fixtures, entities, title, etc, as is.
 */
export interface DrawingState {
    title: string;
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
    },
    history: [],
    lastOrder: 0,
    isOpen: false,
}
