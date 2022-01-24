import { WarningFilter } from "src/store/document/types";
import { getSavedPreferenceOrDefault, savePreference } from "../localStorage";

const WARNINGS_ALL_KEYS_VERSION = "v1";
const WARNINGS_KEY = (docId:number) => `warnings_${WARNINGS_ALL_KEYS_VERSION}:${docId}`;

export function getSavedWarningsFilter(window: WindowLocalStorage, documentId: number, defaultValue: WarningFilter) {
    return getSavedPreferenceOrDefault(window, WARNINGS_KEY(documentId), defaultValue)
}

export function saveWarningsPreference(window: WindowLocalStorage, documentId: number, value: WarningFilter) {
    savePreference(window, WARNINGS_KEY(documentId), value);
}
