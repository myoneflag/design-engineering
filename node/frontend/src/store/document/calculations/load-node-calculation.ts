import { FieldCategory, CalculationField} from "../../../../src/store/document/calculations/calculation-field";
import {
    addPressureCalculationFields,
    Calculation,
    PressureCalculation
} from "../../../../src/store/document/calculations/types";
import LoadNodeEntity from "../../../../../common/src/api/document/entities/load-node-entity";
import { Units } from "../../../../../common/src/lib/measurements";
import { StandardFlowSystemUids } from "../../../../../common/src/api/config";

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
