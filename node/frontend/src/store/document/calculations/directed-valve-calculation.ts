import { CalculationField, FieldCategory} from "../../../../src/store/document/calculations/calculation-field";
import DirectedValveEntity from "../../../../../common/src/api/document/entities/directed-valves/directed-valve-entity";
import {
    addPressureCalculationFields,
    Calculation,
    PressureCalculation
} from "../../../../src/store/document/calculations/types";
import { ValveType } from "../../../../../common/src/api/document/entities/directed-valves/valve-types";
import { assertUnreachable } from "../../../../../common/src/api/config";
import { determineConnectableSystemUid } from "../entities/lib";
import { GlobalStore } from "../../../htmlcanvas/lib/global-store";
import { Units } from "../../../../../common/src/lib/measurements";

export default interface DirectedValveCalculation extends Calculation, PressureCalculation {
    flowRateLS: number | null;
    pressureDropKPA: number | null;
    kvValue: number | null;
    sizeMM: number | null;
}

export function makeDirectedValveCalculationFields(entity: DirectedValveEntity, globalStore: GlobalStore): CalculationField[] {
    let fields: CalculationField[] = [
        {
            property: "flowRateLS",
            title: "Flow Rate",
            short: "",
            units: Units.LitersPerSecond,
            category: FieldCategory.FlowRate
        },
    ];

    if (entity.valve.type === ValveType.BALANCING) {
        fields.push({
            property: "kvValue",
            title: "Kv Value",
            short: "",
            defaultEnabled: true,
            units: Units.Kv,
            category: FieldCategory.Pressure
        });
    }

    addPressureCalculationFields(fields, determineConnectableSystemUid(globalStore, entity), "", {short: "In", defaultEnabled: true});

    if (entity.systemUidOption) {
        fields = fields.map((f) => {
            f.systemUid = entity.systemUidOption!;
            return f;
        });
    }

    switch (entity.valve.type) {
        case ValveType.CHECK_VALVE:
        case ValveType.ISOLATION_VALVE:
        case ValveType.WATER_METER:
        case ValveType.STRAINER:
        case ValveType.BALANCING:
            break;
        case ValveType.RPZD_SINGLE:
        case ValveType.RPZD_DOUBLE_SHARED:
        case ValveType.RPZD_DOUBLE_ISOLATED:
        case ValveType.PRV_SINGLE:
        case ValveType.PRV_DOUBLE:
        case ValveType.PRV_TRIPLE:
            fields.push({
                property: "sizeMM",
                title: "Size (mm)",
                short: "",
                units: Units.Millimeters,
                category: FieldCategory.Size
            });
            break;
        default:
            assertUnreachable(entity.valve);
    }

    return fields;
}

export function emptyDirectedValveCalculation(): DirectedValveCalculation {
    return {
        flowRateLS: null,
        pressureDropKPA: null,
        staticPressureKPA: null,
        kvValue: null,
        pressureKPA: null,
        warning: null,
        sizeMM: null
    };
}
