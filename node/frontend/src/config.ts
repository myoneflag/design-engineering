// http://www.metrication.com/drafting/paper.html
import { Catalog } from "../../common/src/api/catalog/types";
import { SupportedDwellingStandards } from "../../common/src/api/config";
import { Choice, cloneSimple } from "../../common/src/lib/utils";

export const DEFAULT_FONT_NAME: string = "Helvetica";
export const DEFAULT_FONT_NAME_BOLD: string = "Helvetica-Bold";

export function isSupportedDwellingStandard(arg: any): arg is SupportedDwellingStandards {
    return Object.values(SupportedDwellingStandards).includes(arg);
}

// These are some temporary configs while we don't have a database yet.

export const DISPLAY_DWELLING_METHODS: Choice[] = [
    { name: "AS3500 2018 Dwellings", key: SupportedDwellingStandards.as35002018Dwellings },
    { name: "Barrie's Book Dwellings", key: SupportedDwellingStandards.barriesBookDwellings },
    { name: "None", key: null }
];

export function getDwellingMethods(catalog: Catalog): Choice[] {
    const methods: Choice[] = cloneSimple(DISPLAY_DWELLING_METHODS);

    for (const key of Object.keys(catalog.dwellingStandards)) {
        const standard = catalog.dwellingStandards[key];
        const index = methods.findIndex((p) => p.key === key);
        if (index === -1) {
            methods.push({
                disabled: false,
                key,
                name: standard.name
            });
        } else {
            methods[index].disabled = false;
        }
    }

    return methods;
}

export const PIPE_HEIGHT_GRAPHIC_EPS_MM = 50;
