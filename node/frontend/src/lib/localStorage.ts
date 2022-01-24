import _ from "lodash";

export function getSavedPreferenceOrDefault<T>(window: WindowLocalStorage, itemKey: string, defaultValue: T) {
    let returnValue = defaultValue;
    const localStorageItem = window.localStorage.getItem(itemKey);
    if (localStorageItem) {
        try {
            returnValue = JSON.parse(localStorageItem);
        } catch(err) {
        }
    }
    return returnValue;
}

export function savePreference<T>(window: WindowLocalStorage, itemKey: string, value: T) {
    if (window && !_.isEmpty(value)) {
        window.localStorage.setItem(itemKey, JSON.stringify(value));
    }    
}
