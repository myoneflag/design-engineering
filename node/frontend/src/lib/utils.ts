/* tslint:disable:no-bitwise */

import { Catalog } from "../../../common/src/api/catalog/types";
import { cloneSimple, EPS, interpolateTable, parseCatalogNumberExact } from "../../../common/src/lib/utils";
import BaseBackedObject from "../htmlcanvas/lib/base-backed-object";
import { CalculationFilters, DocumentState } from "../store/document/types";
import { getFields } from "../calculations/utils";
import { getEntityName } from "../../../common/src/api/document/entities/types";
import Vue from 'vue';
import { Color } from "../../../common/src/api/document/drawing";

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

export function color2rgb(color: Color): {r: number, g: number, b: number} {
    const num = parseInt(color.hex.substr(1), 16);
    return {
        r: (num >> 16) & 0xff,
        g: (num >> 8) & 0xff,
        b: (num >> 0) & 0xff,
    };
}

export function rgb2color(rgb: {r: number, g: number, b: number}): Color {
    let str = ((rgb.r << 16) | (rgb.g << 8) | (rgb.b << 0)).toString(16);
    return {hex: '#' + str};
}

export function rgb2style(rgb: {r: number, g: number, b: number}, a?: number): string {
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
    return (
        Math.abs(angleDiffRad(canonizeAngleRad(a), Math.PI / 2)) <= tolerance ||
        Math.abs(angleDiffRad(canonizeAngleRad(a), -Math.PI / 2)) <= tolerance
    );
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

export function getValveK(catalogId: string, catalog: Catalog, pipeDiameterMM: number): number | null {
    const table = catalog.valves[catalogId].valvesBySize;
    return interpolateTable(table, pipeDiameterMM, false, (v) => parseCatalogNumberExact(v.kValue));
}

export function getEffectiveFilter(objects: BaseBackedObject[], calculationFilters: CalculationFilters,  document: DocumentState) {
    const build: CalculationFilters = {};

    const existing = cloneSimple(calculationFilters);

    objects.forEach((o) => {
        const fields = getFields(o.entity, document, o.globalStore);
        let wasInserted = false;
        if (!(o.entity.type in build)) {
            Vue.set(build, o.entity.type, {
                name: getEntityName(o.entity.type),
                filters: {},
                enabled: false
            });
            wasInserted = true;
        }

        let hasEnabled = false;
        fields.forEach((f) => {
            if (!(f.title in build[o.entity.type].filters)) {
                Vue.set(build[o.entity.type].filters, f.title, {
                    name: f.title,
                    value: false
                });
                if (f.defaultEnabled) {
                    build[o.entity.type].filters[f.title].enabled = true;
                    hasEnabled = true;
                }
            }
        });
        if (wasInserted && hasEnabled) {
            build[o.entity.type].enabled = true;
        }
    });

    for (const eType in existing) {
        if (eType in build && existing.hasOwnProperty(eType)) {
            for (const prop in existing[eType].filters) {
                if (prop in build[eType].filters) {
                    build[eType].filters[prop].enabled = existing[eType].filters[prop].enabled;
                }
            }
            build[eType].enabled = existing[eType].enabled;
        }
    }
    return build;
}
