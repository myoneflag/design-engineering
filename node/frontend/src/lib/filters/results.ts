import _ from "lodash";
import { getFields } from "../../../src/calculations/utils";
import BaseBackedObject from "src/htmlcanvas/lib/base-backed-object";
import { FieldCategory } from "src/store/document/calculations/calculation-field";
import { CalculationFilters, CalculationFilterSettings, DocumentState, CalculationFilterSettingType, FilterSettingKey } from "src/store/document/types";
import Vue from "vue";
import { assertUnreachable } from "../../../../common/src/api/config";
import { Catalog } from "../../../../common/src/api/catalog/types";;
import { getEntityName } from "../../../../common/src/api/document/entities/types";
import { cloneSimple } from "../../../../common/src/lib/utils";
import { CombineFilters } from "../types";
import { getSavedPreferenceOrDefault, savePreference } from "../localStorage";

const combineFilters: CombineFilters = {
    "Plant": [
        {
            name: "Return System Pump Duty",
            fields: [
                "Return System Duty Flow Rate",
                "Return System Pressure Loss"
            ]
        }
    ],
    "Fixture": [
        {
            name: "Dead Leg Volume",
            fields: [
                "Warm Water Dead Leg Volume",
                "Hot Water Dead Leg Volume"
            ]
        },
        {
            name: "Dead Leg Length",
            fields: [
                "Warm Water Dead Leg Length",
                "Hot Water Dead Leg Length"
            ]
        },
    ]
}

function customFilterViewByField(filterViewSetting: { [key: string]: FilterSettingKey }, eName: string, title: string): boolean {
    // Custom filter view for the particular filter & entity
    if (filterViewSetting['pressure'].enabled) {
        if (['Small Valves', 'Large Valves'].includes(eName) && ['Size'].includes(title)) {
            return true;
        }
    }
    if (filterViewSetting['heat-loss'].enabled) {
        if (['Small Valves'].includes(eName) && ['Kv Value'].includes(title)) {
            return true;
        }
        if (['Riser'].includes(eName) && ['Flow Rate To Above'].includes(title)) {
            return true;
        }
        if (['Pipe'].includes(eName) && ['Pipe Diameter'].includes(title)) {
            return true;
        }
    }
    if (filterViewSetting['pipe-sizing'].enabled) {
        // turn the ‘size' on for inspection opening, floor waste and grease interceptor trap
        // turn the ‘model' on for the grease interceptor trap
    }
    return false;
}

export function getEffectiveFilter(objects: BaseBackedObject[], calculationFilters: CalculationFilters, calculationFilterSettings: CalculationFilterSettings, document: DocumentState, catalog: Catalog): CalculationFilters {
    const build: CalculationFilters = {};

    const existing = cloneSimple(calculationFilters);
    saveFiltersPreference(window, document.documentId, existing);

    const wasInserted = new Set<string>();
    const hasEnabled = new Set<string>();
    const allowedCategories = new Set<FieldCategory>();

    const filterViewSetting = calculationFilterSettings.view.filters;
    let isAllFilterView = true;

    for (const cName in filterViewSetting) {
        if (filterViewSetting[cName].enabled) {
            if (filterViewSetting[cName].category) {
                Array.from(filterViewSetting[cName].category!).forEach((category) => {
                    allowedCategories.add(category);
                });
            }
        } else if (cName !== "custom") {
            isAllFilterView = false;
        }
    }

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

        const eName = getEntityName(o.entity, document.drawing);

        if (eName in build) {
            Vue.set(build[eName], "enabled", isAllFilterView);
            build[eName].enabled = isAllFilterView;
            wasInserted.add(eName);

            fields.forEach((f) => {
                const enabled =
                    isAllFilterView ||
                    allowedCategories.has(f.category) ||
                    (_.isEmpty(existing) && !!f.defaultEnabled) ||
                    customFilterViewByField(filterViewSetting, eName, f.title);
                if (f.title in build[eName].filters) {
                    Vue.set(build[eName].filters, f.title, {
                        name: f.title,
                        enabled: enabled
                    });
                    build[eName].filters[f.title].enabled = enabled;
                    if (enabled) {
                        hasEnabled.add(eName);
                    }
                } else {
                    Vue.set(build[eName].filters, f.title, {
                        name: f.title,
                        enabled: enabled
                    });
                    build[eName].filters[f.title].enabled = enabled;
                    if (enabled) {
                        hasEnabled.add(eName);
                    }
                }
            });
        } else {
            Vue.set(build, eName, {
                name: eName,
                filters: {},
                enabled: isAllFilterView
            });
            build[eName].enabled = isAllFilterView;
            wasInserted.add(eName);

            fields.forEach((f) => {
                const enabled = 
                    isAllFilterView ||
                    allowedCategories.has(f.category) ||
                    (_.isEmpty(existing) && !!f.defaultEnabled) ||
                    customFilterViewByField(filterViewSetting, eName, f.title);
                Vue.set(build[eName].filters, f.title, {
                    name: f.title,
                    enabled: enabled
                });
                build[eName].filters[f.title].enabled = enabled;
                if (enabled) {
                    hasEnabled.add(eName);
                }
            });
        }
    });

    for (const eName of Array.from(wasInserted.values())) {
        if (hasEnabled.has(eName)) {
            build[eName].enabled = true;
        }
    }

    const isCustomFilter = filterViewSetting["custom"].enabled;
    if (isCustomFilter) {
        for (const eName in existing) {
            if (eName in build && existing.hasOwnProperty(eName)) {
                for (const prop in existing[eName].filters) {
                    if (prop in build[eName].filters && existing[eName].filters[prop].enabled) {
                        build[eName].filters[prop].enabled = true;
                    }
                }
                if (existing[eName].enabled) {
                    build[eName].enabled = true;
                }
            }
        }
    }
    return build;
}

export function getFilterSettings(calculationFilterSettings: CalculationFilterSettings, document: DocumentState): CalculationFilterSettings {

    const existing = cloneSimple(calculationFilterSettings);
    saveFilterSettingsPreference(window, document.documentId, existing);

    const build = existing;

    for (const eName in existing) {
        let isSelectedAll = true;
        for (const prop in existing[eName as CalculationFilterSettingType].filters) {
            if (
                existing[eName as CalculationFilterSettingType].filters[prop].pressureOrDrainage &&
                existing[eName as CalculationFilterSettingType].filters[prop].pressureOrDrainage !== document.uiState.pressureOrDrainage)
            {
                delete build[eName as CalculationFilterSettingType].filters[prop];
            } else if (prop !== 'custom' && !existing[eName as CalculationFilterSettingType].filters[prop].enabled) {
                // ‘Show All' and 'All’ should untick if one of the filters below it is unticked
                isSelectedAll = false;
            }
        }
        build[eName as CalculationFilterSettingType].filters['all'].enabled = isSelectedAll;
    }

    return build;
}

export function getCombinedFilter(calculationFilters: CalculationFilters): CalculationFilters {
    const filters = cloneSimple(calculationFilters);

    for (const eName in calculationFilters) {
        if (!combineFilters[eName]?.length) {
            continue;
        }

        for (const fName in calculationFilters[eName].filters) {
            let isCombine = false;
            for (const item of combineFilters[eName]) {
                if (item.fields?.includes(fName)) {
                    isCombine = true;
                    const targets = filters[eName].filters[item.name]?.targets || [];
                    filters[eName].filters[item.name] = {
                        name: item.name,
                        enabled: calculationFilters[eName].filters[fName].enabled,
                        targets: [...targets, fName],
                    }
                }
            }
            if (isCombine) {
                delete filters[eName].filters[fName];
            }
        }
    }
    return filters;
}

const FILTERS_ALL_KEYS_VERSION = "v2";
const FILTERS_KEY = (docId:number) => `filters_${FILTERS_ALL_KEYS_VERSION}:${docId}`;
const FILTERSETTINGS_KEY = (docId:number) => `filters-setting_${FILTERS_ALL_KEYS_VERSION}:${docId}`;

export function getSavedFilters(window: WindowLocalStorage, documentId: number, defaultValue: CalculationFilters): CalculationFilters {
    return getSavedPreferenceOrDefault<CalculationFilters>(window, FILTERS_KEY(documentId), defaultValue)
}

export function getSavedFilterSettings(window: WindowLocalStorage, documentId: number, defaultValue: CalculationFilterSettings): CalculationFilterSettings {
    return getSavedPreferenceOrDefault<CalculationFilterSettings>(window, FILTERSETTINGS_KEY(documentId), defaultValue)
}

function saveFiltersPreference(window: WindowLocalStorage, documentId: number, value: CalculationFilters) {
    savePreference(window, FILTERS_KEY(documentId), value);
}

function saveFilterSettingsPreference(window: WindowLocalStorage, documentId: number, value: CalculationFilterSettings) {
    savePreference(window, FILTERSETTINGS_KEY(documentId), value);
}

