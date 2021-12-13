import * as _ from "lodash";

/**
 * A faster alternative to lodash cloneDeep for simple JOSN-like objects
 */
export function cloneSimple<T>(obj: T): T {
    if (_.isArray(obj)) {
        const res: any[] = [];
        obj.forEach((o) => {
            res.push(cloneSimple(o));
        });
        return (res as any) as T;
    } else if (_.isObject(obj)) {
        const res: any = {};
        for (const key of Object.keys(obj)) {
            res[key] = cloneSimple((obj as any)[key]);
        }
        return res;
    } else {
        return obj;
    }
}

export interface Choice {
    name: string;
    key: string | number | null;
    disabled?: boolean;
}

export function parseCatalogNumberOrMin(str: string | number | null): number | null {
    if (typeof str === "number") {
        return str;
    }
    if (str === null) {
        return null;
    }
    if (str.indexOf("-") !== -1) {
        const arr = str.split("-");
        if (arr.length > 2) {
            throw new Error("Dunno");
        }
        const n = Number(str.split("-")[0]);
        return isNaN(n) ? null : n;
    } else {
        const n = Number(str);
        return isNaN(n) ? null : n;
    }
}

export function parseCatalogNumberOrMax(str: string | number | null): number | null {
    if (typeof str === "number") {
        return str;
    }
    if (str === null) {
        return null;
    }
    if (str.indexOf("-") !== -1) {
        const arr = str.split("-");
        if (arr.length > 2) {
            throw new Error("Dunno");
        }
        const n = Number(str.split("-")[1]);
        return isNaN(n) ? null : n;
    } else {
        const n = Number(str);
        return isNaN(n) ? null : n;
    }
}

export function parseCatalogNumberExact(str: string | number | null): number | null {
    if (typeof str === "number") {
        return str;
    }
    if (str === null) {
        return null;
    }
    const n = Number(str);
    return isNaN(n) ? null : n;
}

export function interpolateTable<T>(
    table: { [key: string]: string | number },
    index: number,
    strict?: boolean
): number | null;
export function interpolateTable<T>(
    table: { [key: string]: T },
    index: number,
    strict: boolean,
    fn: (entry: T) => string | number | null,
): number | null;
// assumes keys in table are non overlapping
export function interpolateTable<T>(
    table: { [key: string]: T },
    index: number,
    strict: boolean = false,
    fn?: (entry: T) => string | number | null,
    implyZero: boolean = false,
): number | null {
    let lowKey = -Infinity;
    let highKey = Infinity;
    let lowValue = null;
    let highValue = null;

    for (const key of Object.keys(table)) {
        const min = parseCatalogNumberOrMin(key);
        const max = parseCatalogNumberOrMax(key);
        const value = fn ? parseCatalogNumberExact(fn(table[key])) : parseCatalogNumberExact(table[key] as any);
        if (value !== null) {
            if (min !== null && max !== null) {
                if (index >= min && index <= max) {
                    if (value !== null) {
                        return value;
                    }
                } else {
                    if (min > index && min < highKey) {
                        highKey = min;
                        highValue = value;
                    }
                    if (max < index && max >= lowKey) {
                        lowKey = max;
                        lowValue = value;
                    }
                }
            } else {
                throw new Error("table key not a number or range");
            }
        } else {
            throw new Error("table value not a number, cannot interpolate");
        }
    }

    if (lowValue === null) {
        if (highValue !== null) {
            return strict ? null : highValue;
        } else {
            return null;
        }
    } else if (highValue === null) {
        if (lowValue !== null) {
            return strict ? null : lowValue;
        } else {
            return null;
        }
    }

    const lw = (highKey - index) / (highKey - lowKey);
    const hw = (index - lowKey) / (highKey - lowKey);
    return lw * lowValue + hw * highValue;
}

// returns first table entry with key >= index
// assumes keys in table are non overlapping
export function lowerBoundTable<T>(
    table: { [key: string]: T },
    index: number,
    getVal?: (t: T, isMax?: boolean) => number
): T | null {
    let highKey = Infinity;
    let highValue: T | null = null;

    for (const key of Object.keys(table)) {
        const min = getVal ? getVal(table[key], false) : parseCatalogNumberOrMin(key);
        const max = getVal ? getVal(table[key], true) : parseCatalogNumberOrMax(key);
        const value = table[key];

        if (min === null || max === null) {
            throw new Error("key is not a number: " + key);
        }

        if (min <= index && max >= index) {
            return value;
        }

        if (min < highKey && min > index) {
            highKey = min;
            highValue = value;
        }
    }

    return highValue;
}

// returns last table entry with key <= index
// assumes keys in table are non overlapping
export function upperBoundTable<T>(
    table: { [key: string]: T },
    index: number,
    getVal?: (t: T, isMax?: boolean) => number
): T | null {
    let lowKey = -Infinity;
    let lowValue: T | null = null;

    for (const key of Object.keys(table)) {
        const min = getVal ? getVal(table[key], false) : parseCatalogNumberOrMin(key);
        const max = getVal ? getVal(table[key], true) : parseCatalogNumberOrMax(key);
        const value = table[key];

        if (min === null || max === null) {
            throw new Error("key is not a number: " + key);
        }

        if (min <= index && max >= index) {
            return value;
        }

        if (min <= index && Math.min(max, index) > lowKey) {
            lowKey = Math.min(max, index);
            lowValue = value;
        }
    }

    return lowValue;
}

export const EPS_ABS = 1e-8;
export const EPS = 1e-8;

export interface SelectField {
    value: number | string;
    text: string;
}

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepPartial<U>>
    : DeepPartial<T[P]>
};

export function lowerCase(str: string) {
    if (str.toUpperCase() === str) {
        return str;
    } else {
        return str.toLowerCase();
    }
}

function traverseAndFlatten(currentNode: object, target: object, flattenedKey?: string | number) {
    for (const key in currentNode) {
        if (currentNode.hasOwnProperty(key)) {
            let newKey;
            if (flattenedKey === undefined) {
                newKey = key;
            } else {
                newKey = flattenedKey + '.' + key;
            }

            const value = (currentNode as any)[key];
            if (typeof value === "object") {
                traverseAndFlatten(value, target, newKey);
            } else {
                (target as any)[newKey] = value;
            }
        }
    }
}

export function flatten(obj: object) {
    const flattenedObject = {};

    traverseAndFlatten(obj, flattenedObject, undefined);

    return flattenedObject;
}

export type KeysOfUnion<T> = T extends T ? keyof T : never;

/**
 * Get the next from goal
 * @param goal the number to be look
 * @param list the list of number or object to be look at
 * @param key the key in object if param `list` is in list of object
 * @param exact return same value as goal if present
 */
export const getNext = (goal: number, list: ({} | number)[], exact: boolean = false, key?: string): number | {} => {
    const isObject = typeof list[0] === 'object';

    if (isObject && !key) {
        throw new Error("Please provide key");
    }

    let condition;
    let extractCurrVal;
    let extractPrevVal;
    let min;
    return list.reduce((prev, curr) => {
        extractCurrVal = curr;
        extractPrevVal = prev;
        if (isObject) {
            extractCurrVal = getPropertyByString(curr, key!);
            extractPrevVal = getPropertyByString(prev, key!);
        }

        min = Math.min(extractCurrVal, extractPrevVal);
        condition = exact ? min >= goal : min > goal;

        if (condition) {
            return extractCurrVal < extractPrevVal ? curr : prev;
        } else {
            return extractCurrVal > extractPrevVal ? curr : prev;
        }
    });
}

export function getPropertyByString(obj: any, s: string, existential: boolean = false) {
    s = s.replace(/\[(\w+)\]/g, ".$1"); // convert indexes to properties
    s = s.replace(/^\./, ""); // strip a leading dot
    const a = s.split(".");
    for (let i = 0, n = a.length; i < n; ++i) {
        const k = a[i];
        if (existential) {
            if (obj) {
                obj = obj[k];
            }
        } else {
            obj = obj[k]; // ensure an error is thrown
        }
    }
    return obj;
}

export function setPropertyByString(obj: any, s: string, val: any, existential: boolean = false) {
    s = s.replace(/\[(\w+)\]/g, ".$1"); // convert indexes to properties
    s = s.replace(/^\./, ""); // strip a leading dot
    const a = s.split(".");
    for (let i = 0, n = a.length; i < n; ++i) {
        const k = a[i];
        if (i === a.length - 1) {
            obj[k] = val;
        } else {
            obj = obj[k];
            if (existential) {
                if (obj == null) {
                    obj = {};
                }
            }
        }
    }
}

export type Complete<T> = {
    [P in keyof Required<T>]: Complete<T[P]>;
}
