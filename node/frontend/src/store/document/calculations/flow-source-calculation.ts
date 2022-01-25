import { FieldCategory, CalculationField } from "../../../../src/store/document/calculations/calculation-field";
import {
    addPressureCalculationFields,
    Calculation, CalculationType, NameCalculation, PressureCalculation,
    PsdCalculation
} from "../../../../src/store/document/calculations/types";
import RiserEntity from "../../../../../common/src/api/document/entities/riser-entity";
import FlowSourceEntity from "../../../../../common/src/api/document/entities/flow-source-entity";
import { isDrainage, isGermanStandard } from "../../../../../common/src/api/config";
import { DrawingState } from "../../../../../common/src/api/document/drawing";
import { Units } from "../../../../../common/src/lib/measurements";
import { DocumentState } from "../types";

export default interface FlowSourceCalculation extends
    Calculation,
    PressureCalculation,
    NameCalculation {
    flowRateLS: number | null;
}

export function makeFlowSourceCalculationFields(entity: FlowSourceEntity, doc: DocumentState): CalculationField[] {
    if (isDrainage(entity.systemUid, doc.drawing.metadata.flowSystems) === (doc.uiState.pressureOrDrainage === 'drainage')) {

        const result: CalculationField[] = [];

        result.push(
            {
                property: "entityName",
                title: "Name",
                short: "",
                units: Units.None,
                category: FieldCategory.EntityName,
                systemUid: entity.systemUid,
                layouts: ['pressure', 'drainage'],
            },
        );

        addPressureCalculationFields(result, entity.systemUid, "", { defaultEnabled: true }, { defaultEnabled: true });

        result.push(
            {
                property: "flowRateLS",
                title: "Peak Flow Rate",
                short: "",
                units: Units.LitersPerSecond,
                systemUid: entity.systemUid,
                category: FieldCategory.FlowRate
            },
        );

        return result;
    } else {
        return [];
    }
}

export function emptyFlowSourceCalculation(): FlowSourceCalculation {
    return {
        type: CalculationType.FlowSourceCalculation,
        cost: null,
        costBreakdown: null,
        expandedEntities: null,

        flowRateLS: null,
        pressureKPA: null,
        staticPressureKPA: null,
        warnings: null,

        entityName: null
    };
}
