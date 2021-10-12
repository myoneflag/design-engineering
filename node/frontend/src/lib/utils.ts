/* tslint:disable:no-bitwise */

import { Catalog } from "../../../common/src/api/catalog/types";
import { cloneSimple, interpolateTable, parseCatalogNumberExact } from "../../../common/src/lib/utils";
import BaseBackedObject from "../htmlcanvas/lib/base-backed-object";
import { CalculationFilters, DocumentState } from "../store/document/types";
import { getFields } from "../calculations/utils";
import { getEntityName } from "../../../common/src/api/document/entities/types";
import Vue from 'vue';
import { Color } from "../../../common/src/api/document/drawing";
import { assertUnreachable } from "../../../common/src/api/config";
import * as _ from "lodash";
import { WarningType } from "./types";

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

export function getEffectiveFilter(objects: BaseBackedObject[], calculationFilters: CalculationFilters, document: DocumentState, catalog: Catalog) {
    const build: CalculationFilters = {};

    const existing = cloneSimple(calculationFilters);

    const wasInserted = new Set<string>();
    const hasEnabled = new Set<string>();

    objects.forEach((o) => {
        let fields = getFields(o.entity, document, o.globalStore, catalog);
        switch (document.uiState.pressureOrDrainage) {
            case "pressure":
                fields = fields.filter((f) => f.layouts === undefined || f.layouts.includes('pressure'));
                break;
            case "drainage":
                fields = fields.filter((f) => f.layouts !== undefined && f.layouts.includes('drainage'));
                break;
            default:
                assertUnreachable(document.uiState.pressureOrDrainage);
        }

        const eName = getEntityName(o.entity);

        if (!(eName in build)) {
            Vue.set(build, eName, {
                name: eName,
                filters: {},
                enabled: false
            });
            wasInserted.add(eName);
        }

        fields.forEach((f) => {
            if (!(f.title in build[eName].filters)) {
                Vue.set(build[eName].filters, f.title, {
                    name: f.title,
                    value: false
                });
                if (f.defaultEnabled) {
                    build[eName].filters[f.title].enabled = true;
                    hasEnabled.add(eName);
                }
            }
        });
    });

    for (const eName of Array.from(wasInserted.values())) {
        if (hasEnabled.has(eName)) {
            build[eName].enabled = true;
        }
    }

    for (const eName in existing) {
        if (eName in build && existing.hasOwnProperty(eName)) {
            for (const prop in existing[eName].filters) {
                if (prop in build[eName].filters) {
                    build[eName].filters[prop].enabled = existing[eName].filters[prop].enabled;
                }
            }
            build[eName].enabled = existing[eName].enabled;
        }
    }
    return build;
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

/* Get tree data of Warnings */
export function getTreeDataOfWarnings(
    warnings: WarningType[],
    showHiddenWarnings: boolean,
    hiddenIds: Array<string>
): any {
    let treeData = [];
    let warningsByLevel = _.groupBy(
        warnings.filter((e) => showHiddenWarnings || !hiddenIds.includes(e.id)), "level"
    );
    for (const level in warningsByLevel) {
        let levelData = {
            name: level,
            count: warningsByLevel[level].length,
            visible: true,
            data: [],
        };
        let levelDataByType = _.groupBy(warningsByLevel[level], "type");
        for (const type in levelDataByType) {
            let typeData = levelDataByType[type].map((e) => ({
                ...e,
                label: e.warning,
                _rowVariant: hiddenIds.includes(e.id) ? 'hidden' : '',
            }));
            if (typeData.length > 1) {
                const hidden = !_.difference(typeData.map((e) => e.id), hiddenIds).length;
                (levelData.data as any).push({
                    label: type,
                    description: "",
                    hidden,
                    children: typeData,
                    _rowVariant: hidden ? 'hidden' : '',
                });
            } else {
                (levelData.data as any).push({
                    ...typeData[0],
                    label: type, // typeData[0].warning
                    children: [],
                    _rowVariant: hiddenIds.includes(typeData[0].id) ? 'hidden' : '',
                });
            }
        };
        treeData.push(levelData);
    }
    return treeData;
}
