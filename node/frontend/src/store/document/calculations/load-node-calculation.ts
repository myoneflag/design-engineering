import { FieldCategory, CalculationField, Units } from "../../../../src/store/document/calculations/calculation-field";
import { StandardFlowSystemUids } from "../../../../src/store/catalog";
import { Calculation } from "../../../../src/store/document/calculations/types";
import LoadNodeEntity from "../entities/load-node-entity";

export default interface LoadNodeCalculation extends Calculation {
    pressureKPA: number | null;
    flowRateLS: number | null;
}

export function makeLoadNodeCalculationFields(entity: LoadNodeEntity): CalculationField[] {
    if (entity.systemUidOption) {
        return [
            {
                property: "pressureKPA",
                title: "Pressure",
                short: "",
                units: Units.KiloPascals,
                category: FieldCategory.Pressure,
                defaultEnabled: true,
                systemUid: entity.systemUidOption
            },
            {
                property: "flowRateLS",
                title: "Flow Rate",
                short: "",
                units: Units.LitersPerSecond,
                systemUid: entity.systemUidOption,
                category: FieldCategory.FlowRate
            }
        ];
    } else {
        return [
            {
                property: "pressureKPA",
                title: "Pressure",
                short: "",
                units: Units.KiloPascals,
                category: FieldCategory.Pressure,
                defaultEnabled: true
            },
            {
                property: "flowRateLS",
                title: "Flow Rate",
                short: "",
                units: Units.LitersPerSecond,
                category: FieldCategory.FlowRate
            }
        ];
    }
}

export function emptyFixtureCalculation(): LoadNodeCalculation {
    return {
        pressureKPA: null,
        flowRateLS: null,
        warning: null
    };
}
