import {
    MeasurementSystem,
    UnitsParameters,
    VelocityMeasurementSystem,
    VolumeMeasurementSystem
} from "../api/document/drawing";
import { assertUnreachable } from "../api/config";

export enum Units {
    None = "",

    // Metric
    LitersPerSecond = "L/s",
    Millimeters = "mm",
    Meters = "m",
    KiloPascals = "kPa",
    MetersPerSecond = "m/s",
    MetersPerSecondSquared = "m/s\u0178",
    Celsius = "\u00B0C",
    KiloWatts = "kW",
    Kv = "Kv",
    Liters = "L",

    // Imperial equivalents where applicable
    GallonsPerMinute = "gal/min",
    USGallonsPerMinute = "US gal/min", // wtf usa
    Inches = "in",
    Feet = "ft",
    FeetPerSecondSquared = "ftt/s\u0178",
    Psi = "psi",
    FeetPerSecond = "ft/s",
    Fahrenheit = "\u00B0F",
    // keep it at kilowatts
    // Kv is unitless
    Gallons = "gal",
    USGallons = "US gal", // wtf usa

    PipeDiameterMM = "pmm",

    // April Fools
    FurlongsPerFortnight = "fur/fortn",
}

export function convertMeasurementSystemNonNull(unitsPrefs: UnitsParameters, units: Units, value: number): [Units, number | string | null] {
    switch (units) {
        case Units.None:
        case Units.Kv:
        case Units.KiloWatts:
            return [units, value];
        case Units.LitersPerSecond:
            switch (unitsPrefs.volumeMeasurementSystem) {
                case VolumeMeasurementSystem.METRIC:
                    return [units, value];
                case VolumeMeasurementSystem.IMPERIAL:
                    return [Units.GallonsPerMinute, value / 4.54609 * 60];
                case VolumeMeasurementSystem.US:
                    return [Units.USGallonsPerMinute, value / 3.785411784 * 60];
                default:
                    assertUnreachable(unitsPrefs.volumeMeasurementSystem);
            }
            assertUnreachable(unitsPrefs.volumeMeasurementSystem);
            // Unfortunatly, for some reason vue's ts compiling doesn't manage type inference to `never` the same way
            // as intellij, so this is needed here.
            return [Units.None, 0];
        case Units.Millimeters:
            switch (unitsPrefs.lengthMeasurementSystem) {
                case MeasurementSystem.METRIC:
                    return [units, value];
                case MeasurementSystem.IMPERIAL:
                    return [Units.Inches, mm2IN(value)];
            }
            assertUnreachable(unitsPrefs.lengthMeasurementSystem);
            return [Units.None, 0];
        case Units.Meters:
            switch (unitsPrefs.lengthMeasurementSystem) {
                case MeasurementSystem.METRIC:
                    return [units, value];
                case MeasurementSystem.IMPERIAL:
                    return [Units.Feet, m2FT(value)];
            }
            assertUnreachable(unitsPrefs.lengthMeasurementSystem);
            return [Units.None, 0];
        case Units.KiloPascals:
            switch (unitsPrefs.pressureMeasurementSystem) {
                case MeasurementSystem.METRIC:
                    return [units, value];
                case MeasurementSystem.IMPERIAL:
                    return [Units.Psi, kpa2PSI(value)];
            }
            assertUnreachable(unitsPrefs.pressureMeasurementSystem);
            return [Units.None, 0];
        case Units.MetersPerSecond:
            switch (unitsPrefs.velocityMeasurementSystem) {
                case VelocityMeasurementSystem.METRIC:
                    return [units, value];
                case VelocityMeasurementSystem.IMPERIAL:
                    return [Units.FeetPerSecond, m2FT(value)];
                case VelocityMeasurementSystem.ALTERNATIVE_IMPERIAL:
                    return [Units.FurlongsPerFortnight, value * 6012.87];
            }
            assertUnreachable(unitsPrefs.velocityMeasurementSystem);
            return [Units.None, 0];
        case Units.MetersPerSecondSquared:
            switch (unitsPrefs.lengthMeasurementSystem) {
                case MeasurementSystem.METRIC:
                    return [units, value];
                case MeasurementSystem.IMPERIAL:
                    return [Units.FeetPerSecondSquared, m2FT(value)];
            }
            assertUnreachable(unitsPrefs.lengthMeasurementSystem);
            return [Units.None, 0];
        case Units.Celsius:
            switch (unitsPrefs.temperatureMeasurementSystem) {
                case MeasurementSystem.METRIC:
                    return [units, value];
                case MeasurementSystem.IMPERIAL:
                    return [Units.Fahrenheit, c2F(value)];
            }
            assertUnreachable(unitsPrefs.temperatureMeasurementSystem);
            return [Units.None, 0];
        case Units.Liters:
            switch (unitsPrefs.volumeMeasurementSystem) {
                case VolumeMeasurementSystem.METRIC:
                    return [units, value];
                case VolumeMeasurementSystem.IMPERIAL:
                    return [Units.Gallons, value * 0.219969];
                case VolumeMeasurementSystem.US:
                    return [Units.USGallons, value * 0.2641721];
            }
            assertUnreachable(unitsPrefs.volumeMeasurementSystem);
            return [Units.None, 0];
        case Units.GallonsPerMinute:
            switch (unitsPrefs.volumeMeasurementSystem) {
                case VolumeMeasurementSystem.METRIC:
                    return [Units.LitersPerSecond, value * 4.54609 / 60];
                case VolumeMeasurementSystem.IMPERIAL:
                    return [Units.GallonsPerMinute, value];
                case VolumeMeasurementSystem.US:
                    return [Units.USGallonsPerMinute, value / 3.785411784 * 4.54609];
            }
            assertUnreachable(unitsPrefs.volumeMeasurementSystem);
            return [Units.None, 0];
        case Units.Inches:
            switch (unitsPrefs.lengthMeasurementSystem) {
                case MeasurementSystem.METRIC:
                    return [Units.Millimeters, in2MM(value)];
                case MeasurementSystem.IMPERIAL:
                    return [Units.Inches, value];
            }
            assertUnreachable(unitsPrefs.lengthMeasurementSystem);
            return [Units.None, 0];
        case Units.Feet:
            switch (unitsPrefs.lengthMeasurementSystem) {
                case MeasurementSystem.METRIC:
                    return [Units.Meters, ft2M(value)];
                case MeasurementSystem.IMPERIAL:
                    return [Units.Feet, value];
            }
            assertUnreachable(unitsPrefs.lengthMeasurementSystem);
            return [Units.None, 0];
        case Units.Psi:
            switch (unitsPrefs.pressureMeasurementSystem) {
                case MeasurementSystem.METRIC:
                    return [Units.KiloPascals, psi2KPA(value)];
                case MeasurementSystem.IMPERIAL:
                    return [Units.Psi, value];
            }
            assertUnreachable(unitsPrefs.pressureMeasurementSystem);
            return [Units.None, 0];
        case Units.FeetPerSecond:
            switch (unitsPrefs.velocityMeasurementSystem) {
                case VelocityMeasurementSystem.METRIC:
                    return [Units.MetersPerSecond, ft2M(value)];
                case VelocityMeasurementSystem.IMPERIAL:
                    return [Units.FeetPerSecond, value];
                case VelocityMeasurementSystem.ALTERNATIVE_IMPERIAL:
                    return [Units.FurlongsPerFortnight, ft2M(value) * 6012.87];
            }
            assertUnreachable(unitsPrefs.velocityMeasurementSystem);
            return [Units.None, 0];
        case Units.FeetPerSecondSquared:
            switch (unitsPrefs.lengthMeasurementSystem) {
                case MeasurementSystem.METRIC:
                    return [Units.MetersPerSecondSquared, ft2M(value)];
                case MeasurementSystem.IMPERIAL:
                    return [Units.FeetPerSecondSquared, value];
            }
            assertUnreachable(unitsPrefs.lengthMeasurementSystem);
            return [Units.None, 0];
        case Units.Fahrenheit:
            switch (unitsPrefs.temperatureMeasurementSystem) {
                case MeasurementSystem.METRIC:
                    return [Units.Celsius, f2C(value)];
                case MeasurementSystem.IMPERIAL:
                    return [Units.Fahrenheit, value];
            }
            assertUnreachable(unitsPrefs.temperatureMeasurementSystem);
            return [Units.None, 0];
        case Units.Gallons:
            switch (unitsPrefs.volumeMeasurementSystem) {
                case VolumeMeasurementSystem.METRIC:
                    return [Units.Liters, value * 4.54609];
                case VolumeMeasurementSystem.IMPERIAL:
                    return [Units.Gallons, value];
                case VolumeMeasurementSystem.US:
                    return [Units.USGallons, value / 3.785411784 * 4.54609];
            }
            assertUnreachable(unitsPrefs.volumeMeasurementSystem);
            return [Units.None, 0];
        case Units.USGallons:
            switch (unitsPrefs.volumeMeasurementSystem) {
                case VolumeMeasurementSystem.METRIC:
                    return [units, value];
                case VolumeMeasurementSystem.IMPERIAL:
                    return [Units.Gallons, value / 4.54609];
                case VolumeMeasurementSystem.US:
                    return [Units.USGallons, value / 3.785411784];
            }
            assertUnreachable(unitsPrefs.volumeMeasurementSystem);
            return [Units.None, 0];
        case Units.USGallonsPerMinute:
            switch (unitsPrefs.volumeMeasurementSystem) {
                case VolumeMeasurementSystem.METRIC:
                    return [Units.LitersPerSecond, value * 3.785411784 / 60];
                case VolumeMeasurementSystem.IMPERIAL:
                    return [Units.GallonsPerMinute, value / 4.54609 * 3.785411784];
                case VolumeMeasurementSystem.US:
                    return [Units.USGallonsPerMinute, value];
            }
            assertUnreachable(unitsPrefs.volumeMeasurementSystem);
            return [Units.None, 0];
        case Units.PipeDiameterMM:
            return convertPipeDiameterFromMetric(unitsPrefs, value);
        case Units.FurlongsPerFortnight:
            switch (unitsPrefs.velocityMeasurementSystem) {
                case VelocityMeasurementSystem.METRIC:
                    return [Units.MetersPerSecond, value / 6012.87];
                case VelocityMeasurementSystem.IMPERIAL:
                    return [Units.FeetPerSecond, m2FT(value / 6012.87)];
                case VelocityMeasurementSystem.ALTERNATIVE_IMPERIAL:
                    return [Units.FurlongsPerFortnight, value];
                default:
                    assertUnreachable(unitsPrefs.velocityMeasurementSystem);
            }
            assertUnreachable(unitsPrefs.velocityMeasurementSystem);
            return [Units.None, 0];
        default:
            assertUnreachable(units);
    }
    assertUnreachable(units);
    return [Units.None, 0];
}

export function convertMeasurementSystem(unitsPrefs: UnitsParameters, units: Units, value: number | null): [Units, number | null | string] {
    if (value === null) {
        const [newUnits] = convertMeasurementSystemNonNull(unitsPrefs, units, 1);
        return [newUnits, null];
    } else {
        return convertMeasurementSystemNonNull(unitsPrefs, units, value);
    }
}

// Always store in metric, no matter the document properties.
export function convertMeasurementToMetric(units: Units, value: number | null) {
    return convertMeasurementSystem(
        {
            lengthMeasurementSystem: MeasurementSystem.METRIC,
            temperatureMeasurementSystem: MeasurementSystem.METRIC,
            velocityMeasurementSystem: VelocityMeasurementSystem.METRIC,
            pressureMeasurementSystem: MeasurementSystem.METRIC,
            volumeMeasurementSystem: VolumeMeasurementSystem.METRIC
        },
        units,
        value
    );
}

export function mm2IN(mm: number) {
    return mm / 25.4;
}

export function in2MM(inches: number) {
    return inches * 25.4;
}

export function m2FT(m: number) {
    return mm2IN(m * 1000) / 12;
}

export function ft2M(ft: number) {
    return in2MM(ft * 12) / 1000;
}

export function kpa2PSI(kpa: number) {
    return kpa / 6.894757293168361;
}

export function psi2KPA(psi: number) {
    return psi * 6.894757293168361;
}

export function c2F(celsius: number) {
    return (celsius * 9 / 5) + 32;
}

export function f2C(fahrenheit: number) {
    return (fahrenheit - 32) * 5 / 9;
}

const validConverts: { [key: number]: string } = {
    0.25: "1/4",
    0.5: "1/2",
    0.75: "3/4",
    1: "1",
    1.25: "1 1/4",
    1.5: "1 1/2",
    2: "2",
    2.5: "2 1/2",
    3: "3",
    3.5: "3 1/2",
    4: "4",
    4.5: "4 1/2",
    5: "5",
    5.5: "5.5",
    6: "6",
    7: "7",
    8: "8",
    9: "9",
    10: "10",
    11: "11",
    12: "12",
    13: "13",
    14: "14",
    15: "15",
    16: "16",
    17: "17",
    18: "18"
};

export function convertPipeDiameterFromMetric(unitPrefs: UnitsParameters, valueMM: number | null): [Units, number | string | null] {
    switch (unitPrefs.lengthMeasurementSystem) {
        case MeasurementSystem.METRIC:
            return [Units.Millimeters, valueMM];
        case MeasurementSystem.IMPERIAL:
            if (valueMM === null) {
                return [Units.Inches, valueMM];
            }
            let closestDist = Infinity;
            let value: string | number | null = mm2IN(valueMM);

            const inches = mm2IN(valueMM);
            for (const [num, val] of Object.entries(validConverts)) {
                if (Math.abs(Number(num) - inches) < closestDist) {
                    closestDist = Math.abs(Number(num) - inches);
                    value = val;
                }
            }
            return [Units.Inches, value];
    }
    assertUnreachable(unitPrefs.lengthMeasurementSystem);
}
