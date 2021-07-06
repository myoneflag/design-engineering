export enum SupportedLocales {
    AU = 'en-au',
    US = 'en-us',
    UK = 'en-uk',
}

export const LOCALE_NAMES = {
    [SupportedLocales.AU]: "Australia",
    [SupportedLocales.UK]: "United Kingdom",
    [SupportedLocales.US]: "United States",
}

export function getBrowserLocale(): SupportedLocales | null {
    // We need to rely on heuristics here
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const langLocale = Intl.DateTimeFormat().resolvedOptions().locale;

    if (langLocale === 'en-AU') {
        return SupportedLocales.AU;
    }
    if (langLocale === 'en-US') {
        return SupportedLocales.US;
    }
    if (timeZone.includes('Australia')) {
        return SupportedLocales.AU;
    }
    if (timeZone.includes('America')) {
        return SupportedLocales.US;
    }
    if (timeZone.includes('Europe')) {
        return SupportedLocales.UK;
    }

    if (langLocale === 'en-GB') {
        // Australian computers use en-GB
        return SupportedLocales.AU;
    }

    // dunno.
    return null;
}

export function isSupportedLocale(locale: string): locale is SupportedLocales {
    return Object.values(SupportedLocales).includes(locale as SupportedLocales);
}

export function toSupportedLocale(locale: string | null): SupportedLocales {
    if (locale && isSupportedLocale(locale)) {
        return locale;
    }
    return SupportedLocales.AU;
}