import * as _ from 'lodash';
import {cloneSimple} from "../../../lib/utils";
import {OPERATION_NAMES, OperationTransformConcrete} from "./operation-transforms";

// Returns the diff object. If no diff, returns undefined.
export function diffObject(before: any, after: any, filter: any): any {
    if (before === undefined || after === undefined) {
        console.log(JSON.stringify(before) + ' ' + JSON.stringify(after));
        throw new Error('Parent caller shouldn\'t have recursed');
    }

    if (_.isArray(before)) {
        if (_.isArray(after)) {

            if (_.isEqual(before, after)) {
                return undefined;
            }
        }

        return cloneSimple(after);
    } else if (_.isObject(before)) {
        if (_.isArray(after)) {
            return after;
        } else if (_.isObject(after)) {

            const result: any = {};
            let toIter: string[] = [];
            if (filter) {
                toIter = Object.keys(filter);
            } else {
                const s = new Set<string>([...Object.keys(before), ...Object.keys(after)]);
                toIter = Array.from(s.values());
            }

            for (const key of toIter) {
                if (before.hasOwnProperty(key) && after.hasOwnProperty(key)) {
                    const val = diffObject((before as any)[key], (after as any)[key], filter ? filter[key] : undefined);
                    if (val !== undefined) {
                        result[key] = val;
                    }
                } else if (before.hasOwnProperty(key)) {
                    // deleted item
                    result[key] = undefined;
                } else if (after.hasOwnProperty(key)) {
                    // new item
                    result[key] = (after as any)[key];
                } else {
                    // extraneous filter - ignore.
                }
            }

            return _.isEmpty(result) ? undefined : result;
        } else {
            return after;
        }

    } else {
        // primitive
        if (before === after) {
            return undefined;
        }
        return after;
    }
}

export function diffState(before: any, after: any, filter: any): OperationTransformConcrete[] {
    const diff = diffObject(before, after, filter);
    if (diff === undefined) {
        return [];
    }
    return [
        {
            type: OPERATION_NAMES.DIFF_OPERATION,
            diff,
            inverse: diffObject(after, before, filter),
            id: -1,
        }
    ];
}
