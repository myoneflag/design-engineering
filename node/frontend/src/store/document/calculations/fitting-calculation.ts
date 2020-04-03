import { FieldCategory, CalculationField, Units } from "../../../../src/store/document/calculations/calculation-field";
import {
    addPressureCalculationFields,
    Calculation,
    PressureCalculation,
    PsdCalculation
} from "../../../../src/store/document/calculations/types";
import FittingEntity from "../../../../../common/src/api/document/entities/fitting-entity";
import { GlobalStore } from "../../../htmlcanvas/lib/global-store";

export default interface FittingCalculation extends
    Calculation,
    PressureCalculation
{
    flowRateLS: number | null;
    pressureDropKPA: number | [number, number] | null;
    pressureByEndpointKPA: {[key: string]: number | null};
}

export function makeFittingCalculationFields(entity: FittingEntity, globalStore: GlobalStore): CalculationField[] {
    if (globalStore.getConnections(entity.uid).length === 0) {
        return [];
    }
    const result: CalculationField[] = [];

    result.push(
        {
            property: "flowRateLS",
            title: "Flow Rate",
            short: "",
            units: Units.LitersPerSecond,
            systemUid: entity.systemUid,
            category: FieldCategory.FlowRate
        },
        {
            property: "pressureDropKPA",
            title: "Pressure Drop",
            short: "Drop",
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

    return result;
}

export function emptyFittingCalculation(): FittingCalculation {
    return {
        flowRateLS: null,
        pressureDropKPA: null,
        pressureKPA: null,
        staticPressureKPA: null,
        warning: null,
        pressureByEndpointKPA: {},
    };
}
