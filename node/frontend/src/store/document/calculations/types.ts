import { PsdCountEntry } from "../../../calculations/utils";
import { CalculationField, FieldCategory, Units } from "./calculation-field";

export interface PsdCalculation {
    psdUnits: PsdCountEntry | null;
}

export interface Calculation {
    warning: string | null;
}

export interface PressureCalculation {
    pressureKPA: number | null;
    staticPressureKPA: number | null;
}

export function addPressureCalculationFields(
    fields: CalculationField[],
    systemUid: string | undefined,
    propPrefix: string = "",
    extraPressureProps?: Partial<CalculationField>,
    extraStaticProps?: Partial<CalculationField>,
) {
    fields.push(
        {
            property: propPrefix + "pressureKPA",
            title: "Pressure",
            short: "",
            units: Units.KiloPascals,
            systemUid,
            category: FieldCategory.Pressure,
            ...extraPressureProps,
        },
        {
            property: propPrefix + "staticPressureKPA",
            title: "Static Pressure",
            short: "static",
            units: Units.KiloPascals,
            systemUid,
            category: FieldCategory.Pressure,
            ...extraStaticProps,
        }
    );
}
