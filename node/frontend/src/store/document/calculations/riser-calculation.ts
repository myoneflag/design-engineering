import { CalculationField, FieldCategory, Units } from "../../../../src/store/document/calculations/calculation-field";
import { Calculation } from "../../../../src/store/document/calculations/types";
import { DocumentState, DrawingState } from "../../../../src/store/document/types";
import RiserEntity from "../entities/riser-entity";
import { getPsdUnitName, PsdCountEntry } from "../../../calculations/utils";
import { isSupportedDwellingStandard } from "../../../config";

export default interface RiserCalculation extends Calculation {
    heights: {
        [levelUid: string]: {
            pressureKPA: number | null;
            flowRateLS: number | null;
            heightAboveGround: number | null;
            psdUnits: PsdCountEntry | null;
        };
    };
}

export function makeRiserCalculationFields(entity: RiserEntity, doc: DocumentState): CalculationField[] {
    const drawing = doc.drawing;
    const result: CalculationField[] = [];

    const psdUnit = getPsdUnitName(drawing.metadata.calculationParams.psdMethod);

    const lvlUid = doc.uiState.levelUid;

    result.push(
        {
            property: "heights." + lvlUid + ".pressureKPA",
            title: "Pressure At Floor",
            short: "",
            units: Units.KiloPascals,
            systemUid: entity.systemUid,
            category: FieldCategory.Pressure,
            defaultEnabled: true,
        },
        {
            property: "heights." + lvlUid + ".flowRateLS",
            title: "Flow Rate At Floor",
            short: "",
            units: Units.LitersPerSecond,
            systemUid: entity.systemUid,
            category: FieldCategory.FlowRate,
            defaultEnabled: true,
        },
        {
            property: "heights." + lvlUid + ".heightAboveGround",
            title: "Height Above Ground",
            short: "",
            units: Units.Meters,
            systemUid: entity.systemUid,
            category: FieldCategory.Height,
        },
    );

    if (drawing.metadata.calculationParams.psdMethod !== null) {
        result.push(
            {
                property: "heights." + lvlUid + ".psdUnits.units",
                title: psdUnit.name + ' At Floor',
                short: psdUnit.abbreviation,
                units: Units.None,
                category: FieldCategory.LoadingUnits,
                systemUid: entity.systemUid,
                defaultEnabled: true,
            },
        );
    }

    if (drawing.metadata.calculationParams.dwellingMethod !== null) {
        result.push(
            {
                property: "heights." + lvlUid + ".psdUnits.dwellings",
                title: 'Dwellings',
                short: 'dwlg',
                units: Units.None,
                category: FieldCategory.LoadingUnits,
                systemUid: entity.systemUid,
                defaultEnabled: true,
            }
        );
    }
    return result;
}

export function emptyRiserCalculations(): RiserCalculation {
    return {
        warning: null,
        heights: {}
    };
}
