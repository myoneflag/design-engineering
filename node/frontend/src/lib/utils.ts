/* tslint:disable:no-bitwise */

import * as _ from "lodash";
import { EPS } from "../../src/calculations/pressure-drops";
import { Catalog } from "../store/catalog/types";
import { interpolateTable, parseCatalogNumberExact } from "../htmlcanvas/lib/utils";

export const lighten = (col: string, percent: number, alpha: number = 1.0) => {
    const num = parseInt(col.substr(1), 16);

    let b = num & 0xff;
    let g = (num >> 8) & 0xff;
    let r = (num >> 16) & 0xff;

    if (percent < 0) {
        // darken
        b *= (100 + percent) / 100;
        g *= (100 + percent) / 100;
        r *= (100 + percent) / 100;
    } else {
        // lighten
        b += (255 - b) * (percent / 100);
        g += (255 - g) * (percent / 100);
        r += (255 - r) * (percent / 100);
    }

    if (alpha === 1) {
        let str = ((r << 16) | (g << 8) | (b << 0)).toString(16);
        while (str.length < 6) {
            str = "0" + str;
        }
        return "#" + str;
    } else {
        return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
    }
};

export function grayscale(col: string) {
    const num = parseInt(col.substr(1), 16);

    let b = num & 0xff;
    let g = (num >> 8) & 0xff;
    let r = (num >> 16) & 0xff;

    const avg = (b + g + r) / 3;

    b = g = r = avg;
    let str = ((r << 16) | (g << 8) | (b << 0)).toString(16);
    while (str.length < 6) {
        str = "0" + str;
    }
    return "#" + str;
}

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

export function canonizeAngleRad(a: number) {
    return ((((a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
}

export function angleDiffRad(a: number, b: number) {
    return canonizeAngleRad(a - b);
}

export function angleDiffDeg(a: number, b: number) {
    return ((a - b + (180 % 360) + 360) % 360) - 180;
}

export function isRightAngleRad(a: number, tolerance: number = EPS) {
    return angleDiffRad(canonizeAngleRad(a), Math.PI / 2) <= tolerance;
}

export function isStraightRad(a: number, tolerance: number = EPS) {
    return angleDiffRad(canonizeAngleRad(a), Math.PI) <= tolerance;
}

export function isAcuteRad(a: number, tolerance: number = EPS) {
    return canonizeAngleRad(a) <= Math.PI / 2 + tolerance;
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

export function setPropertyByString(obj: any, s: string, val: any) {
    s = s.replace(/\[(\w+)\]/g, ".$1"); // convert indexes to properties
    s = s.replace(/^\./, ""); // strip a leading dot
    const a = s.split(".");
    for (let i = 0, n = a.length; i < n; ++i) {
        const k = a[i];
        if (i === a.length - 1) {
            obj[k] = val;
        } else {
            obj = obj[k];
        }
    }
}

export function getValveK(catalogId: string, catalog: Catalog, pipeDiameterMM: number): number | null {
    const table = catalog.valves[catalogId].valvesBySize;
    return interpolateTable(table, pipeDiameterMM, false, (v) => parseCatalogNumberExact(v.kValue));
}
