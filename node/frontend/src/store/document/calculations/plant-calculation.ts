import {CalculationField, FieldCategory} from "../../../../src/store/document/calculations/calculation-field";
import {Calculation} from "../../../../src/store/document/calculations/types";
import {Units} from "../../../../../common/src/lib/measurements";
import PlantEntity from "../../../../../common/src/api/document/entities/plants/plant-entity";
import {PlantType} from "../../../../../common/src/api/document/entities/plants/plant-types";

export default interface PlantCalculation extends Calculation {
    pressureDropKPA: number | null;
    circulationFlowRateLS: number | null;
    circulationPressureLoss: number | null;
    heatLossKW: number | null;
    manufacturer: string;

    gasFlowRateMJH: number | null;
    gasPressureKPA: number | null;
}

export function makePlantCalculationFields(value: PlantEntity): CalculationField[] {
    const results: CalculationField[] = [
        {
            property: "pressureDropKPA",
            title: "Pressure Drop",
            short: "",
            units: Units.KiloPascals,
            category: FieldCategory.Pressure
        },

        {
            property: "circulationFlowRateLS",
            title: "Return System Duty Flow Rate",
            short: "(rtn)",
            units: Units.LitersPerSecond,
            category: FieldCategory.FlowRate,
            defaultEnabled: true,
        },
        {
            property: "circulationPressureLoss",
            title: "Return System Pressure Loss",
            short: "(rtn drop)",
            units: Units.KiloPascals,
            category: FieldCategory.Pressure,
            defaultEnabled: true,
        },

        {
            property: "heatLossKW",
            title: "Return Heat Loss",
            short: "",
            units: Units.KiloWatts,
            category: FieldCategory.HeatLoss
        },
    ];

    if (value.plant.type === PlantType.RETURN_SYSTEM) {
        results.push(
            {
                property: "gasFlowRateMJH",
                title: "Gas Demand",
                short: "gas",
                units: Units.MegajoulesPerHour,
                category: FieldCategory.FlowRate,
            },

            {
                property: "gasPressureKPA",
                title: "Gas Pressure",
                short: "gas",
                units: Units.KiloPascals,
                category: FieldCategory.FlowRate,
            },
        );
    }


    return results;
}

export function emptyPlantCalculation(): PlantCalculation {
    return {
        cost: null,
        costBreakdown: null,
        expandedEntities: null,

        gasFlowRateMJH: null,
        gasPressureKPA: null,

        pressureDropKPA: null,
        circulationFlowRateLS: null,
        circulationPressureLoss: null,
        heatLossKW: null,
        manufacturer: '',
        warning: null,
    };
}
