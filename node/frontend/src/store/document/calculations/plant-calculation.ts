import {CalculationField, FieldCategory} from "../../../../src/store/document/calculations/calculation-field";
import {Calculation} from "../../../../src/store/document/calculations/types";
import {Units} from "../../../../../common/src/lib/measurements";
import PlantEntity from "../../../../../common/src/api/document/entities/plants/plant-entity";
import {PlantType} from "../../../../../common/src/api/document/entities/plants/plant-types";
import {DocumentState} from "../types";
import {assertUnreachable} from "../../../../../common/src/api/config";

export default interface PlantCalculation extends Calculation {
    pressureDropKPA: number | null;
    circulationFlowRateLS: number | null;
    circulationPressureLoss: number | null;
    heatLossKW: number | null;
    manufacturer: string;

    gasFlowRateMJH: number | null;
    gasPressureKPA: number | null;

    size: string | null;
    model: string | null;
}

export function makePlantCalculationFields(value: PlantEntity, doc: DocumentState): CalculationField[] {
    let iAmDrainage = false;
    let iAmPressure = false;
    switch (value.plant.type) {
        case PlantType.RETURN_SYSTEM:
        case PlantType.TANK:
        case PlantType.PUMP:
            iAmPressure = true;
        case PlantType.CUSTOM:
            iAmDrainage = iAmPressure = true;
            break;
        case PlantType.DRAINAGE_PIT:
        case PlantType.DRAINAGE_GREASE_INTERCEPTOR_TRAP:
            iAmDrainage = true;
            break;
        default:
            assertUnreachable(value.plant);
    }

    if ((doc.uiState.pressureOrDrainage === 'pressure' && iAmPressure) ||
        (doc.uiState.pressureOrDrainage === 'drainage' && iAmDrainage)
    ) {

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

        if (value.plant.type === PlantType.DRAINAGE_GREASE_INTERCEPTOR_TRAP) {
            results.push(
                {
                    property: "size",
                    title: "Size",
                    short: "",
                    units: Units.None,
                    category: FieldCategory.GreaseInterceptorTrap,
                    layouts: ['drainage'],
                },
                {
                    property: "model",
                    title: "Model",
                    short: "",
                    units: Units.None,
                    category: FieldCategory.GreaseInterceptorTrap,
                    layouts: ['drainage'],
                },
            );
        }

        return results;
    } else {
        return [];
    }

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
        warningLayout: null,
        size: null,
        model: null,
    };
}
