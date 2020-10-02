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
import {isGas} from "../../../../../common/src/api/config";
import {Catalog} from "../../../../../common/src/api/catalog/types";

export default interface LoadNodeCalculation extends Calculation, PressureCalculation, PsdCalculation {
    flowRateLS: number | null;
    gasFlowRateMJH: number | null;
}

export function makeLoadNodeCalculationFields(entity: LoadNodeEntity, settings: DrawingState, catalog: Catalog, globalStore: GlobalStore): CalculationField[] {
    const result: CalculationField[] = [];

    const systemUid =  determineConnectableSystemUid(globalStore, entity);
    addPressureCalculationFields(result, entity.systemUidOption || undefined, "", {defaultEnabled: true}, {defaultEnabled: true});

    const system = settings.metadata.flowSystems.find((f) => f.uid === systemUid);
    const thisIsGas = isGas(system ? system.fluid : 'water', catalog);

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

    const psdUnit = getPsdUnitName(settings.metadata.calculationParams.psdMethod);
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
        costBreakdown: null,
        cost: null,
        expandedEntities: null,

        pressureKPA: null,
        psdUnits: null,
        staticPressureKPA: null,
        flowRateLS: null,
        gasFlowRateMJH: null,
        warning: null
    };
}
