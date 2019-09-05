import {DrawingState, WithID} from '@/store/document/types';
import * as OT from '@/store/document/operation-transforms/operation-transforms';
import * as _ from 'lodash';
import assert from 'assert';
import {findOptimalSwaps} from '@/store/document/operation-transforms/uid-lis';


// Assumptions for the states:
// 1. All items are either objects, lists or primitives.
// 2. No 2D lists.
// 3. Type structures are the same in both. IE. where there is a list in one key in one, there is a list in the other,
// 4. Lists contain items of the same type.
// 5. Lists containing items with uids are ordered and mutable indexed by uuid, while lists with items without UUID
//    are single atomic objects and should be replaced entirely instead of mutate.
// 6. Input objects are the same type. Because the entire object and every field is typed, it means every sub-object
//    will have the same fields.

export const equalState = (prev: any, next: any): boolean => {
    if (_.isArray(prev)) {
        if (prev.length !== next.length) {
            return false;
        }

        for (let i = 0; i < prev.length; i++) {
            if (!equalState(prev[i], next[i])) {
                return false;
            }
        }
        return true;
    } else if (_.isObject(prev)) {
        _.forOwn(prev, (value, key) => {
            if (!equalState(value, next[key])) {
                return false;
            }
        });
        return true;
    } else {
        return prev === next;
    }
};


// Create the diff object of only fields, terminating at arrays. Arrays with id objects are ignored, while arrays with
// regular objects are included.
function getExistingValuesOfDiff(prev: any, result: any) {
    if (_.isArray(prev)) {
        if (prev.length === 0 && result.length === 0) {
            return undefined;
        }
        if (prev.length && _.has(prev[0], 'uid')) {
            return undefined;
        }
        if (result.length && _.has(result[0], 'uid')) {
            return undefined;
        }
        if (_.isEqual(prev, result)) {
            return undefined;
        } else {
            return prev;
        }
    } else if (_.isObject(prev)) {
        const diff: any = {};
        _.forOwn(prev, (value, key) => {
            if (_.has(result, key)) {
                const cdiff = getExistingValuesOfDiff(value, (result as any)[key]);
                if (cdiff !== undefined && !_.isEmpty(cdiff)) {
                    diff[key] = cdiff;
                }
            }
        });
        return diff;
    } else {
        return _.cloneDeep(prev);
    }
}

// Create the diff object of only fields, terminating at arrays. Arrays with id objects are ignored, while arrays with
// regular objects are included.
function diffFieldsOnly(prev: any, next: any) {
    if (_.isArray(prev)) {
        if (prev.length === 0 && next.length === 0) {
            return undefined;
        }
        if (prev.length && _.has(prev[0], 'uid')) {
            return undefined;
        }
        if (next.length && _.has(next[0], 'uid')) {
            return undefined;
        }
        if (_.isEqual(prev, next)) {
            return undefined;
        } else {
            return next;
        }
    } else if (_.isObject(prev)) {
        const diff: any = {};
        _.forOwn(prev, (value, key) => {
            const cdiff = diffFieldsOnly(value, next[key]);
            if (cdiff !== undefined && !_.isEmpty(cdiff)) {
                diff[key] = cdiff;
            }
        });
        return diff;
    } else {
        if (prev !== next) {
            return _.cloneDeep(next);
        } else {
            return undefined;
        }
    }
}

function prefixObject(obj: any, key: string) : any {
    const newObj: any = {};
    newObj[key] = obj;
    return newObj;
}

function prefixOperation(op: OT.OperationTransform, key: string): OT.OperationTransform {
    if (op.type === OT.OPERATION_NAMES.ADD_OPERATION || op.type === OT.OPERATION_NAMES.DELETE_OPERATION) {
        const top = op as OT.AddOperation;
        top.object = prefixObject(top.object, key);
        return top;
    } else if (op.type === OT.OPERATION_NAMES.UPDATE_OPERATION) {
        const top = op as OT.UpdateOperation;
        top.before = prefixObject(top.before, key);
        top.after = prefixObject(top.after, key);
        return top;
    } else if (op.type === OT.OPERATION_NAMES.MOVE_OPERATION) {
        const top = op as OT.MoveOperation;
        top.reference = prefixObject(top.reference, key);
        return top;
    } else {
        throw new Error('Invalid operation type');
    }
}

function diffUidObjects(prev: any, next: any): OT.OperationTransform[] {
    if (_.isArray(prev)) {
        const results: OT.OperationTransform[] = [];
        assert(_.isArray(next));
        if (prev.length === 0 && next.length === 0) {
            return [];
        } else if (prev.length  && _.has(prev[0], 'uid') || (next.length && _.has(next[0], 'uid'))) {
            const inOld: string[] = prev.map((v) => v.uid);
            const inNew: string[] = next.map((v: WithID) => v.uid);

            // Find deletions and additions
            const prevCopy = _.cloneDeep(prev);
            const deletions = inOld.filter((v) => inNew.indexOf(v) === -1);
            const insertions = inNew.filter((v) => inOld.indexOf(v) === -1);

            deletions.forEach((v) => {
                const oldObjIdx = prevCopy.findIndex((vv: WithID) => vv.uid === v);
                const op: OT.DeleteOperation = {
                    id: -1,
                    object: prevCopy[oldObjIdx],
                    index: oldObjIdx,
                    type: OT.OPERATION_NAMES.DELETE_OPERATION,
                };
                inOld.splice(oldObjIdx, 1);
                prevCopy.splice(oldObjIdx, 1);
                results.push(op);
            });


            // Now that new elements overlap the old, let's diff them.
            inOld.forEach((v) => {
                const oldObj = prev.find((vv: WithID) => vv.uid === v);
                const newObj = next.find((vv: WithID) => vv.uid === v);
                if (!_.isEqual(oldObj, newObj)) {
                    const op: OT.UpdateOperation = {
                        after: _.clone(newObj),
                        before: _.clone(oldObj),
                        id: -1,
                        type: OT.OPERATION_NAMES.UPDATE_OPERATION,
                    };
                    results.push(op);
                }
            });

            // Insertions now
            insertions.forEach((v) => {
                const op: OT.AddOperation = {
                    object: next.find((vv: WithID) => vv.uid === v),
                    type: OT.OPERATION_NAMES.ADD_OPERATION,
                    id: -1,
                };
                inOld.push(v);
                results.push(op);
            });


            // Do the LCM thing for reordering.
            const result = findOptimalSwaps(inOld, inNew);

            result.forEach(([uid, index]) => {
                const op: OT.MoveOperation = {
                    id: -1,
                    index,
                    reference: {uid},
                    type: OT.OPERATION_NAMES.MOVE_OPERATION,
                };
                // There is theoretically no need to modify inOld now but let's do it for completeness sake
                inOld.splice(inOld.indexOf(uid), 1);
                inOld.splice(index, 0, uid);

                results.push(op);
            });
            return results;
        } else {
            return [];
        }
    }  else if (_.isObject(prev)) {
        const results: OT.OperationTransform[] = [];
        _.forOwn(prev, (value, key) => {
            diffUidObjects(value, next[key]).forEach((v) => {
                results.push(prefixOperation(v, key));
            });
        });
        return results;
    } else {
        return [];
    }
}

// We want to keep this function general so we don't have to modify it too much as we design the state.
// We will keep track of field-to-field diffs, up to objects that have a uid. Then, the whole object
// is considered atomic and we should compare for equality on the whole object.
//
export const diffState = (prev: DrawingState, next: DrawingState): OT.OperationTransform[] => {
    // get value diffs
    let results: OT.OperationTransform[] = [];
    const fieldDeepDiff = diffFieldsOnly(prev, next);
    if (!_.isEmpty(fieldDeepDiff)) {
        const op: OT.UpdateOperation = {
            after: fieldDeepDiff,
            before: getExistingValuesOfDiff(prev, fieldDeepDiff),
            id: 0,
            type: OT.OPERATION_NAMES.UPDATE_OPERATION,
        };
        results.push(op);
    }

    results.push(...diffUidObjects(prev, next));

    // get diffs of each array that has id'd elements.
    return results;
};
