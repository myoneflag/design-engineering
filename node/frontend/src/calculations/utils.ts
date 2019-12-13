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
import {makeFlowSourceCalculationFields} from '../../src/store/document/calculations/flow-source-calculation';
import {makePipeCalculationFields} from '../../src/store/document/calculations/pipe-calculation';
import {makeFittingCalculationFields} from '../../src/store/document/calculations/fitting-calculation';
import {makeTmvCalculationFields} from '../../src/store/document/calculations/tmv-calculation';
import {makeFixtureCalculationFields} from '../../src/store/document/calculations/fixture-calculation';
import {makeDirectedValveCalculationFields} from '../../src/store/document/calculations/directed-valve-calculation';
import {DrawableEntityConcrete} from '../../src/store/document/entities/concrete-entity';
import {makeSystemNodeCalculationFields} from '../../src/store/document/calculations/system-node-calculation';

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

                const mainFixture = fillFixtureFields(doc, catalog, e);
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
                break;
            case EntityType.BACKGROUND_IMAGE:
            case EntityType.FITTING:
            case EntityType.PIPE:
            case EntityType.FLOW_SOURCE:
            case EntityType.RESULTS_MESSAGE:
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
            return {name: 'Design Flow Rate', abbreviation: 'D. Flow'};
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
        case EntityType.FLOW_SOURCE:
            return makeFlowSourceCalculationFields(entity, doc.drawing);
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
        case EntityType.RESULTS_MESSAGE:
            return [];
    }
}
