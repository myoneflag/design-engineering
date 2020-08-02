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
    // Nada
}

export function makeGasApplianceCalculationFields(entity: GasApplianceEntity): CalculationField[] {
    return [];
}

export function emptyGasApplianceCalculation(): GasApplianceCalculation {
    return {warning: null};
}
