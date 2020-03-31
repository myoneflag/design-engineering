import { MeasurementSystem, UnitsParameters, VolumeMeasurementSystem } from "../../../common/src/api/document/drawing";
import { Units } from "../store/document/calculations/calculation-field";
import { assertUnreachable } from "../../../common/src/api/config";

export function convertMeasurementSystemNonNull(unitsPrefs: UnitsParameters, units: Units, value: number): [Units, number] {
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
                    return [Units.GallonsPerSecond, value / 4.54609];
                case VolumeMeasurementSystem.US:
                    return [Units.USGallonsPerSecond, value / 3.785411784];
            }
            assertUnreachable(unitsPrefs.volumeMeasurementSystem);
            break;
        case Units.Millimeters:
            switch (unitsPrefs.lengthMeasurementSystem) {
                case MeasurementSystem.METRIC:
                    return [units, value];
                case MeasurementSystem.IMPERIAL:
                    return [Units.Inches, mm2IN(value)];
            }
            assertUnreachable(unitsPrefs.lengthMeasurementSystem);
            break;
        case Units.Meters:
            switch (unitsPrefs.lengthMeasurementSystem) {
                case MeasurementSystem.METRIC:
                    return [units, value];
                case MeasurementSystem.IMPERIAL:
                    return [Units.Feet, m2FT(value)];
            }
            assertUnreachable(unitsPrefs.lengthMeasurementSystem);
            break;
        case Units.KiloPascals:
            switch (unitsPrefs.pressureMeasurementSystem) {
                case MeasurementSystem.METRIC:
                    return [units, value];
                case MeasurementSystem.IMPERIAL:
                    return [Units.Psi, kpa2PSI(value)];
            }
            assertUnreachable(unitsPrefs.pressureMeasurementSystem);
            break;
        case Units.MetersPerSecond:
            switch (unitsPrefs.lengthMeasurementSystem) {
                case MeasurementSystem.METRIC:
                    return [units, value];
                case MeasurementSystem.IMPERIAL:
                    return [Units.FeetPerSecond, m2FT(value)];
            }
            assertUnreachable(unitsPrefs.lengthMeasurementSystem);
            break;
        case Units.Celsius:
            switch (unitsPrefs.temperatureMeasurementSystem) {
                case MeasurementSystem.METRIC:
                    return [units, value];
                case MeasurementSystem.IMPERIAL:
                    return [Units.Fahrenheit, c2F(value)];
            }
            assertUnreachable(unitsPrefs.temperatureMeasurementSystem);
            break;
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
            break;
        case Units.GallonsPerSecond:
            switch (unitsPrefs.volumeMeasurementSystem) {
                case VolumeMeasurementSystem.METRIC:
                    return [Units.LitersPerSecond, value * 4.54609];
                case VolumeMeasurementSystem.IMPERIAL:
                    return [Units.GallonsPerSecond, value];
                case VolumeMeasurementSystem.US:
                    return [Units.USGallonsPerSecond, value / 3.785411784 * 4.54609];
            }
            assertUnreachable(unitsPrefs.volumeMeasurementSystem);
            break;
        case Units.Inches:
            switch (unitsPrefs.lengthMeasurementSystem) {
                case MeasurementSystem.METRIC:
                    return [Units.Millimeters, in2MM(value)];
                case MeasurementSystem.IMPERIAL:
                    return [Units.Inches, value];
            }
            assertUnreachable(unitsPrefs.lengthMeasurementSystem);
            break;
        case Units.Feet:
            switch (unitsPrefs.lengthMeasurementSystem) {
                case MeasurementSystem.METRIC:
                    return [Units.Feet, value];
                case MeasurementSystem.IMPERIAL:
                    return [Units.Meters, ft2M(value)];
            }
            assertUnreachable(unitsPrefs.lengthMeasurementSystem);
            break;
        case Units.Psi:
            switch (unitsPrefs.pressureMeasurementSystem) {
                case MeasurementSystem.METRIC:
                    return [Units.KiloPascals, psi2KPA(value)];
                case MeasurementSystem.IMPERIAL:
                    return [Units.Psi, value];
            }
            assertUnreachable(unitsPrefs.pressureMeasurementSystem);
            break;
        case Units.FeetPerSecond:
            switch (unitsPrefs.lengthMeasurementSystem) {
                case MeasurementSystem.METRIC:
                    return [Units.FeetPerSecond, value];
                case MeasurementSystem.IMPERIAL:
                    return [Units.MetersPerSecond, ft2M(value)];
            }
            assertUnreachable(unitsPrefs.lengthMeasurementSystem);
            break;
        case Units.Fahrenheit:
            switch (unitsPrefs.temperatureMeasurementSystem) {
                case MeasurementSystem.METRIC:
                    return [Units.Celsius, f2C(value)];
                case MeasurementSystem.IMPERIAL:
                    return [Units.Fahrenheit, value];
            }
            assertUnreachable(unitsPrefs.temperatureMeasurementSystem);
            break;
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
            break;
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
            break;
        case Units.USGallonsPerSecond:
            switch (unitsPrefs.volumeMeasurementSystem) {
                case VolumeMeasurementSystem.METRIC:
                    return [Units.LitersPerSecond, value * 3.785411784];
                case VolumeMeasurementSystem.IMPERIAL:
                    return [Units.GallonsPerSecond, value / 4.54609 * 3.785411784];
                case VolumeMeasurementSystem.US:
                    return [Units.USGallonsPerSecond, value];
            }
            assertUnreachable(unitsPrefs.volumeMeasurementSystem);
            break;
    }
    assertUnreachable(units);
}

export function convertMeasurementSystem(unitsPrefs: UnitsParameters, units: Units, value: number | null): [Units, number | null] {
    if (value === null) {
        const [newUnits] = convertMeasurementSystemNonNull(unitsPrefs, units, 1);
        return [newUnits, null];
    } else {
        return convertMeasurementSystemNonNull(unitsPrefs, units, value);
    }
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
