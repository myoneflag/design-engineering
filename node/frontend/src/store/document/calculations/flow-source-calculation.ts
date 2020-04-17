import { FieldCategory, CalculationField} from "../../../../src/store/document/calculations/calculation-field";
import {
    addPressureCalculationFields,
    Calculation, PressureCalculation,
    PsdCalculation
} from "../../../../src/store/document/calculations/types";
import RiserEntity from "../../../../../common/src/api/document/entities/riser-entity";
import FlowSourceEntity from "../../../../../common/src/api/document/entities/flow-source-entity";
import { isGermanStandard } from "../../../../../common/src/api/config";
import { DrawingState } from "../../../../../common/src/api/document/drawing";
import { Units } from "../../../../../common/src/lib/measurements";

export default interface FlowSourceCalculation extends
    Calculation,
    PressureCalculation
{
    flowRateLS: number | null;
}

export function makeFlowSourceCalculationFields(entity: FlowSourceEntity, settings: DrawingState): CalculationField[] {
    const result: CalculationField[] = [];

    addPressureCalculationFields(result, entity.systemUid);

    result.push(
        {
            property: "flowRateLS",
            title: "Flow Rate",
            short: "",
            units: Units.LitersPerSecond,
            systemUid: entity.systemUid,
            category: FieldCategory.FlowRate
        },
    );

    return result;
}

export function emptyFlowSourceCalculation(): FlowSourceCalculation {
    return {
        flowRateLS: null,
        pressureKPA: null,
        staticPressureKPA: null,
        warning: null
    };
}
