import { FieldCategory, CalculationField} from "../../../../src/store/document/calculations/calculation-field";
import { Calculation } from "../../../../src/store/document/calculations/types";
import { Units } from "../../../../../common/src/lib/measurements";
import { StandardFlowSystemUids } from "../../../../../common/src/api/config";
import GasApplianceEntity from "../../../../../common/src/api/document/entities/gas-appliance";

export default interface GasApplianceCalculation extends Calculation {
    demandMJH: number | null;
}

export function makeGasApplianceCalculationFields(entity: GasApplianceEntity): CalculationField[] {
    return [
        {
            property: "demandMJH",
            title: "Gas Demand",
            short: "",
            units: Units.MegajoulesPerHour,
            category: FieldCategory.FlowRate,
            systemUid: StandardFlowSystemUids.Gas,
            defaultEnabled: true,
        },
    ];
}

export function emptyGasApplianceCalculation(): GasApplianceCalculation {
    return {
        warnings: null,
        costBreakdown: null,
        cost: null, expandedEntities: null,
        demandMJH: null,
    };
}
