import {EntityType} from "../../../common/src/api/document/entities/types";
import {DocumentState} from "../../src/store/document/types";
import {fillFixtureFields} from "../../../common/src/api/document/entities/fixtures/fixture-entity";
import {DwellingStandardType, PSDStandardType} from "../../../common/src/api/catalog/psd-standard/types";
import {CalculationField} from "../../src/store/document/calculations/calculation-field";
import {makeRiserCalculationFields} from "../store/document/calculations/riser-calculation";
import {makePipeCalculationFields} from "../../src/store/document/calculations/pipe-calculation";
import {makeFittingCalculationFields} from "../../src/store/document/calculations/fitting-calculation";
import {makeBigValveCalculationFields} from "../store/document/calculations/big-valve-calculation";
import {makeFixtureCalculationFields} from "../../src/store/document/calculations/fixture-calculation";
import {makeDirectedValveCalculationFields} from "../../src/store/document/calculations/directed-valve-calculation";
import {DrawableEntityConcrete} from "../../../common/src/api/document/entities/concrete-entity";
import {makeSystemNodeCalculationFields} from "../../src/store/document/calculations/system-node-calculation";
import {makeLoadNodeCalculationFields} from "../store/document/calculations/load-node-calculation";
import {NodeType} from "../../../common/src/api/document/entities/load-node-entity";
import {makeFlowSourceCalculationFields} from "../store/document/calculations/flow-source-calculation";
import {ObjectStore} from "../htmlcanvas/lib/object-store";
import {makePlantCalculationFields} from "../store/document/calculations/plant-calculation";
import {
    assertUnreachable,
    isGermanStandard,
    StandardFlowSystemUids,
    SupportedPsdStandards
} from "../../../common/src/api/config";
import {Catalog} from "../../../common/src/api/catalog/types";
import {determineConnectableSystemUid} from "../store/document/entities/lib";
import {
    cloneSimple,
    EPS,
    interpolateTable,
    lowerBoundTable,
    parseCatalogNumberExact,
    upperBoundTable
} from "../../../common/src/lib/utils";
import { GlobalStore } from "../htmlcanvas/lib/global-store";
import {makeGasApplianceFields} from "../../../common/src/api/document/entities/gas-appliance";
import {makeGasApplianceCalculationFields} from "../store/document/calculations/gas-appliance-calculation";
import {PlantType} from "../../../common/src/api/document/entities/plants/plant-types";
import { NodeProps } from '../../../common/src/models/CustomEntity';
import { fillDefaultLoadNodeFields } from '../store/document/entities/fillDefaultLoadNodeFields';

export interface PsdCountEntry {
    units: number;
    continuousFlowLS: number;
    dwellings: number;
    gasMJH: number;
}

export interface FinalPsdCountEntry extends PsdCountEntry {
    highestLU: number; // for BS 806
}

export interface ContextualPCE extends PsdCountEntry {
    entity: string;
    correlationGroup: string;
}

export class PsdProfile extends Map<string, ContextualPCE> {}

export interface PsdUnitsByFlowSystem {
    [key: string]: FinalPsdCountEntry;
}

export function addPsdUnitsByFlowSystem(a: PsdUnitsByFlowSystem, b: PsdUnitsByFlowSystem): PsdUnitsByFlowSystem {
    const res: PsdUnitsByFlowSystem = cloneSimple(a);
    for (const s of Object.keys(b)) {
        if (res.hasOwnProperty(s)) {
            res[s] = addFinalPsdCounts(res[s], b[s]);
        } else {
            res[s] = b[s];
        }
    }
    return res;
}

export function countPsdUnits(
    entities: DrawableEntityConcrete[],
    doc: DocumentState,
    catalog: Catalog,
    objectStore: ObjectStore,
    nodes: NodeProps[],
): PsdUnitsByFlowSystem {
    let result: PsdUnitsByFlowSystem = {};
    entities.forEach((e) => {
        switch (e.type) {
            case EntityType.FIXTURE:
                const mainFixture = fillFixtureFields(doc.drawing, catalog, e);
                if (result === null) {
                    result = {};
                }
                mainFixture.roughInsInOrder.forEach((suid) => {
                    if (!(suid in result!)) {
                        result![suid] = zeroFinalPsdCounts();
                    }
                });

                for (const suid of mainFixture.roughInsInOrder) {
                    if (isGermanStandard(doc.drawing.metadata.calculationParams.psdMethod)) {
                        result[suid].units += mainFixture.roughIns[suid].designFlowRateLS!;
                    } else {
                        result[suid].units += mainFixture.roughIns[suid].loadingUnits!;
                        result[suid].highestLU = Math.max(result[suid].highestLU, mainFixture.roughIns[suid].loadingUnits!);
                    }

                    result[suid].continuousFlowLS += mainFixture.roughIns[suid].continuousFlowLS!;
                }

                break;
            case EntityType.LOAD_NODE: {
                const mainLoadNode = fillDefaultLoadNodeFields(doc, objectStore, e, catalog, nodes);
                const suid = determineConnectableSystemUid(objectStore, mainLoadNode);

                if (suid) {
                    if (result === null) {
                        result = {};
                    }
                    if (!result.hasOwnProperty(suid)) {
                        result[suid] = zeroFinalPsdCounts();
                    }

                    switch (mainLoadNode.node.type) {
                        case NodeType.DWELLING:
                            result[suid].dwellings += mainLoadNode.node.dwellings;
                        case NodeType.LOAD_NODE:
                            if (isGermanStandard(doc.drawing.metadata.calculationParams.psdMethod)) {
                                result[suid].units += mainLoadNode.node.designFlowRateLS!;
                            } else {
                                result[suid].units += mainLoadNode.node.loadingUnits!;
                                result[suid].highestLU = Math.max(result[suid].highestLU, mainLoadNode.node.loadingUnits!);
                            }
                            result[suid].continuousFlowLS += mainLoadNode.node.continuousFlowLS!;
                            break;
                    }
                }
                break;
            }
            case EntityType.GAS_APPLIANCE: {
                const suid = StandardFlowSystemUids.Gas;
                if (!result.hasOwnProperty(suid)) {
                    result[suid] = zeroFinalPsdCounts();
                }
                if (e.flowRateMJH) {
                    result[suid].gasMJH += e.flowRateMJH;
                }
                break;
            }
            case EntityType.PLANT: {
                switch (e.plant.type) {
                    case PlantType.RETURN_SYSTEM:
                        const suid = StandardFlowSystemUids.Gas;
                        if (!result.hasOwnProperty(suid)) {
                            result[suid] = zeroFinalPsdCounts();
                        }
                        if (e.plant.gasConsumptionMJH) {
                            result[suid].gasMJH += e.plant.gasConsumptionMJH;
                        }
                        break;
                    case PlantType.TANK:
                        break;
                    case PlantType.CUSTOM:
                        break;
                    case PlantType.PUMP:
                        break;
                    default:
                        assertUnreachable(e.plant);
                }
                break;
            }
            case EntityType.BACKGROUND_IMAGE:
            case EntityType.FITTING:
            case EntityType.PIPE:
            case EntityType.RISER:
            case EntityType.FLOW_SOURCE:
            case EntityType.SYSTEM_NODE:
            case EntityType.BIG_VALVE:
            case EntityType.DIRECTED_VALVE:
                break;
            default:
                assertUnreachable(e);
        }
    });

    return result;
}

export function addPsdCounts(a: PsdCountEntry, b: PsdCountEntry): PsdCountEntry {
    return {
        units: a.units + b.units,
        continuousFlowLS: a.continuousFlowLS + b.continuousFlowLS,
        dwellings: a.dwellings + b.dwellings,
        gasMJH: a.gasMJH + b.gasMJH,
    };
}

export function addFinalPsdCounts(a: FinalPsdCountEntry, b: FinalPsdCountEntry): FinalPsdCountEntry {
    return {
        units: a.units + b.units,
        continuousFlowLS: a.continuousFlowLS + b.continuousFlowLS,
        dwellings: a.dwellings + b.dwellings,
        highestLU: Math.max(a.highestLU, b.highestLU),
        gasMJH: a.gasMJH + b.gasMJH,
    };
}

export function subPsdCounts(a: PsdCountEntry, b: PsdCountEntry): PsdCountEntry {
    return {
        units: a.units - b.units,
        continuousFlowLS: a.continuousFlowLS - b.continuousFlowLS,
        dwellings: a.dwellings - b.dwellings,
        gasMJH: a.gasMJH - b.gasMJH,
    };
}

export function scalePsdCounts(a: PsdCountEntry, scale: number): PsdCountEntry {
    return {
        units: a.units * scale,
        continuousFlowLS: a.continuousFlowLS * scale,
        dwellings: a.dwellings * scale,
        gasMJH: a.gasMJH * scale,
    };
}

export function equalPsdCounts(a: PsdCountEntry, b: PsdCountEntry): boolean {
    return (
        Math.abs(a.units - b.units) < EPS &&
        Math.abs(a.continuousFlowLS - b.continuousFlowLS) < EPS &&
        Math.abs(a.dwellings - b.dwellings) < EPS &&
        Math.abs(a.gasMJH - b.gasMJH) < EPS
    );
}

export function isZeroPsdCounts(a: PsdCountEntry): boolean {
    return Math.abs(a.units) < EPS && Math.abs(a.continuousFlowLS) < EPS && Math.abs(a.dwellings) < EPS && Math.abs(a.gasMJH) < EPS;
}

export function comparePsdCounts(a: PsdCountEntry, b: PsdCountEntry): number | null {
    const unitDiff = a.units + EPS < b.units ? -1 : a.units - EPS > b.units ? 1 : 0;
    const cfDiff =
        a.continuousFlowLS + EPS < b.continuousFlowLS ? -1 : a.continuousFlowLS - EPS > b.continuousFlowLS ? 1 : 0;
    const dDiff = a.dwellings + EPS < b.dwellings ? -1 : a.dwellings - EPS > b.dwellings ? 1 : 0;
    const gDiff = a.gasMJH + EPS < b.gasMJH ? -1 : a.gasMJH - EPS > b.gasMJH ? 1 : 0;

    const small = Math.min(unitDiff, cfDiff, dDiff, gDiff);
    const large = Math.max(unitDiff, cfDiff, dDiff, gDiff);

    if (small === 0) {
        return large;
    } else if (large === 0) {
        return small;
    } else if (small !== large) {
        return null;
    } else {
        return small;
    }
}

export function insertPsdProfile(profile: PsdProfile, count: ContextualPCE) {
    if (!profile.has(count.entity)) {
        profile.set(count.entity, count);
    } else {
        if (!equalPsdCounts(count, profile.get(count.entity)!)) {
            throw new Error(
                "Psd Profile given inconsistent values, before " +
                    JSON.stringify(profile.get(count.entity)) +
                    " after " +
                    JSON.stringify(count)
            );
        }
    }
}

export function mergePsdProfile(profile: PsdProfile, other: PsdProfile) {
    for (const p of other.values()) {
        insertPsdProfile(profile, p);
    }
}

export function countPsdProfile(profile: PsdProfile): FinalPsdCountEntry {
    const byCorrelated = new Map<string, PsdCountEntry>();

    let highestLU = 0;

    profile.forEach((contextual) => {
        if (byCorrelated.has(contextual.correlationGroup)) {
            const a = contextual;
            const b = byCorrelated.get(contextual.correlationGroup)!;

            const max: PsdCountEntry = {
                dwellings: Math.max(a.dwellings, b.dwellings),
                units: Math.max(a.units, b.units),
                continuousFlowLS: Math.max(a.continuousFlowLS, b.continuousFlowLS),
                gasMJH: Math.max(a.gasMJH, b.gasMJH),
            };

            byCorrelated.set(contextual.correlationGroup, max);
        } else {
            byCorrelated.set(contextual.correlationGroup, contextual);
        }
    });

    let total = zeroPsdCounts();
    byCorrelated.forEach((contextual) => {
        total = addPsdCounts(total, contextual);
        highestLU = Math.max(highestLU, contextual.units);
    });
    return {
        units: total.units,
        dwellings: total.dwellings,
        continuousFlowLS: total.continuousFlowLS,
        gasMJH: total.gasMJH,
        highestLU,
    };
}

export function subtractPsdProfiles(profile: PsdProfile, operand: PsdProfile): void {
    operand.forEach((contextual) => {
        if (isZeroPsdCounts(contextual)) {
            return;
        }

        if (!profile.has(contextual.entity)) {
            throw new Error("Subtracting from a value that doesn't exist");
        }

        const prev = profile.get(contextual.entity)!;
        profile.set(contextual.entity, {
            correlationGroup: contextual.correlationGroup,
            entity: contextual.entity,
            units: prev.units - contextual.units,
            continuousFlowLS: prev.continuousFlowLS - contextual.continuousFlowLS,
            dwellings: prev.dwellings - contextual.dwellings,
            gasMJH: prev.gasMJH - contextual.gasMJH,
        });
    });
}

export function zeroPsdCounts(): PsdCountEntry {
    return {
        units: 0,
        continuousFlowLS: 0,
        dwellings: 0,
        gasMJH: 0,
    };
}

export function zeroFinalPsdCounts(): FinalPsdCountEntry {
    return {
        units: 0,
        continuousFlowLS: 0,
        dwellings: 0,
        highestLU: 0,
        gasMJH: 0,
    };
}

export function zeroContextualPCE(entity: string, correlationGroup: string): ContextualPCE {
    return {
        entity,
        correlationGroup,
        continuousFlowLS: 0,
        units: 0,
        dwellings: 0,
        gasMJH: 0,
    };
}

export function getPsdUnitName(psdMethod: SupportedPsdStandards): { name: string; abbreviation: string } {
    switch (psdMethod) {
        case SupportedPsdStandards.as35002018LoadingUnits:
        case SupportedPsdStandards.barriesBookLoadingUnits:
        case SupportedPsdStandards.upc2018FlushTanks:
        case SupportedPsdStandards.upc2018Flushometer:
        case SupportedPsdStandards.ipc2018FlushTanks:
        case SupportedPsdStandards.ipc2018Flushometer:
        case SupportedPsdStandards.cibseGuideG:
        case SupportedPsdStandards.bs806:
            return { name: "Loading Units", abbreviation: "LU" };
        case SupportedPsdStandards.din1988300Residential:
        case SupportedPsdStandards.din1988300Hospital:
        case SupportedPsdStandards.din1988300Hotel:
        case SupportedPsdStandards.din1988300School:
        case SupportedPsdStandards.din1988300Office:
        case SupportedPsdStandards.din1988300AssistedLiving:
        case SupportedPsdStandards.din1988300NursingHome:
            return { name: "Full Flow Rate", abbreviation: "F. Flow" };
    }
    assertUnreachable(psdMethod);
}

export interface FlowRateResult {
    flowRateLS: number;
    fromDwellings: boolean;
}

export function lookupFlowRate(
    psdU: FinalPsdCountEntry,
    doc: DocumentState,
    catalog: Catalog,
    systemUid: string,
    forceDwellings: boolean = false
): FlowRateResult | null {
    const psd = doc.drawing.metadata.calculationParams.psdMethod;
    const standard = catalog.psdStandards[psd];

    let fromLoading: number | null = null;
    switch (standard.type) {
        case PSDStandardType.LU_LOOKUP_TABLE: {
            const table = standard.table;
            fromLoading = interpolateTable(table, psdU.units, true);
            break;
        }
        case PSDStandardType.LU_HOT_COLD_LOOKUP_TABLE: {
            const table = standard.hotColdTable;
            if (systemUid === StandardFlowSystemUids.ColdWater) {
                fromLoading = interpolateTable(table, psdU.units, true, (e) => e.cold);
            } else if (systemUid === StandardFlowSystemUids.HotWater || systemUid === StandardFlowSystemUids.WarmWater) {
                fromLoading = interpolateTable(table, psdU.units, true, (e) => e.hot);
            } else {
                throw new Error("Cannot determine flow rate with this metric");
            }
            break;
        }
        case PSDStandardType.EQUATION: {
            if (standard.equation === "a*(sum(Q,q))^b-c") {
                if (psdU.units <= 0.2) {
                    fromLoading = psdU.units;
                } else if (psdU.units <= 500) {
                    const a = parseCatalogNumberExact(standard.variables.a)!;
                    const b = parseCatalogNumberExact(standard.variables.b)!;
                    const c = parseCatalogNumberExact(standard.variables.c)!;
    
                    fromLoading = a * psdU.units ** b - c;
                }
            }
            
            if (systemUid === StandardFlowSystemUids.HotWater) {
                const [ cold, hot, warm ] = doc.drawing.metadata.flowSystems;
                const coldTemp = cold.temperature;
                const hotTemp = hot.temperature;
                const warmTemp = warm.temperature;

                if (coldTemp < warmTemp && warmTemp <= hotTemp) {
                    fromLoading = ((warmTemp - coldTemp) / (hotTemp - coldTemp)) * fromLoading!;
                }
            }

            break;
        }
        case PSDStandardType.LU_MAX_LOOKUP_TABLE: {
            // lookup by highest LU
            let table = lowerBoundTable(standard.maxLuTable, psdU.highestLU);
            if (!table) {
                table = upperBoundTable(standard.maxLuTable, Infinity)!;
            }

            // finally, lookup by actual PSD units.
            fromLoading = interpolateTable(table, psdU.units, true);
            break;
        }
        default:
            assertUnreachable(standard);
    }

    if (fromLoading === null && psdU.units === 0) {
        fromLoading = 0;
    }

    let fromDwellings: number | null = null;
    const dMethod = doc.drawing.metadata.calculationParams.dwellingMethod;
    if (dMethod) {
        const dStandard = catalog.dwellingStandards[dMethod];

        switch (dStandard.type) {
            case DwellingStandardType.DWELLING_HOT_COLD_LOOKUP_TABLE:
                if (systemUid === StandardFlowSystemUids.ColdWater) {
                    fromDwellings = interpolateTable(dStandard.hotColdTable, psdU.dwellings, true, (e) => e.cold);
                } else if (
                    systemUid === StandardFlowSystemUids.HotWater ||
                    systemUid === StandardFlowSystemUids.WarmWater
                ) {
                    fromDwellings = interpolateTable(dStandard.hotColdTable, psdU.dwellings, true, (e) => e.hot);
                } else if (psdU.dwellings) {
                    throw new Error("Cannot determine flow rate with this metric");
                } else {
                    fromDwellings = 0;
                }
                break;
            case DwellingStandardType.EQUATION:
                if (dStandard.equation !== "a*D+b*sqrt(D)") {
                    throw new Error("Only the equation a*D+b*sqrt(D) is supported");
                }

                const a = parseCatalogNumberExact(dStandard.variables.a)!;
                const b = parseCatalogNumberExact(dStandard.variables.b)!;
                fromDwellings = a * psdU.dwellings + b * Math.sqrt(psdU.dwellings);
                break;
            default:
                assertUnreachable(dStandard);
        }
    } else {
        fromDwellings = 0;
    }

    if (fromDwellings === null && psdU.dwellings === 0) {
        fromDwellings = 0;
    }

    if (fromDwellings === 0 && (!forceDwellings || doc.drawing.metadata.calculationParams.dwellingMethod === null)) {
        if (fromLoading === null) {
            return null;
        }
        return { flowRateLS: fromLoading! + psdU.continuousFlowLS, fromDwellings: false };
    } else {
        if (fromDwellings === null) {
            return null;
        }
        return { flowRateLS: fromDwellings + psdU.continuousFlowLS, fromDwellings: true };
    }
}

export function getFields(
    entity: DrawableEntityConcrete,
    doc: DocumentState,
    globalStore: GlobalStore,
    catalog: Catalog
): CalculationField[] {
    switch (entity.type) {
        case EntityType.RISER:
            return makeRiserCalculationFields(entity, doc, catalog);
        case EntityType.PIPE:
            return makePipeCalculationFields(entity, doc.drawing, catalog, globalStore);
        case EntityType.FITTING:
            return makeFittingCalculationFields(entity, globalStore, doc, catalog);
        case EntityType.BIG_VALVE:
            return makeBigValveCalculationFields(doc, entity, catalog);
        case EntityType.FIXTURE:
            return makeFixtureCalculationFields(doc, entity, globalStore);
        case EntityType.GAS_APPLIANCE:
            return makeGasApplianceCalculationFields(entity);
        case EntityType.DIRECTED_VALVE:
            return makeDirectedValveCalculationFields(entity, globalStore, doc.drawing, catalog);
        case EntityType.SYSTEM_NODE:
            return makeSystemNodeCalculationFields(entity, doc.drawing);
        case EntityType.LOAD_NODE:
            return makeLoadNodeCalculationFields(entity, doc.drawing, catalog, globalStore);
        case EntityType.FLOW_SOURCE:
            return makeFlowSourceCalculationFields(entity, doc.drawing);
        case EntityType.PLANT:
            return makePlantCalculationFields(entity);
        case EntityType.BACKGROUND_IMAGE:
            return [];
    }
}

export interface Cost {
    value: number;
    exact: boolean;
}

export function zeroCost(): Cost {
    return {
        value: 0,
        exact: true,
    }
}

export function addCosts(a: Cost | null, b: Cost | null): Cost {
    const value = (a ? a.value : 0) + (b ? b.value : 0);
    const exact = a !== null && a.exact && b !== null && b.exact;
    return {value, exact};
}