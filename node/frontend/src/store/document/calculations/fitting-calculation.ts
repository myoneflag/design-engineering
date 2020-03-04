import { FieldCategory, CalculationField, Units } from "../../../../src/store/document/calculations/calculation-field";
import { Calculation, PsdCalculation } from "../../../../src/store/document/calculations/types";
import FittingEntity from "../../../../../common/src/api/document/entities/fitting-entity";
import { GlobalStore } from "../../../htmlcanvas/lib/global-store";

export default interface FittingCalculation extends Calculation {
    flowRateLS: number | null;
    pressureDropKPA: number | [number, number] | null;
    pressureKPA: number | null;
    pressureByEndpointKPA: {[key: string]: number | null};
}

export function makeFittingCalculationFields(entity: FittingEntity, globalStore: GlobalStore): CalculationField[] {
    if (globalStore.getConnections(entity.uid).length === 0) {
        return [];
    }
    return [
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
        {
            property: "pressureKPA",
            title: "Pressure",
            short: "",
            units: Units.KiloPascals,
            systemUid: entity.systemUid,
            category: FieldCategory.Pressure,
            defaultEnabled: true
        }
    ];
}

export function emptyFittingCalculation(): FittingCalculation {
    return {
        flowRateLS: null,
        pressureDropKPA: null,
        pressureKPA: null,
        warning: null,
        pressureByEndpointKPA: {},
    };
}
