import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import {EntityType} from '@/store/document/entities/types';
import {assertUnreachable} from '@/lib/utils';
import {isGermanStandard} from '@/config';
import {DocumentState} from '@/store/document/types';
import {StandardFlowSystemUids} from '@/store/catalog';
import {Catalog} from '@/store/catalog/types';
import {fillFixtureFields} from '@/store/document/entities/fixtures/fixture-entity';

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
