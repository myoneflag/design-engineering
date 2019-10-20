import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import {EntityType} from '@/store/document/entities/types';
import Pipe from '@/htmlcanvas/objects/pipe';
import {interpolateTable, parseCatalogNumberExact} from '@/htmlcanvas/lib/utils';
import {getDarcyWeisbachFlatMH} from '@/calculations/pressure-drops';
import Valve from '@/htmlcanvas/objects/valve';
import {GRAVITATIONAL_ACCELERATION} from '@/calculations/index';
import {SystemNodeEntity} from '@/store/document/entities/tmv/tmv-entity';
import {CalculationContext} from '@/calculations/types';

export function getObjectFrictionHeadLoss(
    context: CalculationContext,
    object: BaseBackedObject,
    flowLS: number,
    from: string,
    to: string,
    signed = true,
): number {
    const {drawing, catalog, objectStore} = context;
    const entity = object.entity;
    let sign = 1;
    if (flowLS < 0) {
        const oldFrom = from;
        from = to;
        to = oldFrom;
        flowLS = -flowLS;
        if (signed) {
            sign = -1;
        }
    }

    switch (entity.type) {
        case EntityType.PIPE: {
            const system = drawing.flowSystems.find((s) => s.uid === entity.systemUid)!;
            const fluid = catalog.fluids[system.fluid];
            const pipe = object as Pipe;

            const volLM =
                parseCatalogNumberExact(entity.calculation!.realInternalDiameterMM)! ** 2 * Math.PI / 4 / 1000;
            const velocityMS = flowLS / volLM;

            const page = pipe.getCatalogBySizePage(context);
            if (!page) {
                throw new Error('Cannot find pipe entry for this pipe.');
            }

            const dynamicViscosity = parseCatalogNumberExact(
                // TODO: get temperature of the pipe.
                interpolateTable(fluid.dynamicViscosityByTemperature, system.temperature),
            );

            const retval = sign * getDarcyWeisbachFlatMH(
                parseCatalogNumberExact(page.diameterInternalMM)!,
                parseCatalogNumberExact(page.colebrookWhiteCoefficient)!,
                parseCatalogNumberExact(fluid.densityKGM3)!,
                dynamicViscosity!,
                pipe.computedLengthM,
                velocityMS,
            );

            return retval;
        }
        case EntityType.VALVE: {
            let smallestDiameterMM: number | undefined;
            entity.connections.forEach((p) => {
                const pipe = objectStore.get(p) as Pipe;
                smallestDiameterMM = Math.min(
                    smallestDiameterMM === undefined ? Infinity : smallestDiameterMM,
                    parseCatalogNumberExact(pipe.entity.calculation!.realInternalDiameterMM)!,
                );
            });

            if (smallestDiameterMM === undefined) {
                throw new Error('Couldn\'t find smallest diameter');

            }

            const valvePage = (object as Valve).getCatalogPage(catalog, smallestDiameterMM);
            if (!valvePage) {
                throw new Error('valvePage');
            }

            const volLM = smallestDiameterMM ** 2 * Math.PI / 4 / 1000;
            const velocityMS = flowLS / volLM;
            const kValue = parseCatalogNumberExact(valvePage.kValue);
            if (kValue === null) {
                throw new Error('kValue invalid from catalog');
            }
            return sign * (kValue * velocityMS ** 2 / (2 * GRAVITATIONAL_ACCELERATION));
        }
        case EntityType.TMV: {
            // it is directional
            let valid = false;
            if (from === entity.hotRoughInUid && to === entity.warmOutputUid) {
                valid = true;
            }
            if (from === entity.coldRoughInUid && to === entity.coldOutputUid) {
                valid = true;
            }
            if (!valid) {
                // Water not flowing the correct direction
                return sign * (1e10 + flowLS);
            }
            const pdKPAfield = interpolateTable(catalog.mixingValves.tmv.pressureLossKPAbyFlowRateLS, flowLS);
            const pdKPA = parseCatalogNumberExact(pdKPAfield);
            if (pdKPA === null) {
                throw new Error('pressure drop for TMV not available');
            }

            // We need the fluid density because TMV pressure stats are in KPA, not head loss
            // which is what the rest of the calculations are base off of.

            const systemUid = (objectStore.get(entity.warmOutputUid)!.entity as SystemNodeEntity).systemUid;
            const fluid = drawing.flowSystems.find((s) => s.uid === systemUid)!.fluid;
            const density = parseCatalogNumberExact(catalog.fluids[fluid].densityKGM3)!;

            // https://neutrium.net/equipment/conversion-between-head-and-pressure/
            return sign * (pdKPA * 1000 / (density * GRAVITATIONAL_ACCELERATION));
        }
        case EntityType.FLOW_SOURCE:
        case EntityType.SYSTEM_NODE:
        case EntityType.FIXTURE:
            return 0;
        case EntityType.BACKGROUND_IMAGE:
        case EntityType.RESULTS_MESSAGE:
            throw new Error('Invalid object in flow network');
    }
}
