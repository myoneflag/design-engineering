import {
    CalculationField,
    CalculationLayout,
    FieldCategory
} from "../../../../src/store/document/calculations/calculation-field";
import {
    addPressureCalculationFields,
    Calculation,
    PressureCalculation,
    PsdCalculation
} from "../../../../src/store/document/calculations/types";
import { DocumentState } from "../../../../src/store/document/types";
import RiserEntity, { fillRiserDefaults } from "../../../../../common/src/api/document/entities/riser-entity";
import {getDrainageUnitName, getPsdUnitName} from "../../../calculations/utils";
import { Units } from "../../../../../common/src/lib/measurements";
import { Catalog } from "../../../../../common/src/api/catalog/types";
import { isDrainage, LEVEL_HEIGHT_DIFF_M } from "../../../../../common/src/api/config";
import { GlobalStore } from "../../../htmlcanvas/lib/global-store";

export default interface RiserCalculation extends Calculation {
    heights: {
        [levelUid: string]: {
            flowRateLS: number | null;
            heightAboveGround: number | null;
            sizeMM: number | null;
            ventSizeMM: number | null;
        } & PressureCalculation & PsdCalculation;
    };
}

export function makeRiserCalculationFields(entity: RiserEntity, doc: DocumentState, catalog: Catalog | undefined, store: GlobalStore): CalculationField[] {
    const calc = store.getCalculation(entity);
    const filled = fillRiserDefaults(doc.drawing, entity);


    const drawing = doc.drawing;
    const result: CalculationField[] = [];

    const psdUnit = getPsdUnitName(drawing.metadata.calculationParams.psdMethod, doc.locale);
    const drainageUnit = getDrainageUnitName(doc.drawing.metadata.calculationParams.drainageMethod, doc.drawing.metadata.units.volumeMeasurementSystem);

    const lvlUid = doc.uiState.levelUid;
    const sortedLevels = Object.values(doc.drawing.levels).sort((a, b) => a.floorHeightM - b.floorHeightM);
    const lvlIndex = sortedLevels.findIndex((lvl) => lvl.uid === lvlUid);
    let lvlAboveUid: string | null = null;
    if (lvlIndex !== -1 && lvlIndex !== sortedLevels.length - 1) {
        lvlAboveUid = sortedLevels[lvlIndex + 1].uid;
    }
    const system = doc.drawing.metadata.flowSystems.find((s) => s.uid === entity.systemUid);

    const extendsToBottom = filled.bottomHeightM! < doc.drawing.levels[lvlUid!].floorHeightM;
    const extendsToTop = lvlAboveUid
        ? filled.topHeightM! > doc.drawing.levels[lvlAboveUid].floorHeightM
        : filled.topHeightM! > doc.drawing.levels[lvlUid!].floorHeightM + LEVEL_HEIGHT_DIFF_M;

    // TODO uncomment and fix DEV-325
    // addPressureCalculationFields(result, entity.systemUid, "heights." + lvlUid + ".", 
    // {
    //     title: "Pressure At Floor",
    //     short: "at floor",
    // }, 
    // { 
    //     title: "Static Pressure At Floor", 
    //     short: "at floor" 
    // });

    const layoutOptionDrainage: CalculationLayout[] = isDrainage(entity.systemUid) ? ['pressure', 'drainage'] : [];

    if (extendsToBottom) {

        result.push(
            {
                property: "heights." + lvlUid + ".flowRateLS",
                title: "Flow Rate To Below",
                short: "to below",
                units: Units.LitersPerSecond,
                systemUid: entity.systemUid,
                category: FieldCategory.FlowRate,
            },

        );

        if (drawing.metadata.calculationParams.psdMethod !== null) {
            result.push({
                property: "heights." + lvlUid + ".psdUnits.units",
                title: psdUnit.name + " To Below",
                short: psdUnit.abbreviation + " to below",
                units: Units.None,
                category: FieldCategory.LoadingUnits,
                systemUid: entity.systemUid,
                format: (v) => "" + Number((v?v:0).toFixed(5))
            });
        }

        if (isDrainage(entity.systemUid)) {
            result.push({
                property: "heights." + lvlUid + ".psdUnits.drainageUnits",
                title: drainageUnit.name + " To Below",
                short: drainageUnit.abbreviation + " to below",
                units: Units.None,
                category: FieldCategory.LoadingUnits,
                systemUid: entity.systemUid,
                layouts: layoutOptionDrainage,
                format: (v) => "" + Number((v?v:0).toFixed(5))
            });
        }
        if(doc.uiState.pressureOrDrainage==="pressure"){
            result.push({
                property: "heights." + lvlUid + ".sizeMM",
                title: "Size To Below",
                short: "\u00f8 to below",
                bold: true,
                units: Units.PipeDiameterMM,
                systemUid: entity.systemUid,
                category: FieldCategory.Size,
                hideUnits: true,
                layouts: ['drainage', 'pressure'],
                significantDigits: 0
            })
        }

        if (drawing.metadata.calculationParams.dwellingMethod !== null) {
            result.push({
                property: "heights." + lvlUid + ".psdUnits.dwellings",
                title: "Dwellings To Below",
                short: "dwlg to below",
                units: Units.None,
                category: FieldCategory.LoadingUnits,
                systemUid: entity.systemUid,
            });
        }
    }

    if (lvlAboveUid && extendsToTop) {

        result.push(
            {
                property: "heights." + lvlAboveUid + ".flowRateLS",
                title: "Flow Rate To Above",
                short: "\u00f8 to above",
                units: Units.LitersPerSecond,
                systemUid: entity.systemUid,
                category: FieldCategory.FlowRate,
                bold: true
            }
        );

        result.push(
            {
                property: "heights." + lvlAboveUid + ".sizeMM",
                title: "Size To Above",
                short: "to above",
                units: Units.PipeDiameterMM,
                systemUid: entity.systemUid,
                category: FieldCategory.Size,
                layouts: layoutOptionDrainage,
            }
        );

        if (drawing.metadata.calculationParams.psdMethod !== null) {
            result.push({
                property: "heights." + lvlAboveUid + ".psdUnits.units",
                title: psdUnit.name + " To Above",
                short: psdUnit.abbreviation + " to above",
                units: Units.None,
                category: FieldCategory.LoadingUnits,
                systemUid: entity.systemUid,
                format: (v) => "" + Number((v?v:0).toFixed(5)),
            });
        }

        if (isDrainage(entity.systemUid)) {
            result.push({
                property: "heights." + lvlAboveUid + ".psdUnits.drainageUnits",
                title: drainageUnit.name + " To Above",
                short: drainageUnit.abbreviation + " to above",
                units: Units.None,
                category: FieldCategory.LoadingUnits,
                systemUid: entity.systemUid,
                layouts: ['drainage'],
                format: (v) => "" + Number((v?v:0).toFixed(5)),
            });

            if (system && system.drainageProperties.stackDedicatedVent) {
                result.push({
                    property: "heights." + lvlAboveUid + ".ventSizeMM",
                    title: "Dedicated Vent Size",
                    short: "vent",
                    units: Units.PipeDiameterMM,
                    category: FieldCategory.LoadingUnits,
                    systemUid: entity.systemUid,
                    layouts: ['drainage'],
                });
            }
        }

        if (system) {
            result.push({
                property: "heights." + lvlAboveUid + ".psdUnits.dwellings",
                title: "Dwellings To Above",
                short: "dwlg to above",
                units: Units.None,
                category: FieldCategory.LoadingUnits,
                systemUid: entity.systemUid
            });
        }
    }

    if (isDrainage(entity.systemUid)) {
        if (doc.uiState.pressureOrDrainage === 'drainage') {
            return result.filter((f) => f.layouts && f.layouts.includes('drainage'));
        } else {
            return [];
        }
    }

    return result;
}

export function emptyRiserCalculations(): RiserCalculation {
    return {
        cost: null,
        costBreakdown: null,
        expandedEntities: null,

        warning: null,
        warningLayout: null,
        heights: {}
    };
}
