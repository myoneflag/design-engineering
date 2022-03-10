import _ from "lodash";
import { ALL_KEY_VERSION } from "./types";

export function getSavedPreferenceOrDefault<T>(window: WindowLocalStorage, itemKey: string, defaultValue: T) {
    let returnValue = defaultValue;
    const localStorageItem = window.localStorage.getItem(itemKey);
    if (localStorageItem) {
        try {
            returnValue = JSON.parse(localStorageItem).value;
        } catch (err) {
        }
    }
    return returnValue;
}

export function savePreference<T>(window: WindowLocalStorage, itemKey: string, value: T, ttl: number = 30 * 24 * 3600 * 1000) {
    if (window) {
        if (!_.isEmpty(value)) {
            try {
                window.localStorage.setItem(itemKey, JSON.stringify({
                    value,
                    expiry: Date.now() + ttl,
                }));
            } catch (err) {
                cleanLocalStorage();
    
                try {
                    window.localStorage.setItem(itemKey, JSON.stringify({
                        value,
                        expiry: Date.now() + ttl,
                    }));
                } catch (err) {
                    // is Full
                }
            }
        } else {
            window.localStorage.removeItem(itemKey);
        }
    }    
}

export function isOldKeyVersion(key: string): boolean {
    for (let i = 1; i < ALL_KEY_VERSION; i++) {
        if (key.includes(`_v${i}:`)) {
            return true;
        }
    }
    return false;
}

export function cleanLocalStorage() {
    let index = 0;
    const expiryKeys: string[] = [];

    while (window.localStorage.key(index)) {
        const key = window.localStorage.key(index)!;
        if (isOldKeyVersion(key)) {
            expiryKeys.push(key);
        } else {
            const localStorageItem = window.localStorage.getItem(key);
            if (localStorageItem) {
                try {
                    if (Date.now() > JSON.parse(localStorageItem).expiry) {
                        expiryKeys.push(key)
                    }
                } catch(err) {
                }
            }
        }
        index++;
    }

    expiryKeys.forEach((key) => {
        window.localStorage.removeItem(key)
    });
}
