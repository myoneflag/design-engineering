import { FieldCategory, CalculationField, Units } from "../../../../src/store/document/calculations/calculation-field";
import { Calculation, PsdCalculation } from "../../../../src/store/document/calculations/types";
import PipeEntity, { fillPipeDefaultFields } from "../../../../../common/src/api/document/entities/pipe-entity";
import { getPsdUnitName, PsdProfile } from "../../../calculations/utils";
import set = Reflect.set;
import { isGermanStandard } from "../../../../../common/src/api/config";
import { Catalog } from "../../../../../common/src/api/catalog/types";
import { DrawingState } from "../../../../../common/src/api/document/drawing";

export default interface PipeCalculation extends PsdCalculation, Calculation {
    peakFlowRate: number | null;
    rawPeakFlowRate: number | null;
    optimalInnerPipeDiameterMM: number | null;
    realNominalPipeDiameterMM: number | null;
    realInternalDiameterMM: number | null;
    pressureDropKpa: number | null;
    lengthM: number | null;
    flowFrom: string | null;

    psdProfile: PsdProfile | null;
    isRingMain: boolean | null;

    velocityRealMS: number | null;

    temperatureRange: string | null;
}

export function makePipeCalculationFields(
    entity: PipeEntity,
    settings: DrawingState,
    catalog?: Catalog
): CalculationField[] {
    const psdUnit = getPsdUnitName(settings.metadata.calculationParams.psdMethod);

    let materialName = "";
    if (catalog) {
        const pipe = fillPipeDefaultFields(settings, 0, entity);
        materialName = " (" + catalog.pipes[pipe.material!].abbreviation + ")";
    }

    const result = [
        {
            property: "peakFlowRate",
            title: "Flow Rate + Spare",
            short: "",
            units: Units.LitersPerSecond,
            category: FieldCategory.FlowRate,
            systemUid: entity.systemUid,
            defaultEnabled: true
        },/*
        {
            property: "rawPeakFlowRate",
            title: "Flow Rate (Raw)",
            short: "(Raw)",
            units: Units.LitersPerSecond,
            category: FieldCategory.FlowRate,
            systemUid: entity.systemUid,
            defaultEnabled: false,
            // format: (v: number | null) => "(" + (v === null ? "??" : v.toFixed(2)) + ")"
        },*/
        {
            property: "realNominalPipeDiameterMM",
            title: "Pipe Diameter",
            short: "\u00f8" + materialName!,
            hideUnits: true,
            units: Units.Millimeters,
            category: FieldCategory.Size,
            significantDigits: 0,
            bold: true,
            systemUid: entity.systemUid,
            defaultEnabled: true
        },
        {
            property: "realInternalDiameterMM",
            title: "Internal Diameter",
            short: "Internal",
            units: Units.Millimeters,
            category: FieldCategory.Size,
            systemUid: entity.systemUid
        },
        {
            property: "pressureDropKpa",
            title: "Pressure Drop",
            short: "Drop",
            units: Units.KiloPascals,
            category: FieldCategory.Pressure,
            systemUid: entity.systemUid
        },

        {
            property: "lengthM",
            title: "Length",
            short: "",
            units: Units.Meters,
            category: FieldCategory.Size,
            systemUid: entity.systemUid
        },
        {
            property: "velocityRealMS",
            title: "Velocity",
            short: "",
            units: Units.MetersPerSecond,
            category: FieldCategory.Velocity,
            systemUid: entity.systemUid
        },
        {
            property: "temperatureRange",
            title: "Temperature Range",
            short: "",
            units: Units.Celsius,
            category: FieldCategory.Temperature,
            systemUid: entity.systemUid
        },

        /*
        {
            property: "psdUnits.continuousFlowLS",
            title: "Continuous Flow",
            short: "C. Flow",
            units: Units.LitersPerSecond,
            category: FieldCategory.LoadingUnits,
            systemUid: entity.systemUid
        }*/
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

export function emptyPipeCalculation(): PipeCalculation {
    return {
        peakFlowRate: null,
        rawPeakFlowRate: null,
        psdUnits: null,
        optimalInnerPipeDiameterMM: null,
        realInternalDiameterMM: null,
        pressureDropKpa: null,
        realNominalPipeDiameterMM: null,
        lengthM: null,
        temperatureRange: null,
        isRingMain: null,
        velocityRealMS: null,
        warning: null,
        psdProfile: null,
        flowFrom: null,
    };
}
