import { FieldCategory, CalculationField} from "../../../../src/store/document/calculations/calculation-field";
import { Calculation } from "../../../../src/store/document/calculations/types";
import FixtureEntity from "../../../../../common/src/api/document/entities/fixtures/fixture-entity";
import { DocumentState } from "../types";
import { Units } from "../../../../../common/src/lib/measurements";
import { StandardFlowSystemUids } from "../../../../../common/src/api/config";

export default interface PlantCalculation extends Calculation {
    pressureDropKPA: number | null;
    circulationFlowRateLS: number | null;
    circulationPressureLoss: number | null;
    heatLossKW: number | null;
}

export function makePlantCalculationFields(): CalculationField[] {
    return [
        {
            property: "pressureDropKPA",
            title: "Pressure Drop",
            short: "",
            units: Units.KiloPascals,
            category: FieldCategory.Pressure
        },

        {
            property: "circulationFlowRateLS",
            title: "Return System Duty Flow Rate",
            short: "(rtn)",
            units: Units.LitersPerSecond,
            category: FieldCategory.FlowRate
        },
        {
            property: "circulationPressureLoss",
            title: "Return System Pressure Loss",
            short: "(rtn drop)",
            units: Units.KiloPascals,
            category: FieldCategory.Pressure
        },

        {
            property: "heatLossKW",
            title: "Return Heat Loss",
            short: "",
            units: Units.KiloWatts,
            category: FieldCategory.HeatLoss
        },
    ];
}

export function emptyPlantCalculation(): PlantCalculation {
    return {
        pressureDropKPA: null,
        circulationFlowRateLS: null,
        circulationPressureLoss: null,
        heatLossKW: null,
        warning: null,
    };
}
