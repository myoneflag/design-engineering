import { FieldCategory, CalculationField} from "../../../../src/store/document/calculations/calculation-field";
import {
    addPressureCalculationFields,
    Calculation,
    PressureCalculation
} from "../../../../src/store/document/calculations/types";
import FixtureEntity from "../../../../../common/src/api/document/entities/fixtures/fixture-entity";
import { DocumentState } from "../types";
import { GlobalStore } from "../../../htmlcanvas/lib/global-store";
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
        },
    ];
}

export function emptyGasApplianceCalculation(): GasApplianceCalculation {
    return {
        warning: null,
        costBreakdown: null,
        cost: null, expandedEntities: null,
        demandMJH: null,
    };
}