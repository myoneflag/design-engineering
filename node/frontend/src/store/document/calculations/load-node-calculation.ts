import { FieldCategory, CalculationField} from "../../../../src/store/document/calculations/calculation-field";
import {
    addPressureCalculationFields,
    Calculation,
    PressureCalculation, PsdCalculation
} from "../../../../src/store/document/calculations/types";
import LoadNodeEntity, { NodeType } from "../../../../../common/src/api/document/entities/load-node-entity";
import { Units } from "../../../../../common/src/lib/measurements";
import { DrawingState } from "../../../../../common/src/api/document/drawing";
import { getPsdUnitName } from "../../../calculations/utils";
import { determineConnectableSystemUid } from "../entities/lib";
import { GlobalStore } from "../../../htmlcanvas/lib/global-store";

export default interface LoadNodeCalculation extends Calculation, PressureCalculation, PsdCalculation {
    flowRateLS: number | null;
}

export function makeLoadNodeCalculationFields(entity: LoadNodeEntity, settings: DrawingState, globalStore: GlobalStore): CalculationField[] {
    const result: CalculationField[] = [];

    addPressureCalculationFields(result, entity.systemUidOption || undefined, "", {defaultEnabled: true});

    result.push(
        {
            property: "flowRateLS",
            title: "Flow Rate",
            short: "",
            units: Units.LitersPerSecond,
            systemUid: determineConnectableSystemUid(globalStore, entity),
            category: FieldCategory.FlowRate
        }
    );

    const psdUnit = getPsdUnitName(settings.metadata.calculationParams.psdMethod);
    switch (entity.node.type) {
        case NodeType.LOAD_NODE:
            result.push({
                property: "psdUnits.units",
                title: psdUnit.name,
                short: psdUnit.abbreviation,
                units: Units.None,
                category: FieldCategory.LoadingUnits,
                systemUid: determineConnectableSystemUid(globalStore, entity),
            });
            break;
        case NodeType.DWELLING:
            result.push({
                property: "psdUnits.dwellings",
                title: "Dwellings",
                short: "dwlg",
                units: Units.None,
                category: FieldCategory.LoadingUnits,
                systemUid: determineConnectableSystemUid(globalStore, entity),
            });
            break;
    }

    return result;
}

export function emptyFixtureCalculation(): LoadNodeCalculation {
    return {
        pressureKPA: null,
        psdUnits: null,
        staticPressureKPA: null,
        flowRateLS: null,
        warning: null
    };
}
