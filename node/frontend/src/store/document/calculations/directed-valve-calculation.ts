import { CalculationField, FieldCategory, Units } from "../../../../src/store/document/calculations/calculation-field";
import DirectedValveEntity from "../../../../src/store/document/entities/directed-valves/directed-valve-entity";
import { Calculation } from "../../../../src/store/document/calculations/types";
import { ValveType } from "../entities/directed-valves/valve-types";

export default interface DirectedValveCalculation extends Calculation {
    flowRateLS: number | null;
    pressureDropKPA: number | null;
    pressureKPA: number | null;
    sizeMM: number | null;
}

export function makeDirectedValveCalculationFields(entity: DirectedValveEntity): CalculationField[] {
    let fields: CalculationField[] = [
        {
            property: "flowRateLS",
            title: "Flow Rate",
            short: "",
            units: Units.LitersPerSecond,
            category: FieldCategory.FlowRate
        },
        {
            property: "pressureDropKPA",
            title: "Pressure Drop",
            short: "Drop",
            units: Units.KiloPascals,
            category: FieldCategory.Pressure
        },
        {
            property: "pressureKPA",
            title: "Pressure",
            short: "In",
            units: Units.KiloPascals,
            category: FieldCategory.Pressure
        }
    ];
    if (entity.systemUidOption) {
        fields = fields.map((f) => {
            f.systemUid = entity.systemUidOption!;
            return f;
        });
    }

    if (
        entity.valve.type === ValveType.RPZD_DOUBLE_SHARED ||
        entity.valve.type === ValveType.RPZD_DOUBLE_ISOLATED ||
        entity.valve.type === ValveType.RPZD_SINGLE
    ) {
        fields.push({
            property: "sizeMM",
            title: "Size (mm)",
            short: "",
            units: Units.Millimeters,
            category: FieldCategory.Size
        });
    }

    return fields;
}

export function emptyDirectedValveCalculation(): DirectedValveCalculation {
    return {
        flowRateLS: null,
        pressureDropKPA: null,
        pressureKPA: null,
        warning: null,
        sizeMM: null
    };
}
