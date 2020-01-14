import { FieldCategory, CalculationField, Units } from "../../../../src/store/document/calculations/calculation-field";
import { Calculation, PsdCalculation } from "../../../../src/store/document/calculations/types";
import RiserEntity from "../../../../../common/src/api/document/entities/riser-entity";
import FlowSourceEntity from "../../../../../common/src/api/document/entities/flow-source-entity";
import { isGermanStandard } from "../../../../../common/src/api/config";
import { DrawingState } from "../../../../../common/src/api/document/drawing";

export default interface FlowSourceCalculation extends Calculation {
    pressureKPA: number | null;
    flowRateLS: number | null;
}

export function makeFlowSourceCalculationFields(entity: FlowSourceEntity, settings: DrawingState): CalculationField[] {
    return [
        {
            property: "pressureKPA",
            title: "Pressure",
            short: "",
            units: Units.KiloPascals,
            systemUid: entity.systemUid,
            category: FieldCategory.Pressure
        },
        {
            property: "flowRateLS",
            title: "Flow Rate",
            short: "",
            units: Units.LitersPerSecond,
            systemUid: entity.systemUid,
            category: FieldCategory.FlowRate
        }
    ];
}

export function emptyFlowSourceCalculation(): FlowSourceCalculation {
    return {
        flowRateLS: null,
        pressureKPA: null,
        warning: null
    };
}
