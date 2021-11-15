import {NetworkType, SelectedMaterialManufacturer} from './../../../../../common/src/api/document/drawing';
import {
    CalculationField,
    CalculationLayout,
    FieldCategory
} from "../../../../src/store/document/calculations/calculation-field";
import {Calculation, PsdCalculation} from "../../../../src/store/document/calculations/types";
import PipeEntity, {fillPipeDefaultFields} from "../../../../../common/src/api/document/entities/pipe-entity";
import {getDrainageUnitName, getPsdUnitName, PsdProfile} from "../../../calculations/utils";
import {assertUnreachable, isDrainage, isGas} from "../../../../../common/src/api/config";
import {Catalog, PipeManufacturer} from "../../../../../common/src/api/catalog/types";
import {UnitsParameters} from "../../../../../common/src/api/document/drawing";
import {GlobalStore} from "../../../htmlcanvas/lib/global-store";
import { convertPipeDiameterFromMetric, MeasurementSystem, Units } from "../../../../../common/src/lib/measurements";
import {DocumentState} from "../types";

export enum NoFlowAvailableReason {
    NO_SOURCE = "NO_SOURCE",
    NO_LOADS_CONNECTED = "NO_LOADS_CONNECTED",
    TOO_MANY_FLOW_SOURCES = "TOO_MANY_FLOW_SOURCES",
    UNUSUAL_CONFIGURATION = "UNUSUAL_CONFIGURATION",
    NO_ISOLATION_VALVES_ON_MAIN = "NO_ISOLATION_VALVES_ON_MAIN",
    LOADING_UNITS_OUT_OF_BOUNDS = "LOADING_UNITS_OUT_OF_BOUNDS",
    NO_SUITABLE_PIPE_SIZE = "NO_SUITABLE_PIPE_SIZE",
    INVALID_RETURN_NETWORK = "INVALID_RETURN_NETWORK",
    GAS_SUPPLY_PRESSURE_TOO_LOW = 'GAS_SUPPLY_PRESSURE_TOO_LOW',
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
    gradePCT: number | null;

    gasMJH: number | null;

    // Vent specific calcs;
    // An invisible, transactional value during calculations specifically for stacks.
    stackDedicatedVentSize: number | null;
    ventRoot: string | null;
    ventTooFarDist: boolean | null;
    ventTooFarWC: boolean | null;
    fallM: number | null;
}

export function makePipeCalculationFields(
    entity: PipeEntity,
    document: DocumentState,
    catalog: Catalog | undefined,
    globalStore: GlobalStore,
): CalculationField[] {
    const psdUnit = getPsdUnitName(document.drawing.metadata.calculationParams.psdMethod, document.locale);
    const drainageUnits = getDrainageUnitName(document.drawing.metadata.calculationParams.drainageMethod, document.drawing.metadata.units.volumeMeasurementSystem);

    const pipeIsGas = catalog && isGas(document.drawing.metadata.flowSystems.find((f) => f.uid === entity.systemUid)!.fluid, catalog);
    const pipeIsDrainage = isDrainage(entity.systemUid);

    let materialName = "";
    if (catalog) {
        const pipe = fillPipeDefaultFields(document.drawing, 0, entity);
        const manufacturer = document.drawing.metadata.catalog.pipes.find((pipeObj: SelectedMaterialManufacturer) => pipeObj.uid === pipe.material)?.manufacturer || 'generic';
        const abbreviation = manufacturer !== 'generic'
            && catalog.pipes[pipe.material!].manufacturer.find((manufacturerObj: PipeManufacturer) => manufacturerObj.uid === manufacturer)?.abbreviation
            || catalog.pipes[pipe.material!].abbreviation;
        materialName = " (" + abbreviation + ")";
    }

    const pCalc = globalStore.getOrCreateCalculation(entity);

    const result: CalculationField[] = [];

    const layoutOptionDrainage: CalculationLayout[] = isDrainage(entity.systemUid) ? ['pressure', 'drainage'] : [];
    const layoutStrict: CalculationLayout[] = isDrainage(entity.systemUid) ? ['drainage'] : ['pressure'];

    if (!pipeIsGas) {
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
    }

    result.push(
        {
            property: "heightM",
            title: "Height Above Floor",
            short: "height",
            units: Units.Meters,
            category: FieldCategory.Location,
            systemUid: entity.systemUid,
        },
    );

    if (pCalc.configuration === Configuration.RETURN && !pipeIsGas) {
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
            },
            layouts: layoutStrict,
        },
        {
            property: "realInternalDiameterMM",
            title: "Internal Diameter",
            short: "Internal",
            units: Units.Millimeters,
            category: FieldCategory.Size,
            systemUid: entity.systemUid
        },
    );


    if (pipeIsGas) {
        result.push(
            {
                property: "gasMJH",
                title: "Flow Rate + Spare",
                short: "",
                units: Units.MegajoulesPerHour,
                category: FieldCategory.FlowRate,
                systemUid: entity.systemUid
            },
        );
    } else {
        result.push(
            {
                property: "pressureDropKPA",
                title: "Pressure Drop",
                short: "Drop",
                units: Units.KiloPascals,
                category: FieldCategory.Pressure,
                systemUid: entity.systemUid
            },
        );
    }

    result.push(
        {
            property: "lengthM",
            title: "Length",
            short: "",
            units: Units.Meters,
            category: FieldCategory.Size,
            systemUid: entity.systemUid,
            layouts: layoutOptionDrainage,
        },
        {
            property: "velocityRealMS",
            title: "Velocity",
            short: "",
            units: Units.MetersPerSecond,
            category: FieldCategory.Velocity,
            systemUid: entity.systemUid
        },

        /* TODO: temperature loss calculation for hot water loop.
        {
            property: "temperatureRange",
            title: "Temperature Range",
            short: "",
            units: Units.Celsius,
            category: FieldCategory.Temperature,
            systemUid: entity.systemUid
        }*/

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

    if (!pipeIsGas) {

        if (document.drawing.metadata.calculationParams.psdMethod !== null) {
            result.push({
                property: "psdUnits.units",
                title: psdUnit.name,
                short: psdUnit.abbreviation,
                units: Units.None,
                category: FieldCategory.LoadingUnits,
                systemUid: entity.systemUid
            });
        }

        if (document.drawing.metadata.calculationParams.dwellingMethod !== null) {
            result.push({
                property: "psdUnits.dwellings",
                title: "Dwellings",
                short: "dwlg",
                units: Units.None,
                category: FieldCategory.LoadingUnits,
                systemUid: entity.systemUid
            });
        }

        if (isDrainage(entity.systemUid)) {

            result.push(
                {
                    property: "psdUnits.drainageUnits",
                    title: drainageUnits.name,
                    short: drainageUnits.abbreviation,
                    units: Units.None,
                    category: FieldCategory.LoadingUnits,
                    systemUid: entity.systemUid,
                    defaultEnabled: true,
                    layouts: ['drainage'],
                },
            );

            if (entity.network === NetworkType.RETICULATIONS) {
                result.push(
                    {
                    property: "gradePCT",
                    title: 'Grade (%)',
                    short: '%',
                    units: Units.None,
                    category: FieldCategory.Location,
                    systemUid: entity.systemUid,
                    defaultEnabled: true,
                    layouts: ['drainage'],
                },

                    {
                        property: "fallM",
                        title: "Fall",
                        short: "fall",
                        units: Units.Meters,
                        systemUid: entity.systemUid,
                        defaultEnabled: true,
                        category: FieldCategory.Length,
                        layouts: ['drainage'],
                    },
                );
            }
        }
    }

    if (isDrainage(entity.systemUid)) {
        if (document.uiState.pressureOrDrainage === 'drainage') {
            return result.filter((f) => f.layouts && f.layouts.includes('drainage'));
        } else {
            return [];
        }
    } else {
        if (document.uiState.pressureOrDrainage === 'pressure') {
            return result.filter((f) => !f.layouts || f.layouts.includes('pressure'));
        } else {
            return [];
        }
    }

    return result;
}

export function emptyPipeCalculation(): PipeCalculation {
    return {
        cost: null,
        costBreakdown: null,
        expandedEntities: null,

        gasMJH: null,

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
        warnings: null,
        psdProfile: null,
        flowFrom: null,
        gradePCT: null,

        stackDedicatedVentSize: null,
        ventRoot: null,
        ventTooFarWC: null,
        ventTooFarDist: null,
        fallM: null,
    };
}
