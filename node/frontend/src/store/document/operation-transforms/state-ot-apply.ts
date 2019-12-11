import {DrawingState, WithID} from '../../../../src/store/document/types';
import * as OT from './operation-transforms';
import * as _ from 'lodash';
import assert from 'assert';
import Vue from 'vue';
import {cloneSimple} from '../../../../src/lib/utils';
import {DiffOperation, OperationTransformConcrete} from "./operation-transforms";


export function applyDiffVue(target: any, diff: any): any {

    if (diff === undefined || target === undefined) {
        throw new Error('Parent caller should have deleted the entry, not recurse');
    }

    if (_.isArray(diff)) {
        return diff;
    } else if (_.isObject(diff)) {
        for (const key of Object.keys(diff)) {
            if ((diff as any)[key] === undefined) {
                if (target.hasOwnProperty(key)) {
                    Vue.delete(target, key);
                }
            } else if (target.hasOwnProperty(key)) {
                (target as any)[key] = applyDiffVue((target as any)[key], (diff as any)[key]);
            } else {
                Vue.set(target, key, (diff as any)[key]);
            }
        }
        return target;
    } else {
        return diff;
    }
}

export function applyOtOnState(state: any, ops: DiffOperation) {
    applyDiffVue(state, ops.diff);
}
