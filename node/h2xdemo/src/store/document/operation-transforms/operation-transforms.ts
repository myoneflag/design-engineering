export interface OperationTransform {
    id: number;
    type: OPERATION_NAMES;
}

export enum OPERATION_NAMES {
    UPDATE_OPERATION = 'UPDATE_OPERATION',
    ADD_OPERATION = 'ADD_OPERATION',
    MOVE_OPERATION = 'MOVE_OPERATION',
    DELETE_OPERATION = 'DELETE_OPERATION',
    COMMITTED_OPERATION = 'COMMITTED_OPERATION',
}

// the before, after and object objects contain the object embedded in its address,
export interface UpdateOperation extends OperationTransform {
    type: OPERATION_NAMES.UPDATE_OPERATION;
    before: any;
    after: any;
}

export interface AddOperation extends OperationTransform {
    type: OPERATION_NAMES.ADD_OPERATION;
    object: any;
}

export interface MoveOperation extends OperationTransform {
    type: OPERATION_NAMES.MOVE_OPERATION;
    reference: any;
    // the array index to move to AFTER the item has been spliced for removing.
    index: number;
}

export interface DeleteOperation extends OperationTransform {
    type: OPERATION_NAMES.DELETE_OPERATION;
    // We need the original object in order to make an undo operation.
    object: any;
    index: number;
}

export interface CommittedOperation extends OperationTransform {
    type: OPERATION_NAMES.COMMITTED_OPERATION;
}
