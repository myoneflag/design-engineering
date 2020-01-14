export interface OperationTransform {
    id: number;
    type: OPERATION_NAMES;
}

export type OperationTransformConcrete = DiffOperation | CommittedOperation;

export enum OPERATION_NAMES {
    DIFF_OPERATION = "DIFF_OPERATION",
    COMMITTED_OPERATION = "COMMITTED_OPERATION"
}

// the before, after and object objects contain the object embedded in its address,
export interface DiffOperation extends OperationTransform {
    type: OPERATION_NAMES.DIFF_OPERATION;
    diff: any;
    inverse: any;
}

// Committed separates logical chunks of operations for undo capabilities.
export interface CommittedOperation extends OperationTransform {
    type: OPERATION_NAMES.COMMITTED_OPERATION;
}
