export interface OperationTransform {
    id: number;
    type: string;
}

export const OPERATION_NAMES = {
    UPDATE_OPERATION: 'UPDATE_OPERATION',
    ADD_OPERATION: 'ADD_OPERATION',
    MOVE_OPERATION: 'MOVE_OPERATION',
    DELETE_OPERATION: 'DELETE_OPERATION',
};


// the before, after and object objects contain the object embedded in its address,
export interface UpdateOperation extends OperationTransform {
    before: any;
    after: any;
}

export interface AddOperation extends OperationTransform {
    object: any;
}

export interface MoveOperation extends OperationTransform {
    reference: any;
    // the array index to move to AFTER the item has been spliced for removing.
    index: number;
}

export interface DeleteOperation extends OperationTransform {
    // We need the original object in order to make an undo operation.
    object: any;
    index: number;
}
