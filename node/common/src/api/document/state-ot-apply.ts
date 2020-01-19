import * as _ from "lodash";
import { applyOpOntoStateVue } from "../../../../frontend/src/store/document/operation-transforms/state-ot-apply";
import { OperationTransformConcrete } from "./operation-transforms";
import { cloneSimple } from "../../lib/utils";
export function applyDiff(
    target: any,
    diff: any,
    set: (target: any, key: string, val: any) => void,
    del: (target: any, prop: string) => void
): any {
    if (diff === undefined || target === undefined) {
        throw new Error("Parent caller should have deleted the entry, not recurse");
    }

    if (_.isArray(diff)) {
        return cloneSimple(diff);
    } else if (_.isObject(diff)) {
        if (_.isArray(target) || !_.isObject(target)) {
            // convert those primitives and arrays into the object that it ought to be.
            target = {};
        }

        for (const key of Object.keys(diff)) {
            // we use {} to signal a deleted object (undefined is not valid JSON).
            if (_.isEqual((diff as any)[key], { deleted: true })) {
                if (target.hasOwnProperty(key)) {
                    del(target, key);
                }
            } else if (target.hasOwnProperty(key)) {
                (target as any)[key] = applyDiff((target as any)[key], (diff as any)[key], set, del);
            } else {
                set(target, key, (diff as any)[key]);
            }
        }
        return target;
    } else {
        return diff;
    }
}

export function applyDiffNative(target: any, diff: any) {
    return applyDiff(target, diff, (t, k, v) => t[k] = v, (t, p) => delete t[p]);
}
