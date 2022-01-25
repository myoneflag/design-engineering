import { CalculationField, FieldCategory } from "../../../../src/store/document/calculations/calculation-field";
import DirectedValveEntity from "../../../../../common/src/api/document/entities/directed-valves/directed-valve-entity";
import {
    addPressureCalculationFields,
    Calculation,
    CalculationType,
    NameCalculation,
    PressureCalculation
} from "../../../../src/store/document/calculations/types";
import { ValveType } from "../../../../../common/src/api/document/entities/directed-valves/valve-types";
import { assertUnreachable, isDrainage, isGas } from "../../../../../common/src/api/config";
import { determineConnectableSystemUid } from "../entities/lib";
import { GlobalStore } from "../../../htmlcanvas/lib/global-store";
import { Units } from "../../../../../common/src/lib/measurements";
import { Catalog } from '../../../../../common/src/api/catalog/types';
import { DocumentState } from './../types';
import { fillDirectedValveFields } from "../entities/fillDirectedValveFields";

export default interface DirectedValveCalculation extends Calculation, PressureCalculation, NameCalculation {
    flowRateLS: number | null;
    pressureDropKPA: number | null;
    kvValue: number | null;
    sizeMM: number | null;
}

export function makeDirectedValveCalculationFields(
    entity: DirectedValveEntity,
    globalStore: GlobalStore,
    document: DocumentState,
    catalog: Catalog | undefined,
): CalculationField[] {
    const drawing = document.drawing;
    const systems = drawing.metadata.flowSystems;
    const filled = fillDirectedValveFields(drawing, globalStore, entity);
    const systemUid = determineConnectableSystemUid(globalStore, filled);

    const valveIsGas = catalog && systemUid && isGas(systemUid!, catalog.fluids, systems);
    const iAmDrainage = isDrainage(systemUid!, systems);

    let fields: CalculationField[] = [];

    if ((document.uiState.pressureOrDrainage === 'drainage' && iAmDrainage) ||
        (document.uiState.pressureOrDrainage === 'pressure' && !iAmDrainage)) {

        fields.push(
            {
                property: "entityName",
                title: "Name",
                short: "",
                units: Units.None,
                category: FieldCategory.EntityName,
                systemUid: systemUid,
                layouts: ['pressure', 'drainage'],
            },
        );
    }

    if (!valveIsGas && !iAmDrainage) {
        fields.push(
            {
                property: "flowRateLS",
                title: "Peak Flow Rate",
                short: "",
                units: Units.LitersPerSecond,
                category: FieldCategory.FlowRate,
                systemUid,
            },
            {
                property: "pressureDropKPA",
                title: "Pressure Drop",
                short: "",
                defaultEnabled: true,
                units: Units.KiloPascals,
                category: FieldCategory.Pressure,
                systemUid,
            }
        );
    }

    if (filled.valve.type === ValveType.BALANCING) {
        fields.push({
            property: "kvValue",
            title: "Kv Value",
            short: "",
            units: Units.Kv,
            category: FieldCategory.Pressure,
            systemUid,
        });
    }

    if (!valveIsGas && !iAmDrainage) {
        addPressureCalculationFields(fields, systemUid);
    }

    if (filled.systemUidOption) {
        fields = fields.map((f) => {
            f.systemUid = entity.systemUidOption!;
            return f;
        });
    }

    let manufacturer = 'generic';
    let abbreviation = '';
    switch (filled.valve.type) {
        case ValveType.GAS_REGULATOR:
            if (valveIsGas) {
                fields.push({
                    property: "pressureKPA",
                    title: "Pressure Out",
                    short: "",
                    units: Units.KiloPascals,
                    systemUid,
                    category: FieldCategory.Pressure,
                });
            }
            break;
        case ValveType.WATER_METER:
        case ValveType.FILTER:
            if (valveIsGas) {
                fields.push({
                    property: "pressureDropKPA",
                    title: "Pressure Drop",
                    short: "",
                    defaultEnabled: true,
                    units: Units.KiloPascals,
                    category: FieldCategory.Pressure,
                    systemUid,
                });
            }
            break;
        case ValveType.BALANCING:
            manufacturer = drawing.metadata.catalog.balancingValves[0]?.manufacturer || manufacturer;
            abbreviation = manufacturer !== 'generic'
                && catalog?.balancingValves.manufacturer.find((manufacturerObj) => manufacturerObj.uid === manufacturer)?.abbreviation
                || abbreviation;

            fields.push({
                property: "sizeMM",
                title: "Size",
                short: abbreviation,
                units: Units.Millimeters,
                category: FieldCategory.Size
            });

            break;
        case ValveType.RPZD_SINGLE:
        case ValveType.RPZD_DOUBLE_SHARED:
        case ValveType.RPZD_DOUBLE_ISOLATED:
            manufacturer = drawing.metadata.catalog.backflowValves.find((material) => material.uid === entity.valve.catalogId)?.manufacturer || manufacturer;
            abbreviation = manufacturer !== 'generic'
                && catalog?.backflowValves[entity.valve.catalogId].manufacturer.find((manufacturerObj) => manufacturerObj.uid === manufacturer)?.abbreviation
                || '';

            fields.push({
                property: "sizeMM",
                title: "Size",
                short: abbreviation,
                units: Units.Millimeters,
                category: FieldCategory.Size
            });

            break;
        case ValveType.PRV_SINGLE:
        case ValveType.PRV_DOUBLE:
        case ValveType.PRV_TRIPLE:
            manufacturer = drawing.metadata.catalog.prv[0]?.manufacturer || manufacturer;
            abbreviation = manufacturer !== 'generic'
                && catalog?.prv.manufacturer.find((manufacturerObj) => manufacturerObj.uid === manufacturer)?.abbreviation
                || '';

            fields.push({
                property: "sizeMM",
                title: "Size",
                short: abbreviation,
                units: Units.Millimeters,
                category: FieldCategory.Size,
                format: (sizeMM) => {
                    const settings = Object.entries(catalog!.prv.size[manufacturer]).find(([key, value]) => value.diameterNominalMM === sizeMM)![0];
                    return settings;
                }
            });

            break;
        case ValveType.FLOOR_WASTE:
            if (iAmDrainage) {
                manufacturer = drawing.metadata.catalog.floorWaste[0]?.manufacturer || manufacturer;

                if (manufacturer === 'blucher' && filled.valve.variant === 'bucketTrap') {
                    fields.push({
                        property: "sizeMM",
                        title: 'Size',
                        short: "BLUCHER FW/BT",
                        units: Units.Millimeters,
                        category: FieldCategory.FloorWaste,
                        layouts: ['drainage']
                    })
                }
            }

            break;
        case ValveType.INSPECTION_OPENING:
            if (iAmDrainage) {
                manufacturer = drawing.metadata.catalog.inspectionOpening[0]?.manufacturer || manufacturer;

                console.log(manufacturer);
                if (manufacturer === 'blucher') {
                    fields.push({
                        property: "sizeMM",
                        title: 'Size',
                        short: "BLUCHER I.O.",
                        units: Units.Millimeters,
                        category: FieldCategory.InspectionOpening,
                        layouts: ['drainage']
                    })
                }
            }

            break;
        case ValveType.REFLUX_VALVE:
        case ValveType.CHECK_VALVE:
        case ValveType.ISOLATION_VALVE:
        case ValveType.STRAINER:
            // Nothing for these.
            break;
        default:
            assertUnreachable(filled.valve);
    }

    return fields;
}

export function emptyDirectedValveCalculation(): DirectedValveCalculation {
    return {
        type: CalculationType.DirectedValveCalculation,
        costBreakdown: null,
        cost: null,
        expandedEntities: null,

        flowRateLS: null,
        pressureDropKPA: null,
        staticPressureKPA: null,
        kvValue: null,
        pressureKPA: null,
        warnings: null,
        sizeMM: null,

        entityName: null
    };
}
