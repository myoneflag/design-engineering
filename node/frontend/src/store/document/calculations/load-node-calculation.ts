import { FieldCategory, CalculationField } from "../../../../src/store/document/calculations/calculation-field";
import {
    addPressureCalculationFields,
    Calculation,
    CalculationType,
    PressureCalculation, PsdCalculation
} from "../../../../src/store/document/calculations/types";
import LoadNodeEntity, { NodeType } from "../../../../../common/src/api/document/entities/load-node-entity";
import { Units } from "../../../../../common/src/lib/measurements";
import { DrawingState } from "../../../../../common/src/api/document/drawing";
import { getPsdUnitName } from "../../../calculations/utils";
import { determineConnectableSystemUid } from "../entities/lib";
import { GlobalStore } from "../../../htmlcanvas/lib/global-store";
import { isDrainage, isGas } from "../../../../../common/src/api/config";
import { Catalog } from "../../../../../common/src/api/catalog/types";
import { DocumentState } from "../types";

export default interface LoadNodeCalculation extends Calculation, PressureCalculation, PsdCalculation {
    flowRateLS: number | null;
    gasFlowRateMJH: number | null;
}

export function makeLoadNodeCalculationFields(entity: LoadNodeEntity, doc: DocumentState, catalog: Catalog, globalStore: GlobalStore): CalculationField[] {
    const result: CalculationField[] = [];

    const systemUid = determineConnectableSystemUid(globalStore, entity);

    if (isDrainage(systemUid!, doc.drawing.metadata.flowSystems) === (doc.uiState.pressureOrDrainage === 'drainage')) {
        result.push({
            property: "reference",
            title: "Reference",
            short: "",
            shortTitle: "",
            units: Units.None,
            category: FieldCategory.EntityName,
            systemUid: systemUid,
            layouts: ['pressure', 'drainage'],
            defaultEnabled: true
        });
    }

    addPressureCalculationFields(result, entity.systemUidOption || undefined, "", { defaultEnabled: true }, { defaultEnabled: true });

    const thisIsGas = isGas(systemUid!, catalog.fluids, doc.drawing.metadata.flowSystems);

    if (thisIsGas) {
        result.push(
            {
                property: "gasFlowRateMJH",
                title: "Flow Rate",
                short: "",
                units: Units.MegajoulesPerHour,
                systemUid,
                category: FieldCategory.FlowRate
            }
        );
    } else {
        result.push(
            {
                property: "flowRateLS",
                title: "Flow Rate",
                short: "",
                units: Units.LitersPerSecond,
                systemUid,
                category: FieldCategory.FlowRate
            }
        );
    }

    const psdUnit = getPsdUnitName(doc.drawing.metadata.calculationParams.psdMethod, doc.locale);
    switch (entity.node.type) {
        case NodeType.LOAD_NODE:
            if (!thisIsGas) {
                result.push({
                    property: "psdUnits.units",
                    title: psdUnit.name,
                    short: psdUnit.abbreviation,
                    units: Units.None,
                    category: FieldCategory.LoadingUnits,
                    systemUid,
                });
            }
            break;
        case NodeType.DWELLING:
            result.push({
                property: "psdUnits.dwellings",
                title: "Dwellings",
                short: "dwlg",
                units: Units.None,
                category: FieldCategory.LoadingUnits,
                systemUid,
            });
            break;
    }

    return result;
}

export function emptyLoadNodeCalculation(): LoadNodeCalculation {
    return {
        type: CalculationType.LoadNodeCalculation,
        costBreakdown: null,
        cost: null,
        expandedEntities: null,

        pressureKPA: null,
        psdUnits: null,
        staticPressureKPA: null,
        flowRateLS: null,
        gasFlowRateMJH: null,
        warnings: null,
    };
}
