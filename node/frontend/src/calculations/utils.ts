import { EntityType } from "../../src/store/document/entities/types";
import { assertUnreachable, isGermanStandard, SupportedPsdStandards } from "../../src/config";
import { DocumentState } from "../../src/store/document/types";
import { StandardFlowSystemUids } from "../../src/store/catalog";
import { Catalog } from "../../src/store/catalog/types";
import { fillFixtureFields } from "../../src/store/document/entities/fixtures/fixture-entity";
import { DwellingStandardType, PSDStandardType } from "../../src/store/catalog/psd-standard/types";
import { interpolateTable, parseCatalogNumberExact } from "../../src/htmlcanvas/lib/utils";
import { CalculationField } from "../../src/store/document/calculations/calculation-field";
import { makeRiserCalculationFields } from "../store/document/calculations/riser-calculation";
import { makePipeCalculationFields } from "../../src/store/document/calculations/pipe-calculation";
import { makeFittingCalculationFields } from "../../src/store/document/calculations/fitting-calculation";
import { makeBigValveCalculationFields } from "../store/document/calculations/big-valve-calculation";
import { makeFixtureCalculationFields } from "../../src/store/document/calculations/fixture-calculation";
import { makeDirectedValveCalculationFields } from "../../src/store/document/calculations/directed-valve-calculation";
import { DrawableEntityConcrete } from "../../src/store/document/entities/concrete-entity";
import { makeSystemNodeCalculationFields } from "../../src/store/document/calculations/system-node-calculation";
import { EPS } from "./pressure-drops";
import { makeLoadNodeCalculationFields } from "../store/document/calculations/load-node-calculation";
import { NodeType } from "../store/document/entities/load-node-entity";
import { makeFlowSourceFields } from "../store/document/entities/flow-source-entity";
import { makeFlowSourceCalculationFields } from "../store/document/calculations/flow-source-calculation";

export interface PsdCountEntry {
    units: number;
    continuousFlowLS: number;
    dwellings: number;
}

export interface PsdUnitsByFlowSystem {
    [key: string]: PsdCountEntry;
}

export function countPsdUnits(
    entities: DrawableEntityConcrete[],
    doc: DocumentState,
    catalog: Catalog
): PsdUnitsByFlowSystem | null {
    let result: PsdUnitsByFlowSystem | null = null;
    entities.forEach((e) => {
        switch (e.type) {
            case EntityType.FIXTURE:
                const mainFixture = fillFixtureFields(doc.drawing, catalog, e);
                if (result === null) {
                    result = {};
                }
                mainFixture.roughInsInOrder.forEach((suid) => {
                    if (!(suid in result!)) {
                        result![suid] = zeroPsdCounts();
                    }
                });

                for (const suid of mainFixture.roughInsInOrder) {
                    if (isGermanStandard(doc.drawing.metadata.calculationParams.psdMethod)) {
                        result[suid].units += mainFixture.roughIns[suid].designFlowRateLS!;
                    } else {
                        result[suid].units += mainFixture.roughIns[suid].loadingUnits!;
                    }

                    result[suid].continuousFlowLS += mainFixture.roughIns[suid].continuousFlowLS!;
                }

                break;
            case EntityType.LOAD_NODE:
                if (e.systemUidOption) {
                    if (result === null) {
                        result = {};
                    }
                    if (!result.hasOwnProperty(e.systemUidOption)) {
                        result[e.systemUidOption] = zeroPsdCounts();
                    }

                    switch (e.node.type) {
                        case NodeType.LOAD_NODE:
                            if (isGermanStandard(doc.drawing.metadata.calculationParams.psdMethod)) {
                                result[e.systemUidOption].units += e.node.designFlowRateLS;
                            } else {
                                result[e.systemUidOption].units += e.node.loadingUnits;
                            }
                            result[e.systemUidOption].continuousFlowLS += e.node.continuousFlowLS;
                            break;
                        case NodeType.DWELLING:
                            result[e.systemUidOption].dwellings += e.node.dwellings;
                            break;
                    }
                }
                break;
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
        dwellings: a.dwellings + b.dwellings
    };
}

export function subPsdCounts(a: PsdCountEntry, b: PsdCountEntry): PsdCountEntry {
    return {
        units: a.units - b.units,
        continuousFlowLS: a.continuousFlowLS - b.continuousFlowLS,
        dwellings: a.dwellings - b.dwellings
    };
}

export function scalePsdCounts(a: PsdCountEntry, scale: number): PsdCountEntry {
    return {
        units: a.units * scale,
        continuousFlowLS: a.continuousFlowLS * scale,
        dwellings: a.dwellings * scale
    };
}

export function equalPsdCounts(a: PsdCountEntry, b: PsdCountEntry): boolean {
    return (
        Math.abs(a.units - b.units) < EPS &&
        Math.abs(a.continuousFlowLS - b.continuousFlowLS) < EPS &&
        Math.abs(a.dwellings - b.dwellings) < EPS
    );
}

export function isZeroPsdCounts(a: PsdCountEntry): boolean {
    return Math.abs(a.units) < EPS && Math.abs(a.continuousFlowLS) < EPS && Math.abs(a.dwellings) < EPS;
}

export function comparePsdCounts(a: PsdCountEntry, b: PsdCountEntry): number | null {
    const unitDiff = a.units + EPS < b.units ? -1 : a.units - EPS > b.units ? 1 : 0;
    const cfDiff =
        a.continuousFlowLS + EPS < b.continuousFlowLS ? -1 : a.continuousFlowLS - EPS > b.continuousFlowLS ? 1 : 0;
    const dDiff = a.dwellings + EPS < b.dwellings ? -1 : a.dwellings - EPS > b.dwellings ? 1 : 0;

    const small = Math.max(unitDiff, cfDiff, dDiff);
    const large = Math.max(unitDiff, cfDiff, dDiff);

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

export function zeroPsdCounts(): PsdCountEntry {
    return {
        units: 0,
        continuousFlowLS: 0,
        dwellings: 0
    };
}

export function getPsdUnitName(psdMethod: SupportedPsdStandards): { name: string; abbreviation: string } {
    switch (psdMethod) {
        case SupportedPsdStandards.as35002018LoadingUnits:
        case SupportedPsdStandards.barriesBookLoadingUnits:
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

export function lookupFlowRate(
    psdU: PsdCountEntry,
    doc: DocumentState,
    catalog: Catalog,
    systemUid: string
): number | null {
    const psd = doc.drawing.metadata.calculationParams.psdMethod;
    const standard = catalog.psdStandards[psd];

    let fromLoading: number | null = null;
    if (standard.type === PSDStandardType.LU_LOOKUP_TABLE) {
        const table = standard.table;
        fromLoading = interpolateTable(table, psdU.units, true);
    } else if (standard.type === PSDStandardType.EQUATION) {
        if (standard.equation !== "a*(sum(Q,q))^b-c") {
            throw new Error("Only the german equation a*(sum(Q,q))^b-c is currently supported");
        }

        if (psdU.units < 0) {
            throw new Error("PSD units must be positive");
        }

        if (psdU.units <= 0.2) {
            fromLoading = psdU.units;
        }

        if (psdU.units > 500) {
            throw new Error("Too much flow - PSD cannot be determined from this standard");
        }

        const a = parseCatalogNumberExact(standard.variables.a)!;
        const b = parseCatalogNumberExact(standard.variables.b)!;
        const c = parseCatalogNumberExact(standard.variables.c)!;

        fromLoading = a * psdU.units ** b - c;
    } else if (standard.type === PSDStandardType.LU_HOT_COLD_LOOKUP_TABLE) {
        const table = standard.hotColdTable;
        if (systemUid === StandardFlowSystemUids.ColdWater) {
            fromLoading = interpolateTable(table, psdU.units, true, (e) => e.cold);
        } else if (systemUid === StandardFlowSystemUids.HotWater || systemUid === StandardFlowSystemUids.WarmWater) {
            fromLoading = interpolateTable(table, psdU.units, true, (e) => e.hot);
        } else {
            throw new Error("Cannot determine flow rate with this metric");
        }
    } else {
        throw new Error("PSD not supported");
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
                }
                if (psdU.dwellings) {
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

    if (fromLoading === null || fromDwellings === null) {
        return null;
    }

    return fromLoading + fromDwellings + psdU.continuousFlowLS;
}

export function getFields(entity: DrawableEntityConcrete, doc: DocumentState, catalog?: Catalog): CalculationField[] {
    switch (entity.type) {
        case EntityType.RISER:
            return makeRiserCalculationFields(entity, doc.drawing);
        case EntityType.PIPE:
            return makePipeCalculationFields(entity, doc.drawing, catalog);
        case EntityType.FITTING:
            return makeFittingCalculationFields(entity);
        case EntityType.BIG_VALVE:
            return makeBigValveCalculationFields(doc, entity);
        case EntityType.FIXTURE:
            return makeFixtureCalculationFields(doc, entity);
        case EntityType.DIRECTED_VALVE:
            return makeDirectedValveCalculationFields(entity);
        case EntityType.SYSTEM_NODE:
            return makeSystemNodeCalculationFields(entity, doc.drawing);
        case EntityType.LOAD_NODE:
            return makeLoadNodeCalculationFields(entity);
        case EntityType.FLOW_SOURCE:
            return makeFlowSourceCalculationFields(entity, doc.drawing);
        case EntityType.BACKGROUND_IMAGE:
            return [];
    }
}
