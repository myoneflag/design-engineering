import { FieldCategory, CalculationField } from "../../../../src/store/document/calculations/calculation-field";
import {
    addPressureCalculationFields,
    Calculation,
    CalculationType,
    NameCalculation,
    PressureCalculation,
    PsdCalculation
} from "../../../../src/store/document/calculations/types";
import FittingEntity from "../../../../../common/src/api/document/entities/fitting-entity";
import { GlobalStore } from "../../../htmlcanvas/lib/global-store";
import { Units } from "../../../../../common/src/lib/measurements";
import { isGas } from "../../../../../common/src/api/config";
import { Catalog } from "../../../../../common/src/api/catalog/types";
import { DocumentState } from "../types";

export default interface FittingCalculation extends
    Calculation,
    PressureCalculation,
    NameCalculation {
    flowRateLS: number | null;
    pressureDropKPA: number | [number, number] | null;
    pressureByEndpointKPA: { [key: string]: number | null };
}

export function makeFittingCalculationFields(entity: FittingEntity, globalStore: GlobalStore, document: DocumentState, catalog: Catalog): CalculationField[] {
    if (globalStore.getConnections(entity.uid).length === 0) {
        return [];
    }
    const result: CalculationField[] = [];
    const fittingIsGas = catalog && isGas(entity.systemUid!, catalog.fluids, document.drawing.metadata.flowSystems);

    result.push(
        {
            property: "entityName",
            title: "Name",
            short: "",
            units: Units.None,
            category: FieldCategory.EntityName,
        },
    );

    if (!fittingIsGas) {
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

        result.push(
            {
                property: "pressureDropKPA",
                title: "Pressure Drop",
                short: "",
                units: Units.KiloPascals,
                systemUid: entity.systemUid,
                category: FieldCategory.Pressure,
                format: (v: number | [number, number] | null) => {
                    if (typeof v === 'number') {
                        return v.toFixed(3);
                    } else if (v === null) {
                        return '??';
                    } else {
                        return v[0].toFixed(3) + ' to ' + v[1].toFixed(3);
                    }
                }
            },
        );
        addPressureCalculationFields(result, entity.systemUid);
    }


    return result;
}

export function emptyFittingCalculation(): FittingCalculation {
    return {
        type: CalculationType.FittingCalculation,
        costBreakdown: null,
        cost: null,
        expandedEntities: null,

        flowRateLS: null,
        pressureDropKPA: null,
        pressureKPA: null,
        staticPressureKPA: null,
        warnings: null,
        pressureByEndpointKPA: {},
        entityName: null,
    };
}
