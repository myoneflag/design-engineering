import {createDummyCanvas} from '../../utils/example-canvas';
import {createExampleCompleteDocument} from '../../utils/example-document-with-all-components';
import {EntityType} from '../../../../common/src/api/document/entities/types';
import {expect} from 'chai';
import {ValveType} from '../../../../common/src/api/document/entities/directed-valves/valve-types';
import * as _ from 'lodash';
import BaseBackedObject from '../../../src/htmlcanvas/lib/base-backed-object';
import {FlowNode, FLOW_SOURCE_EDGE} from '../../../src/calculations/calculation-engine';
import {CalculationContext} from '../../../src/calculations/types';
import Pipe from '../../../src/htmlcanvas/objects/pipe';
import {emptyPipeCalculation} from '../../../src/store/document/calculations/pipe-calculation';
import { assertUnreachable } from "../../../../common/src/api/config";
import { parseCatalogNumberExact } from "../../../../common/src/lib/utils";

function assertIncreasing(
    context: CalculationContext,
    o: BaseBackedObject,
    a: FlowNode,
    b: FlowNode,
    testFlowRates: number[],
    pipeSizes?: any,
) {
    [[a, b], [b, a]].forEach(([from, to]) => {
        let lastHL: number = -Infinity;
        testFlowRates.forEach((fr) => {
            const thisHL = o.getFrictionHeadLoss(context, fr, from, to, true);
            expect(lastHL).lte(thisHL);
            lastHL = thisHL;
        });
    });
}

describe('object\'s head losses', () => {
    it('should be monotonic increasing', () => {
        const canvas = createDummyCanvas(createExampleCompleteDocument());

        let testFlowRates: number[] = [];
        for (let e = -6; e <= 3; e += 3) {
            for (let i = Math.pow(10, e); i < Math.pow(10, e + 3); i += Math.pow(10, e) * 5) {
                testFlowRates.push(i);
            }
        }

        let negsReversed = _.clone(testFlowRates);
        negsReversed = negsReversed.reverse().map((n) => -n);
        testFlowRates = [...negsReversed, 0, ...testFlowRates];
        const briefTestFlowRates = testFlowRates.filter((v, i) => i % 5 === 0);

        // Note: chai .eql is going to be too slow when this fails.
        expect(_.isEqual(testFlowRates, _.clone(testFlowRates).sort()));

        const context = {
            drawing: canvas.document.drawing,
            catalog: canvas.effectiveCatalog,
            objectStore: canvas.objectStore,
        };

        let pipeDone = false;

        canvas.objectStore.forEach((o) => {
            switch (o.entity.type) {
                case EntityType.DIRECTED_VALVE:
                case EntityType.SYSTEM_NODE:
                case EntityType.RISER:
                case EntityType.FITTING:
                    const connections = _.clone(o.entity.connections);
                    if (o.entity.type === EntityType.SYSTEM_NODE) {
                        connections.push(o.entity.parentUid!);
                    }
                    connections.forEach((uid) => {

                        const p = canvas.objectStore.get(uid)!;

                        if (p instanceof Pipe) {
                            p.entity.calculation = emptyPipeCalculation();
                            p.entity.calculation.realNominalPipeDiameterMM =
                                parseCatalogNumberExact(canvas.effectiveCatalog.pipes.copperTypeB
                                    .pipesBySize["15"].diameterNominalMM);
                            p.entity.calculation.realInternalDiameterMM =
                                parseCatalogNumberExact(
                                    canvas.effectiveCatalog.pipes.copperTypeB
                                        .pipesBySize["15"].diameterInternalMM);
                        }
                    });
                    for (let i = 0; i < connections.length; i++) {
                        for (let j = i + 1; j < connections.length; j++) {
                            assertIncreasing(
                                context,
                                o,
                                {connectable: o.uid, connection: connections[i]},
                                {connectable: o.uid, connection: connections[j]},
                                briefTestFlowRates,
                            );
                        }
                    }
                    break;
                case EntityType.PIPE:
                    if (!pipeDone) {
                        // tslint:disable-next-line:prefer-for-of
                        for (const material in canvas.effectiveCatalog.pipes) {
                            if (!(material in canvas.effectiveCatalog.pipes)) {
                                continue;
                            }
                            o.entity.material = material;
                            for (const size in canvas.effectiveCatalog.pipes[material].pipesBySize) {
                                if (!(size in canvas.effectiveCatalog.pipes[material].pipesBySize)) {
                                    continue;
                                }
                                o.entity.calculation = {
                                    optimalInnerPipeDiameterMM: null,
                                    peakFlowRate: null,
                                    pressureDropKpa: null,
                                    psdUnits: null,
                                    realInternalDiameterMM:
                                        parseCatalogNumberExact(canvas.effectiveCatalog.pipes[material]
                                            .pipesBySize[size].diameterInternalMM),
                                    realNominalPipeDiameterMM:
                                        parseCatalogNumberExact(canvas.effectiveCatalog.pipes[material]
                                            .pipesBySize[size].diameterNominalMM),
                                    temperatureRange: null,
                                    velocityRealMS: null,
                                    warning: null,
                                };
                                assertIncreasing(
                                    context,
                                    o,
                                    {connectable: o.entity.endpointUid[0], connection: o.uid},
                                    {connectable: o.entity.endpointUid[1], connection: o.uid},
                                    briefTestFlowRates,
                                );
                            }
                        }
                        pipeDone = true;
                    }
                    break;
                case EntityType.BIG_VALVE:
                    assertIncreasing(
                        context,
                        o,
                        {connectable: o.entity.coldRoughInUid, connection: o.uid},
                        {connectable: o.entity.warmOutputUid, connection: o.uid},
                        testFlowRates,
                    );

                    assertIncreasing(
                        context,
                        o,
                        {connectable: o.entity.hotRoughInUid, connection: o.uid},
                        {connectable: o.entity.warmOutputUid, connection: o.uid},
                        testFlowRates,
                    );

                    if (o.entity.coldOutputUid) {
                        assertIncreasing(
                            context,
                            o,
                            {connectable: o.entity.coldRoughInUid, connection: o.uid},
                            {connectable: o.entity.coldOutputUid, connection: o.uid},
                            testFlowRates,
                        );
                    }
                    break;
                case EntityType.BACKGROUND_IMAGE:
                case EntityType.RESULTS_MESSAGE:
                case EntityType.FIXTURE:
                    break;
                default:
                    assertUnreachable(o.entity);
            }
        });
    }).timeout(20000);

    it ('example complete document should have an example of every entity', () => {
        const canvas = createDummyCanvas(createExampleCompleteDocument());

        const seenEntityTypes = new Set<EntityType>();
        const expectedEntityTypes = new Set<EntityType>();


        Object.keys(EntityType).map((k) => expectedEntityTypes.add(EntityType[k as EntityType]));
        expectedEntityTypes.delete(EntityType.RESULTS_MESSAGE);
        expectedEntityTypes.delete(EntityType.RETURN); // TODO: require this later

        const seenValveTypes = new Set<ValveType>();
        const expectedValveTypes = new Set<ValveType>();

        Object.keys(ValveType).map((k) => expectedValveTypes.add(ValveType[k as ValveType]));
        expectedValveTypes.delete(ValveType.PRESSURE_RELIEF_VALVE); // TODO: require this later
        expectedValveTypes.delete(ValveType.RPZD); // TODO: require this later

        canvas.objectStore.forEach((o) => {
            seenEntityTypes.add(o.entity.type);
            switch (o.entity.type) {
                case EntityType.DIRECTED_VALVE:
                    seenValveTypes.add(o.entity.valve.type);
                    break;
                case EntityType.BACKGROUND_IMAGE:
                case EntityType.FITTING:
                case EntityType.PIPE:
                case EntityType.RISER:
                case EntityType.RESULTS_MESSAGE:
                case EntityType.SYSTEM_NODE:
                case EntityType.BIG_VALVE:
                case EntityType.FIXTURE:
                    break;
                default:
                    assertUnreachable(o.entity);
            }
        });

        expect(Array.from(seenEntityTypes.values()).sort()).eql(Array.from(expectedEntityTypes.values()).sort());
        expect(Array.from(seenValveTypes.values()).sort()).eql(Array.from(expectedValveTypes.values()).sort());
    });
});
