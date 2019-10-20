import {DrawingState, WithID} from '@/store/document/types';
import * as OT from './operation-transforms';
import * as _ from 'lodash';
import assert from 'assert';
import Vue from 'vue';
import {cloneSimple} from '@/lib/utils';

/**
 * Modifies the given state object *in place* with the given path and modifier function.
 * @param object
 * @param path
 * @param op A function that modifies a leaf node in place. Eg. Given an array, push and pop it. For primitives, though
 * you should return the new value and that's the only exception.
 */
function walkToEnds(object: any, path: any, op: (object: any, path: any)
    => string | number | undefined): string | number | undefined {
    if (_.isArray(object)) {
        // We stop here always.
        // If it is a literal array (without distinguishable elements, ie elemenets without uid) then we want to replace
        // it. If it is an itemed array, we want to give the operation a chance to modify it.
        op(object, path);
        return undefined;
    } else if (_.isObject(object)) {
        _.forOwn(path, (value, key) => {
            // @ts-ignore
            const val = walkToEnds((object as any)[key], path[key], op);
            if (val !== undefined) {
                // @ts-ignore;
                object[key] = val;
            }
        });
        return undefined;
    } else {
        return op(object, path);
    }
}

export const applyOtOnState = (state: DrawingState, op: OT.OperationTransform) => {
    if (op.type === OT.OPERATION_NAMES.ADD_OPERATION) {
        const top = op as OT.AddOperation;
        walkToEnds(state, top.object, (arr: any, obj: any): any => {
            assert(_.isArray(arr));
            arr.push(cloneSimple(obj));
        });
    } else if (op.type === OT.OPERATION_NAMES.MOVE_OPERATION) {
        const top = op as OT.MoveOperation;
        walkToEnds(state, top.reference, (arr: [], obj: any): any => {
            assert(_.isArray(arr));

            const itemIndex = arr.findIndex((v: WithID) => v.uid === obj.uid);
            const toMove = arr.splice(itemIndex, 1)[0];
            arr.splice(top.index, 0, toMove);
        });
    } else if (op.type === OT.OPERATION_NAMES.UPDATE_OPERATION) {
        const top = op as OT.UpdateOperation;
        walkToEnds(state, top.after, (arr: any, obj: any): any => {
            assert(_.isArray(arr) || !_.isObject(arr));

            if (_.isArray(arr)) {

                // we could be updating an entire array, OR we are updating an element in an uid array.
                if (_.isArray(obj)) {
                    arr.splice(0, arr.length, ...(cloneSimple(obj) as []));
                } else {
                    assert(_.has(obj, 'uid'));
                    const itemIndex = arr.findIndex((v: WithID) => v.uid === obj.uid);
                    Vue.set(arr, itemIndex, cloneSimple(obj));
                }
            } else {
                // We are updating a single primitive field.
                return obj;
            }
        });
    } else if (op.type === OT.OPERATION_NAMES.DELETE_OPERATION) {
        const top = op as OT.DeleteOperation;
        walkToEnds(state, top.object, (arr: [], obj: any): any => {
            assert(_.isArray(arr));

            const itemIndex = arr.findIndex((v: WithID) => v.uid === obj.uid);
            assert(itemIndex === top.index);
            arr.splice(itemIndex, 1);
        });
    }
};
