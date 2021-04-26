import { FieldCategory, CalculationField} from "../../../../src/store/document/calculations/calculation-field";
import {
    addPressureCalculationFields,
    Calculation, PressureCalculation,
    PsdCalculation
} from "../../../../src/store/document/calculations/types";
import { SystemNodeEntity } from "../../../../../common/src/api/document/entities/big-valve/big-valve-entity";
import { getPsdUnitName } from "../../../calculations/utils";
import set = Reflect.set;
import { isGermanStandard } from "../../../../../common/src/api/config";
import { DrawingState } from "../../../../../common/src/api/document/drawing";
import { Units } from "../../../../../common/src/lib/measurements";
import { DocumentState } from "../types";

export default interface SystemNodeCalculation extends
    PsdCalculation,
    Calculation,
    PressureCalculation {
    flowRateLS: number | null;
}

export function makeSystemNodeCalculationFields(entity: SystemNodeEntity, doc: DocumentState): CalculationField[] {
    const psdUnit = getPsdUnitName(doc.drawing.metadata.calculationParams.psdMethod, doc.locale);
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

    if (doc.drawing.metadata.calculationParams.psdMethod !== null) {
        result.push({
            property: "psdUnits.units",
            title: psdUnit.name,
            short: psdUnit.abbreviation,
            units: Units.None,
            category: FieldCategory.LoadingUnits,
            systemUid: entity.systemUid
        });
    }

    if (doc.drawing.metadata.calculationParams.dwellingMethod !== null) {
        result.push({
            property: "psdUnits.dwellings",
            title: "Dwellings",
            short: "dwlg",
            units: Units.None,
            category: FieldCategory.LoadingUnits,
            systemUid: entity.systemUid
        });
    }

    return result;
}

export function emptySystemNodeCalculation(): SystemNodeCalculation {
    return {
        cost: null,
        costBreakdown: null,
        expandedEntities: null,

        flowRateLS: null,
        psdUnits: null,
        pressureKPA: null,
        staticPressureKPA: null,
        warning: null,
        warningLayout: null,
    };
}
