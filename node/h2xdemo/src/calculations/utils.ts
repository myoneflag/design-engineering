import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import {EntityType} from '@/store/document/entities/types';
import {assertUnreachable} from '@/lib/utils';
import {isGermanStandard} from '@/config';
import {DocumentState} from '@/store/document/types';
import {StandardFlowSystemUids} from '@/store/catalog';
import {Catalog, PSDSpec} from '@/store/catalog/types';
import {fillFixtureFields} from '@/store/document/entities/fixtures/fixture-entity';
import {PsdStandard, PSDStandardType} from '@/store/catalog/psd-standard/types';
import {interpolateTable, parseCatalogNumberExact} from '@/htmlcanvas/lib/utils';

export interface PsdCountEntry {
    units: number;
    continuousFlowLS: number;
}

export interface PsdUnitsByFlowSystem { [key: string]: PsdCountEntry; }

export function countPsdUnits(
    objects: BaseBackedObject[],
    doc: DocumentState,
    catalog: Catalog,
): PsdUnitsByFlowSystem | null {
    let result: PsdUnitsByFlowSystem | null = null;
    objects.forEach((o) => {
        const e = o.entity;
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

                if (isGermanStandard(doc.drawing.calculationParams.psdMethod)) {
                    result[StandardFlowSystemUids.ColdWater].units += mainFixture.designFlowRateCold!;
                } else {
                    result[StandardFlowSystemUids.ColdWater].units += mainFixture.loadingUnitsCold!;
                }

                if (isGermanStandard(doc.drawing.calculationParams.psdMethod)) {
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


export function lookupFlowRate(psdU: number, doc: DocumentState, catalog: Catalog): number | null {
    const psd = doc.drawing.calculationParams.psdMethod;
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
