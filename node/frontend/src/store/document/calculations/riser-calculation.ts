import { CalculationField, FieldCategory, Units } from "../../../../src/store/document/calculations/calculation-field";
import { Calculation } from "../../../../src/store/document/calculations/types";
import { DrawingState } from "../../../../src/store/document/types";
import RiserEntity from "../entities/riser-entity";
import { getPsdUnitName } from "../../../calculations/utils";

export default interface RiserCalculation extends Calculation {
    heights: {
        [levelUid: string]: {
            pressureKPA: number | null;
            flowRateLS: number | null;
            heightAboveGround: number | null;
            psdUnits: number | null;
        };
    };
}

export function makeRiserCalculationFields(entity: RiserEntity, drawing: DrawingState): CalculationField[] {
    const result: CalculationField[] = [];

    const psdUnit = getPsdUnitName(drawing.metadata.calculationParams.psdMethod);

    for (const lvlUid of Object.keys(drawing.levels)) {
        result.push(
            {
                property: "heights." + lvlUid + ".pressureKPA",
                title: "Pressure (kPa)",
                short: "",
                units: Units.KiloPascals,
                systemUid: entity.systemUid,
                category: FieldCategory.Pressure
            },
            {
                property: "heights." + lvlUid + ".psdUnits",
                title: psdUnit.name,
                short: psdUnit.abbreviation,
                units: Units.None,
                systemUid: entity.systemUid,
                category: FieldCategory.LoadingUnits
            },
            {
                property: "heights." + lvlUid + ".flowRateLS",
                title: "Flow Rate (L/s)",
                short: "",
                units: Units.KiloPascals,
                systemUid: entity.systemUid,
                category: FieldCategory.Pressure
            },
            {
                property: "heights." + lvlUid + ".heightAboveGround",
                title: "Height Above Ground (m)",
                short: "",
                units: Units.Meters,
                systemUid: entity.systemUid,
                category: FieldCategory.Height
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
