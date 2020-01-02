import { FieldCategory, CalculationField, Units } from "../../../../src/store/document/calculations/calculation-field";
import { Calculation, PsdCalculation } from "../../../../src/store/document/calculations/types";
import FittingEntity from "../../../../src/store/document/entities/fitting-entity";

export default interface FittingCalculation extends Calculation {
    flowRateLS: number | null;
    pressureDropKPA: number | null;
    pressureKPA: number | null;
}

export function makeFittingCalculationFields(entity: FittingEntity): CalculationField[] {
    return [
        {
            property: "flowRateLS",
            title: "Flow Rate",
            short: "Flow",
            units: Units.LitersPerSecond,
            systemUid: entity.systemUid,
            category: FieldCategory.FlowRate
        },
        {
            property: "pressureDropKPA",
            title: "Pressure Drop",
            short: "Drop",
            units: Units.KiloPascals,
            systemUid: entity.systemUid,
            category: FieldCategory.Pressure
        },
        {
            property: "pressureKPA",
            title: "Pressure",
            short: "",
            units: Units.KiloPascals,
            systemUid: entity.systemUid,
            category: FieldCategory.Pressure,
            defaultEnabled: true
        }
    ];
}

export function emptyFittingCalculation(): FittingCalculation {
    return {
        flowRateLS: null,
        pressureDropKPA: null,
        pressureKPA: null,
        warning: null
    };
}
