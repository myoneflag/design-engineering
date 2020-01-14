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
    key: string | null;
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
    fn: (entry: T) => string | number | null
): number | null;
// assumes keys in table are non overlapping
export function interpolateTable<T>(
    table: { [key: string]: T },
    index: number,
    strict: boolean = false,
    fn?: (entry: T) => string | number | null
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
