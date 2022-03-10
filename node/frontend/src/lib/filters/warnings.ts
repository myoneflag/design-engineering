import { WarningFilter } from "../../../src/store/document/types";
import { getSavedPreferenceOrDefault, savePreference } from "../localStorage";
import { ALL_KEY_VERSION } from "../types";

const WARNINGS_KEY = (docId:number) => `warnings_v${ALL_KEY_VERSION}:${docId}`;

export function getSavedWarningsFilter(window: WindowLocalStorage, documentId: number, defaultValue: WarningFilter) {
    return getSavedPreferenceOrDefault(window, WARNINGS_KEY(documentId), defaultValue)
}

export function saveWarningsPreference(window: WindowLocalStorage, documentId: number, value: WarningFilter) {
    savePreference(window, WARNINGS_KEY(documentId), value);
}
