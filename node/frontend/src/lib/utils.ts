import Vue from 'vue';
import { Catalog } from "../../../common/src/api/catalog/types";
import { interpolateTable, parseCatalogNumberExact } from "../../../common/src/lib/utils";
import { Color } from "../../../common/src/api/document/drawing";
import _ from "lodash";

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

export function color2rgb(color: Color): { r: number, g: number, b: number } {
    const num = parseInt(color.hex.substr(1), 16);
    return {
        r: (num >> 16) & 0xff,
        g: (num >> 8) & 0xff,
        b: (num >> 0) & 0xff,
    };
}

export function rgb2color(rgb: { r: number, g: number, b: number }): Color {
    let str = ((rgb.r << 16) | (rgb.g << 8) | (rgb.b << 0)).toString(16);
    return { hex: '#' + str };
}

export function rgb2style(rgb: { r: number, g: number, b: number }, a?: number): string {
    if (a === undefined || a === 1) {
        const str = ((rgb.r << 16) | (rgb.g << 8) | (rgb.b << 0)).toString(16);
        return '#' + str;
    } else {
        return "rgba(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ", " + a + ")";
    }
}

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

export function setPropertyByString(obj: any, s: string, val: any, existential: boolean = false): boolean {
    let hasChanged = true;

    s = s.replace(/\[(\w+)\]/g, ".$1"); // convert indexes to properties
    s = s.replace(/^\./, ""); // strip a leading dot
    const a = s.split(".");
    for (let i = 0, n = a.length; i < n; ++i) {
        const k = a[i];
        if (i === a.length - 1) {
            hasChanged = (obj[k] !== val);
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

    return hasChanged;
}

export function setPropertyByStringVue(obj: any, s: string, val: any) {
    s = s.replace(/\[(\w+)\]/g, ".$1"); // convert indexes to properties
    s = s.replace(/^\./, ""); // strip a leading dot
    const a = s.split(".");
    for (let i = 0, n = a.length; i < n; ++i) {
        const k = a[i];
        if (i === a.length - 1) {
            Vue.set(obj, k, val);
        } else {
            let newObj = obj[k];
            if (newObj == null) {
                newObj = {};
                Vue.set(obj, k, newObj);
            }
            obj = newObj;
        }
    }
}


export function getValveK(catalogId: string, catalog: Catalog, pipeDiameterMM: number): number | null {
    const table = catalog.valves[catalogId].valvesBySize;
    return interpolateTable(table, pipeDiameterMM, false, (v) => parseCatalogNumberExact(v.kValue));
}

export function getNextPipeSize(currentSize: number, pipeSizes: number[]): number {
    pipeSizes.sort((a, b) => (a - b)); // To make sure the sizes are sorted from low to high

    let newPipeSize = 0;
    for (const size of pipeSizes) {
        if (size > currentSize) {
            newPipeSize = size;
            break;
        }
    }

    return newPipeSize;
}

export function getFixedStringValue(value: string | number | null, fixed: number = 3): string {
    if (!value) {
        return '';
    }
    return parseFloat(Number(value).toFixed(fixed)).toString();
}

export function getCertainDecimalNumber(value: number, fixed: number = 3): number {
    return Math.ceil(value * Math.pow(10, fixed)) / Math.pow(10, fixed);
}
