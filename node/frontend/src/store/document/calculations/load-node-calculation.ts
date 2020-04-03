import { FieldCategory, CalculationField, Units } from "../../../../src/store/document/calculations/calculation-field";
import { StandardFlowSystemUids } from "../../../../src/store/catalog";
import {
    addPressureCalculationFields,
    Calculation,
    PressureCalculation
} from "../../../../src/store/document/calculations/types";
import LoadNodeEntity from "../../../../../common/src/api/document/entities/load-node-entity";

export default interface LoadNodeCalculation extends Calculation, PressureCalculation {
    flowRateLS: number | null;
}

export function makeLoadNodeCalculationFields(entity: LoadNodeEntity): CalculationField[] {
    const result: CalculationField[] = [];

    addPressureCalculationFields(result, entity.systemUidOption || undefined, "", {defaultEnabled: true});

    result.push(
        {
            property: "flowRateLS",
            title: "Flow Rate",
            short: "",
            units: Units.LitersPerSecond,
            systemUid: entity.systemUidOption || undefined,
            category: FieldCategory.FlowRate
        }
    );
    return result;
}

export function emptyFixtureCalculation(): LoadNodeCalculation {
    return {
        pressureKPA: null,
        staticPressureKPA: null,
        flowRateLS: null,
        warning: null
    };
}
