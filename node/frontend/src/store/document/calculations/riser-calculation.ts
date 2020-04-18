import { CalculationField, FieldCategory} from "../../../../src/store/document/calculations/calculation-field";
import {
    addPressureCalculationFields,
    Calculation,
    PressureCalculation,
    PsdCalculation
} from "../../../../src/store/document/calculations/types";
import { DocumentState } from "../../../../src/store/document/types";
import RiserEntity from "../../../../../common/src/api/document/entities/riser-entity";
import { getPsdUnitName, PsdCountEntry } from "../../../calculations/utils";
import { isSupportedDwellingStandard } from "../../../config";
import { DrawingState } from "../../../../../common/src/api/document/drawing";
import { Units } from "../../../../../common/src/lib/measurements";
import { fillPipeDefaultFields } from "../../../../../common/src/api/document/entities/pipe-entity";
import { Catalog } from "../../../../../common/src/api/catalog/types";

export default interface RiserCalculation extends Calculation {
    heights: {
        [levelUid: string]: {
            flowRateLS: number | null;
            heightAboveGround: number | null;
            sizeMM: number | null;
        } & PressureCalculation & PsdCalculation;
    };
}

export function makeRiserCalculationFields(entity: RiserEntity, doc: DocumentState, catalog: Catalog | undefined): CalculationField[] {
    const drawing = doc.drawing;
    const result: CalculationField[] = [];

    const psdUnit = getPsdUnitName(drawing.metadata.calculationParams.psdMethod);

    const lvlUid = doc.uiState.levelUid;
    const sortedLevels = Object.values(doc.drawing.levels).sort((a, b) => a.floorHeightM - b.floorHeightM);
    const lvlIndex = sortedLevels.findIndex((lvl) => lvl.uid === lvlUid);
    let lvlAboveUid: string | null = null;
    if (lvlIndex !== -1 && lvlIndex !== sortedLevels.length - 1) {
        lvlAboveUid = sortedLevels[lvlIndex + 1].uid;
    }

    addPressureCalculationFields(result, entity.systemUid, "heights." + lvlUid + ".", {defaultEnabled: true}, {defaultEnabled: true});

    result.push(
        {
            property: "heights." + lvlUid + ".heightAboveGround",
            title: "Height Above Ground",
            short: "",
            units: Units.Meters,
            systemUid: entity.systemUid,
            category: FieldCategory.Height
        },
        {
            property: "heights." + lvlUid + ".flowRateLS",
            title: "Flow Rate To Below",
            short: "to below",
            units: Units.LitersPerSecond,
            systemUid: entity.systemUid,
            category: FieldCategory.FlowRate,
            defaultEnabled: true
        },
        {
            property: "heights." + lvlUid + ".sizeMM",
            title: "Size To Below",
            short: "\u00f8 to below",
            bold: true,
            units: Units.PipeDiameterMM,
            systemUid: entity.systemUid,
            category: FieldCategory.Size,
            defaultEnabled: true,
            hideUnits: true,
            significantDigits: 0,
        }
    );

    if (drawing.metadata.calculationParams.psdMethod !== null) {
        result.push({
            property: "heights." + lvlUid + ".psdUnits.units",
            title: psdUnit.name + " To Below",
            short: psdUnit.abbreviation + " to below",
            units: Units.None,
            category: FieldCategory.LoadingUnits,
            systemUid: entity.systemUid,
            format: (v) => "" + Number(v.toFixed(5)),
        });
    }

    if (drawing.metadata.calculationParams.dwellingMethod !== null) {
        result.push({
            property: "heights." + lvlUid + ".psdUnits.dwellings",
            title: "Dwellings To Below",
            short: "dwlg to below",
            units: Units.None,
            category: FieldCategory.LoadingUnits,
            systemUid: entity.systemUid,
            defaultEnabled: true
        });
    }

    if (lvlAboveUid) {

        result.push(
            {
                property: "heights." + lvlAboveUid + ".flowRateLS",
                title: "Flow Rate To Above",
                short: "\u00f8 to above",
                units: Units.LitersPerSecond,
                systemUid: entity.systemUid,
                category: FieldCategory.FlowRate,
                bold: true,
            },
        );

        result.push(
            {
                property: "heights." + lvlAboveUid + ".sizeMM",
                title: "Size To Above",
                short: "to above",
                units: Units.PipeDiameterMM,
                systemUid: entity.systemUid,
                category: FieldCategory.Size
            },
        );

        if (drawing.metadata.calculationParams.psdMethod !== null) {
            result.push({
                property: "heights." + lvlAboveUid + ".psdUnits.units",
                title: psdUnit.name + " To Above",
                short: psdUnit.abbreviation + " to above",
                units: Units.None,
                category: FieldCategory.LoadingUnits,
                systemUid: entity.systemUid,
            });
        }

        if (drawing.metadata.calculationParams.dwellingMethod !== null) {
            result.push({
                property: "heights." + lvlAboveUid + ".psdUnits.dwellings",
                title: "Dwellings To Above",
                short: "dwlg to above",
                units: Units.None,
                category: FieldCategory.LoadingUnits,
                systemUid: entity.systemUid,
            });
        }
    }

    return result;
}

export function emptyRiserCalculations(): RiserCalculation {
    return {
        warning: null,
        heights: {}
    };
}
