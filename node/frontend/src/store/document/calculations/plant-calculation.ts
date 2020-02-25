import { FieldCategory, CalculationField, Units } from "../../../../src/store/document/calculations/calculation-field";
import { StandardFlowSystemUids } from "../../../../src/store/catalog";
import { Calculation } from "../../../../src/store/document/calculations/types";
import FixtureEntity from "../../../../../common/src/api/document/entities/fixtures/fixture-entity";
import { DocumentState } from "../types";

export default interface PlantCalculation extends Calculation {
    pressureDropKPA: number | null;
}

export function makePlantCalculationFields(): CalculationField[] {
    return [
        {
            property: "pressureDropKPA",
            title: "Pressure Drop",
            short: "",
            units: Units.KiloPascals,
            category: FieldCategory.Pressure
        }
    ];
}

export function emptyPlantCalculation(): PlantCalculation {
    return {
        pressureDropKPA: null,
        warning: null
    };
}
