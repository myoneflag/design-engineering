import { FieldCategory, CalculationField, Units } from "../../../../src/store/document/calculations/calculation-field";
import { Calculation, PsdCalculation } from "../../../../src/store/document/calculations/types";
import { isGermanStandard } from "../../../../src/config";
import { DrawingState } from "../../../../src/store/document/types";
import { SystemNodeEntity } from "../entities/big-valve/big-valve-entity";
import { getPsdUnitName } from "../../../calculations/utils";
import set = Reflect.set;

export default interface SystemNodeCalculation extends PsdCalculation, Calculation {
    pressureKPA: number | null;
    flowRateLS: number | null;
}

export function makeSystemNodeCalculationFields(entity: SystemNodeEntity, settings: DrawingState): CalculationField[] {
    const psdUnit = getPsdUnitName(settings.metadata.calculationParams.psdMethod);
    const result = [
        {
            property: "pressureKPA",
            title: "Pressure",
            short: "",
            units: Units.KiloPascals,
            systemUid: entity.systemUid,
            category: FieldCategory.Pressure
        },
        {
            property: "flowRateLS",
            title: "Flow Rate",
            short: "",
            units: Units.LitersPerSecond,
            systemUid: entity.systemUid,
            category: FieldCategory.FlowRate
        },
    ];


    if (settings.metadata.calculationParams.psdMethod !== null) {
        result.push(
            {
                property: "psdUnits.units",
                title: psdUnit.name,
                short: psdUnit.abbreviation,
                units: Units.None,
                category: FieldCategory.LoadingUnits,
                systemUid: entity.systemUid
            }
        );
    }

    if (settings.metadata.calculationParams.dwellingMethod !== null) {
        result.push(
            {
                property: "psdUnits.dwellings",
                title: 'Dwellings',
                short: 'dwlg',
                units: Units.None,
                category: FieldCategory.LoadingUnits,
                systemUid: entity.systemUid
            },
        );
    }

    return result;
}

export function emptySystemNodeCalculation(): SystemNodeCalculation {
    return {
        flowRateLS: null,
        psdUnits: null,
        pressureKPA: null,
        warning: null
    };
}
