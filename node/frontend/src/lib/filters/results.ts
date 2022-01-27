import _ from "lodash";
import { getEntitySystem, getFields } from "../../../src/calculations/utils";
import BaseBackedObject from "../../../src/htmlcanvas/lib/base-backed-object";
import { FieldCategory } from "../../../src/store/document/calculations/calculation-field";
import {
    CalculationFilters,
    CalculationFilterSettings,
    DocumentState,
    CalculationFilterSettingType,
    FilterSettingKey,
    FilterSettingViewKeyValues,
    PressureOrDrainage,
} from "../../../src/store/document/types";
import Vue from "vue";
import { ALL_DRAINAGE_SYSTEM_UIDS, assertUnreachable, DrainageSystemUid } from "../../../../common/src/api/config";
import { Catalog } from "../../../../common/src/api/catalog/types";;
import { getEntityName } from "../../../../common/src/api/document/entities/types";
import { cloneSimple } from "../../../../common/src/lib/utils";
import { CombineFilters } from "../types";
import { getSavedPreferenceOrDefault, savePreference } from "../localStorage";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";

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
    if (filterViewSetting['pressure']?.enabled) {
        if (['Small Valves', 'Large Valves'].includes(eName) && ['Size'].includes(title)) {
            return true;
        }
    }
    if (filterViewSetting['heat-loss']?.enabled) {
        if (['Small Valves'].includes(eName) && ['Kv Value'].includes(title)) {
            return true;
        }
        if (['Pipe'].includes(eName) && ['Pipe Diameter', 'Return Flow Rate'].includes(title)) {
            return true;
        }
        if (['Plant'].includes(eName) && ['Return System Duty Flow Rate', 'Return System Pressure Loss'].includes(title)) {
            return true;
        }
    }
    if (filterViewSetting['pipe-sizing']?.enabled) {
        if (['Floor Waste', 'Inspection Opening', 'Grease Interceptor Trap'].includes(eName) && ['Size'].includes(title)) {
            return true;
        }
        if (['Grease Interceptor Trap'].includes(eName) && ['Model'].includes(title)) {
            return true;
        }
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
        if (filterViewSetting[cName as FilterSettingViewKeyValues].enabled) {
            if (filterViewSetting[cName as FilterSettingViewKeyValues].category) {
                Array.from(filterViewSetting[cName as FilterSettingViewKeyValues].category!).forEach((category) => {
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

export function setInitFilterSettings(objects: BaseBackedObject[], calculationFilterSettings: CalculationFilterSettings, context: CanvasContext) {
    const allFlowSystems = new Set<string>();

    objects.forEach((o) => {
        const entitySystem = getEntitySystem(o.entity, context)!;
        if (entitySystem) {
            allFlowSystems.add(entitySystem);
        }
    });

    const filterSystemSetting = cloneSimple(calculationFilterSettings.systems.filters);

    for (const prop in filterSystemSetting) {
        if (prop !== 'all' && !allFlowSystems.has(prop)) {
            delete filterSystemSetting[prop];
        }
    }

    allFlowSystems.forEach((flowSystemUid) => {
        const systemName = context.document.drawing.metadata.flowSystems.find((e) => e.uid === flowSystemUid)?.name!;
        if (flowSystemUid in filterSystemSetting) {
            filterSystemSetting[flowSystemUid].name = systemName;
        } else if (ALL_DRAINAGE_SYSTEM_UIDS.includes(flowSystemUid as DrainageSystemUid)) {
            filterSystemSetting[flowSystemUid] = {
                name: systemName,
                enabled: true,
                pressureOrDrainage: PressureOrDrainage.Drainage
            };
        } else {
            filterSystemSetting[flowSystemUid] = {
                name: systemName,
                enabled: true,
                pressureOrDrainage: PressureOrDrainage.Pressure
            };
        }
    });

    Vue.set(calculationFilterSettings.systems, 'filters', filterSystemSetting);
}

export function getFilterSettings(calculationFilterSettings: CalculationFilterSettings, document: DocumentState): CalculationFilterSettings {

    const existing = cloneSimple(calculationFilterSettings);
    saveFilterSettingsPreference(window, document.documentId, existing);

    const build = existing;

    for (const eName in existing) {
        let isSelectedAll = true;
        switch(eName) {
            case CalculationFilterSettingType.Systems:
                for (const prop in existing[CalculationFilterSettingType.Systems].filters) {
                    if (
                        existing[CalculationFilterSettingType.Systems].filters[prop].pressureOrDrainage &&
                        existing[CalculationFilterSettingType.Systems].filters[prop].pressureOrDrainage !== document.uiState.pressureOrDrainage)
                    {
                        delete build[CalculationFilterSettingType.Systems].filters[prop];
                    } else if (!existing[CalculationFilterSettingType.Systems].filters[prop].enabled) {
                        isSelectedAll = false;
                    }
                }
                build[CalculationFilterSettingType.Systems].filters['all'].enabled = isSelectedAll;
                break;
            case CalculationFilterSettingType.View:
                for (const prop in existing[CalculationFilterSettingType.View].filters) {
                    if (
                        existing[CalculationFilterSettingType.View].filters[prop as FilterSettingViewKeyValues].pressureOrDrainage &&
                        existing[CalculationFilterSettingType.View].filters[prop as FilterSettingViewKeyValues].pressureOrDrainage !== document.uiState.pressureOrDrainage)
                    {
                        delete build[CalculationFilterSettingType.View].filters[prop as FilterSettingViewKeyValues];
                    } else if (prop !== 'custom' && !existing[CalculationFilterSettingType.View].filters[prop as FilterSettingViewKeyValues].enabled) {
                        isSelectedAll = false;
                    }
                }
                build[CalculationFilterSettingType.View].filters['all'].enabled = isSelectedAll;
                break;
            default:
                break;
        }
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

const FILTERS_ALL_KEYS_VERSION = "v3";
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

