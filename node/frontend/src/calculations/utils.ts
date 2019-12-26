import BaseBackedObject from '../../src/htmlcanvas/lib/base-backed-object';
import {EntityType} from '../../src/store/document/entities/types';
import {assertUnreachable, isGermanStandard, SupportedPsdStandards} from '../../src/config';
import {DocumentState} from '../../src/store/document/types';
import {StandardFlowSystemUids} from '../../src/store/catalog';
import {Catalog, PSDSpec} from '../../src/store/catalog/types';
import {fillFixtureFields} from '../../src/store/document/entities/fixtures/fixture-entity';
import {PsdStandard, PSDStandardType} from '../../src/store/catalog/psd-standard/types';
import {interpolateTable, parseCatalogNumberExact} from '../../src/htmlcanvas/lib/utils';
import {DrawingContext} from '../../src/htmlcanvas/lib/types';
import {CalculationField} from '../../src/store/document/calculations/calculation-field';
import {makeRiserCalculationFields} from '../store/document/calculations/riser-calculation';
import {makePipeCalculationFields} from '../../src/store/document/calculations/pipe-calculation';
import {makeFittingCalculationFields} from '../../src/store/document/calculations/fitting-calculation';
import {makeTmvCalculationFields} from '../../src/store/document/calculations/tmv-calculation';
import {makeFixtureCalculationFields} from '../../src/store/document/calculations/fixture-calculation';
import {makeDirectedValveCalculationFields} from '../../src/store/document/calculations/directed-valve-calculation';
import {DrawableEntityConcrete} from '../../src/store/document/entities/concrete-entity';
import {makeSystemNodeCalculationFields} from '../../src/store/document/calculations/system-node-calculation';
import {EPS} from "./pressure-drops";

export interface PsdCountEntry {
    units: number;
    continuousFlowLS: number;
}

export interface PsdUnitsByFlowSystem { [key: string]: PsdCountEntry; }

export function countPsdUnits(
    entities: DrawableEntityConcrete[],
    doc: DocumentState,
    catalog: Catalog,
): PsdUnitsByFlowSystem | null {
    let result: PsdUnitsByFlowSystem | null = null;
    entities.forEach((e) => {
        switch (e.type) {
            case EntityType.FIXTURE:

                const mainFixture = fillFixtureFields(doc.drawing, catalog, e);
                if (result === null) {
                    result = {};
                }
                [StandardFlowSystemUids.ColdWater, StandardFlowSystemUids.HotWater].forEach((suid) => {
                    if (!(suid in result!)) {
                        result![suid] = {
                            units: 0,
                            continuousFlowLS: 0,
                        };
                    }
                });

                if (isGermanStandard(doc.drawing.metadata.calculationParams.psdMethod)) {
                    result[StandardFlowSystemUids.ColdWater].units += mainFixture.designFlowRateCold!;
                } else {
                    result[StandardFlowSystemUids.ColdWater].units += mainFixture.loadingUnitsCold!;
                }

                if (isGermanStandard(doc.drawing.metadata.calculationParams.psdMethod)) {
                    result[StandardFlowSystemUids.HotWater].units += mainFixture.designFlowRateHot!;
                } else {
                    result[StandardFlowSystemUids.HotWater].units += mainFixture.loadingUnitsHot!;
                }

                result[StandardFlowSystemUids.ColdWater].continuousFlowLS += mainFixture.continuousFlowColdLS!;
                result[StandardFlowSystemUids.HotWater].continuousFlowLS += mainFixture.continuousFlowHotLS!;

                break;
            case EntityType.BACKGROUND_IMAGE:
            case EntityType.FITTING:
            case EntityType.PIPE:
            case EntityType.RISER:
            case EntityType.SYSTEM_NODE:
            case EntityType.TMV:
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
        continuousFlowLS: a.continuousFlowLS + b.continuousFlowLS
    }
}

export function subPsdCounts(a: PsdCountEntry, b: PsdCountEntry): PsdCountEntry {
    return {
        units: a.units - b.units,
        continuousFlowLS: a.continuousFlowLS - b.continuousFlowLS
    }
}

export function scalePsdCounts(a: PsdCountEntry, scale: number): PsdCountEntry {
    return {
        units: a.units * scale,
        continuousFlowLS: a.continuousFlowLS * scale,
    }
}

export function equalPsdCounts(a: PsdCountEntry, b: PsdCountEntry): boolean {
    return Math.abs(a.units - b.units) < EPS && Math.abs(a.continuousFlowLS - b.continuousFlowLS) < EPS;
}

export function isZeroPsdCounts(a: PsdCountEntry): boolean {
    return Math.abs(a.units) < EPS && Math.abs(a.continuousFlowLS) < EPS;
}

export function comparePsdCounts(a: PsdCountEntry, b: PsdCountEntry): number | null {
    const unitDiff = a.units + EPS < b.units ? -1 : (a.units - EPS > b.units ? 1 : 0);
    const cfDiff = a.continuousFlowLS + EPS < b.continuousFlowLS ?
        -1 : (a.continuousFlowLS - EPS > b.continuousFlowLS ? 1 : 0);

    if (cfDiff === 0) {
        return unitDiff;
    } else if (unitDiff === 0) {
        return cfDiff;
    } else if (unitDiff !== cfDiff) {
        return null;
    } else {
        return unitDiff;
    }
}

export function zeroPsdCounts(): PsdCountEntry {
    return {
        units: 0,
        continuousFlowLS: 0,
    }
}

export function getPsdUnitName(psdMethod: SupportedPsdStandards): {name: string, abbreviation: string} {
    switch (psdMethod) {
        case SupportedPsdStandards.as35002018LoadingUnits:
        case SupportedPsdStandards.barriesBookLoadingUnits:
        case SupportedPsdStandards.barriesBookDwellings:
            return {name: 'Loading Units', abbreviation: 'LU'};
        case SupportedPsdStandards.din1988300Residential:
        case SupportedPsdStandards.din1988300Hospital:
        case SupportedPsdStandards.din1988300Hotel:
        case SupportedPsdStandards.din1988300School:
        case SupportedPsdStandards.din1988300Office:
        case SupportedPsdStandards.din1988300AssistedLiving:
        case SupportedPsdStandards.din1988300NursingHome:
            return {name: 'Full Flow Rate', abbreviation: 'F. Flow'};
    }
    assertUnreachable(psdMethod);
}

export function lookupFlowRate(psdU: number, doc: DocumentState, catalog: Catalog): number | null {
    const psd = doc.drawing.metadata.calculationParams.psdMethod;
    const standard = catalog.psdStandards[psd];
    if (standard.type === PSDStandardType.LU_LOOKUP_TABLE) {
        const table = standard.table;
        return interpolateTable(table, psdU, true);
    } else if (standard.type === PSDStandardType.EQUATION) {
        if (standard.equation !== 'a*(sum(Q,q))^b-c') {
            throw new Error('Only the german equation a*(sum(Q,q))^b-c is currently supported');
        }

        if (psdU < 0) {
            throw new Error('PSD units must be positive');
        }

        if (psdU <= 0.2) {
            return psdU;
        }

        if (psdU > 500) {
            throw new Error('Too much flow - PSD cannot be determined from this standard');
        }

        const a = parseCatalogNumberExact(standard.variables.a)!;
        const b = parseCatalogNumberExact(standard.variables.b)!;
        const c = parseCatalogNumberExact(standard.variables.c)!;

        return a * (psdU ** b) - c;
    } else {
        throw new Error('PSD not supported');
    }
}

export function getFields(entity: DrawableEntityConcrete, doc: DocumentState, catalog?: Catalog): CalculationField[] {
    switch (entity.type) {
        case EntityType.RISER:
            return makeRiserCalculationFields(entity, doc.drawing);
        case EntityType.PIPE:
            return makePipeCalculationFields(entity, doc.drawing, catalog);
        case EntityType.FITTING:
            return makeFittingCalculationFields(entity);
        case EntityType.TMV:
            return makeTmvCalculationFields(entity);
        case EntityType.FIXTURE:
            return makeFixtureCalculationFields();
        case EntityType.DIRECTED_VALVE:
            return makeDirectedValveCalculationFields(entity);
        case EntityType.SYSTEM_NODE:
            return makeSystemNodeCalculationFields(entity, doc.drawing);
        case EntityType.BACKGROUND_IMAGE:
            return [];
    }
}
