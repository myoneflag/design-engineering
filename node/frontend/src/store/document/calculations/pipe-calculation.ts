import { Pipe as PipeObject } from './../../../../../common/src/api/document/drawing';
import { FieldCategory, CalculationField} from "../../../../src/store/document/calculations/calculation-field";
import { Calculation, PsdCalculation } from "../../../../src/store/document/calculations/types";
import PipeEntity, { fillPipeDefaultFields } from "../../../../../common/src/api/document/entities/pipe-entity";
import { getPsdUnitName, PsdProfile } from "../../../calculations/utils";
import set = Reflect.set;
import { assertUnreachable, isGermanStandard } from "../../../../../common/src/api/config";
import { Catalog, Manufacturer } from "../../../../../common/src/api/catalog/types";
import { DrawingState, MeasurementSystem, UnitsParameters } from "../../../../../common/src/api/document/drawing";
import { GlobalStore } from "../../../htmlcanvas/lib/global-store";
import { globalStore } from "../mutations";
import { convertPipeDiameterFromMetric, mm2IN, Units } from "../../../../../common/src/lib/measurements";

export enum NoFlowAvailableReason {
    NO_SOURCE = "NO_SOURCE",
    NO_LOADS_CONNECTED = "NO_LOADS_CONNECTED",
    TOO_MANY_FLOW_SOURCES = "TOO_MANY_FLOW_SOURCES",
    UNUSUAL_CONFIGURATION = "UNUSUAL_CONFIGURATION",
    NO_ISOLATION_VALVES_ON_MAIN = "NO_ISOLATION_VALVES_ON_MAIN",
    LOADING_UNITS_OUT_OF_BOUNDS = "LOADING_UNITS_OUT_OF_BOUNDS",
    NO_SUITABLE_PIPE_SIZE = "NO_SUITABLE_PIPE_SIZE",
    INVALID_RETURN_NETWORK = "INVALID_RETURN_NETWORK",
    NONE = '',
}

export enum Configuration {
    NORMAL = 'NORMAL',
    RING_MAIN = 'RING_MAIN',
    RETURN = 'RETURN',
}

export default interface PipeCalculation extends PsdCalculation, Calculation {
    totalPeakFlowRateLS: number | null;
    PSDFlowRateLS: number | null;

    noFlowAvailableReason: NoFlowAvailableReason | null;

    heightM: number | null;

    rawPSDFlowRateLS: number | null;
    rawReturnFlowRateLS: number | null;
    optimalInnerPipeDiameterMM: number | null;
    realNominalPipeDiameterMM: number | null;
    realInternalDiameterMM: number | null;
    realOutsideDiameterMM: number | null;
    pressureDropKPA: number | null;
    lengthM: number | null;
    flowFrom: string | null;

    psdProfile: PsdProfile | null;
    configuration: Configuration | null;

    velocityRealMS: number | null;

    temperatureRange: string | null;
}

export function makePipeCalculationFields(
    entity: PipeEntity,
    settings: DrawingState,
    catalog: Catalog | undefined,
    globalStore: GlobalStore,
): CalculationField[] {
    const psdUnit = getPsdUnitName(settings.metadata.calculationParams.psdMethod);

    let materialName = "";
    if (catalog) {
        const pipe = fillPipeDefaultFields(settings, 0, entity);
        const manufacturer = settings.metadata.catalog.pipes.find((pipeObj: PipeObject) => pipeObj.uid === pipe.material)?.manufacturer || 'generic';
        const abbreviation = manufacturer !== 'generic' && catalog.pipes[pipe.material!].manufacturer.find((manufacturerObj: Manufacturer) => manufacturerObj.uid === manufacturer)?.abbreviation || catalog.pipes[pipe.material!].abbreviation;
        materialName = " (" + abbreviation + ")";
    }

    const pCalc = globalStore.getOrCreateCalculation(entity);

    const result: CalculationField[] = [];

    if (pCalc.totalPeakFlowRateLS) {
        result.push(
            {
                property: "PSDFlowRateLS",
                title: "Flow Rate + Spare",
                short: "",
                units: Units.LitersPerSecond,
                category: FieldCategory.FlowRate,
                systemUid: entity.systemUid,
                defaultEnabled: true
            }
        );
    }

    result.push(
        {
            property: "heightM",
            title: "Height Above Floor",
            short: "height",
            units: Units.Meters,
            category: FieldCategory.Location,
            systemUid: entity.systemUid,
            defaultEnabled: true,
        },
    );

    if (pCalc.configuration === Configuration.RETURN) {
        result.push(
            {
                property: "rawReturnFlowRateLS",
                title: "Return Flow Rate",
                short: "(rtn)",
                units: Units.LitersPerSecond,
                category: FieldCategory.FlowRate,
                systemUid: entity.systemUid,
                defaultEnabled: true,
                format: (v: number | null) => "(" + (v === null ? "??" : v.toFixed(2)) + ")"
            },
        );
    }

    result.push(
        {
            property: "realNominalPipeDiameterMM",
            title: "Pipe Diameter",
            short: "\u00f8" + materialName!,
            hideUnits: true,
            units: Units.Millimeters,
            category: FieldCategory.Size,
            bold: true,
            systemUid: entity.systemUid,
            defaultEnabled: true,
            convert: (unitPrefs: UnitsParameters, unit: Units, value: number | null) => {
                if (unit !== Units.Millimeters) {
                    throw new Error('wat');
                }

                // we need cool names.
                switch (unitPrefs.lengthMeasurementSystem) {
                    case MeasurementSystem.METRIC:
                        return [Units.None, value === null ? null : value.toFixed(0)];
                    case MeasurementSystem.IMPERIAL:
                        return convertPipeDiameterFromMetric(unitPrefs, value);
                }
                assertUnreachable(unitPrefs.lengthMeasurementSystem);
            }
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
            property: "pressureDropKPA",
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
        }

        /*
        {
            property: "psdUnits.continuousFlowLS",
            title: "Continuous Flow",
            short: "C. Flow",
            units: Units.LitersPerSecond,
            category: FieldCategory.LoadingUnits,
            systemUid: entity.systemUid
        }*/
    );

    if (settings.metadata.calculationParams.psdMethod !== null) {
        result.push({
            property: "psdUnits.units",
            title: psdUnit.name,
            short: psdUnit.abbreviation,
            units: Units.None,
            category: FieldCategory.LoadingUnits,
            systemUid: entity.systemUid
        });
    }

    if (settings.metadata.calculationParams.dwellingMethod !== null) {
        result.push({
            property: "psdUnits.dwellings",
            title: "Dwellings",
            short: "dwlg",
            units: Units.None,
            category: FieldCategory.LoadingUnits,
            systemUid: entity.systemUid
        });
    }

    return result;
}

export function emptyPipeCalculation(): PipeCalculation {
    return {
        totalPeakFlowRateLS: null,
        heightM: null,
        PSDFlowRateLS: null,
        noFlowAvailableReason: null,
        rawPSDFlowRateLS: null,
        rawReturnFlowRateLS: null,
        psdUnits: null,
        optimalInnerPipeDiameterMM: null,
        realInternalDiameterMM: null,
        pressureDropKPA: null,
        realNominalPipeDiameterMM: null,
        realOutsideDiameterMM: null,
        lengthM: null,
        temperatureRange: null,
        configuration: null,
        velocityRealMS: null,
        warning: null,
        psdProfile: null,
        flowFrom: null
    };
}
