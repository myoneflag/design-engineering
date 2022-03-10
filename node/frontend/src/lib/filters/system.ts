import { getSavedPreferenceOrDefault, savePreference } from "../localStorage";
import { ALL_KEY_VERSION } from "../types";

const SYSTEM_KEY = (docId: number) => `system_v${ALL_KEY_VERSION}:${docId}`;

export function getSavedSystemFilter(window: WindowLocalStorage, documentId: number, defaultValue: string[]) {
    return getSavedPreferenceOrDefault(window, SYSTEM_KEY(documentId), defaultValue)
}

export function saveSystemPreference(window: WindowLocalStorage, documentId: number, value: string[]) {
    savePreference(window, SYSTEM_KEY(documentId), value);
}
