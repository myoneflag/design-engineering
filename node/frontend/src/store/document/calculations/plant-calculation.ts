import { FieldCategory, CalculationField, Units } from "../../../../src/store/document/calculations/calculation-field";
import { StandardFlowSystemUids } from "../../../../src/store/catalog";
import { Calculation } from "../../../../src/store/document/calculations/types";
import FixtureEntity from "../../../../../common/src/api/document/entities/fixtures/fixture-entity";
import { DocumentState } from "../types";

export default interface PlantCalculation extends Calculation {
    pressureDropKPA: number | null;
    systemDutyFlowRateLS: number | null;
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
            property: "systemDutyFlowRateLS",
            title: "Return System Duty Flow Rate",
            short: "(rtn)",
            units: Units.LitersPerSecond,
            category: FieldCategory.FlowRate
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
        systemDutyFlowRateLS: null,
        heatLossKW: null,
        warning: null,
    };
}
