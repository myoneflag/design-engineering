import Graph, {Edge} from '@/calculations/graph';
import {ObjectStore} from '@/htmlcanvas/lib/types';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import {EntityType} from '@/store/document/entities/types';
import {Catalog} from '@/store/catalog/types';
import Pipe from '@/htmlcanvas/objects/pipe';
import {DocumentState} from '@/store/document/types';
import {interpolateTable, parseCatalogNumberExact} from '@/htmlcanvas/lib/utils';
import Valve from '@/htmlcanvas/objects/valve';
import {getDarcyWeisbachFlatMH, getFluidDensityOfSystem, kpa2head} from '@/calculations/pressure-drops';
import {terniarySearch} from '@/calculations/search-functions';
import {SystemNodeEntity} from '@/store/document/entities/tmv/tmv-entity';
import {GRAVITATIONAL_ACCELERATION} from '@/calculations/index';
import FlowSourceEntity from '@/store/document/entities/flow-source-entity';
import {FlowAssignment} from '@/calculations/flow-assignment';

export const MINIMUM_FLOW_RATE_CHANGE = 0.0001;

export default class FlowSolver {

    network: Graph<string, string>;
    objectStore: ObjectStore;
    catalog: Catalog;
    doc: DocumentState;

    constructor(
        network: Graph<string, string>,
        objectStore: ObjectStore,
        doc: DocumentState,
        catalog: Catalog,
    ) {
        this.network = network;
        this.objectStore = objectStore;
        this.catalog = catalog;
        this.doc = doc;
    }

    // Given a flow network of pipes, joints with given diameters, and the flow sources and sinks,
    // output the real flow through each pipe. The real physical flow is the only flow that meets the
    // following conditions:
    // 1. All flows in and out of each fixture sum to zero
    // 2. Head loss (/pressure drop) in each loop sum to zero

    solveFlowsLS(
        demandsLS: Map<string, number>,
        suppliesKPA: Map<string, number>,
    ): FlowAssignment {
        const cycles = this.network.edgeCycleCover(false);

        // uids of pipes that have their flow in a calculation.
        const accountedFor = new Set<string>();
        cycles.forEach((cycle) => {
            cycle.forEach((e) => {
                accountedFor.add(e.uid);
            });
        });

        const arcCover = this.network.sourceArcCover(new Set(suppliesKPA.keys()), accountedFor);
        arcCover.forEach((arc) => {
            arc.forEach((e) => {
                accountedFor.add(e.uid);
            });
        });

        // notAccountedFor should only contain unambiguous branches in the graph. Once the flow is established for them,
        // they don't need to be changed since it's the only flow possible.
        // now that we have the loops covering all ambiguous sources, it's time to provide flow.

        // give any valid flow initially.
        const flowRates = this.getInitialFlowRates(demandsLS, suppliesKPA);

        //return flowRates;
        while (true) {
            let adjustments = 0;
            cycles.forEach((c) => {
                adjustments += Math.abs(this.adjustPath(flowRates, c, 0));
            });

            arcCover.forEach((a) => {
                const fromKPA = suppliesKPA.get(a[0].from);
                const toKPA = suppliesKPA.get(a[a.length - 1].to);
                if (fromKPA === undefined || toKPA === undefined) {
                    throw new Error('Endpoint of arc is not a source');
                }
                const fromDensity = getFluidDensityOfSystem(
                    (this.objectStore.get(a[0].from)!.entity as FlowSourceEntity).systemUid,
                    this.doc,
                    this.catalog,
                );
                const toDensity = getFluidDensityOfSystem(
                    (this.objectStore.get(a[a.length - 1].from)!.entity as FlowSourceEntity).systemUid,
                    this.doc,
                    this.catalog,
                );
                const diffHead = kpa2head(toKPA, fromDensity!) - kpa2head(fromKPA, toDensity!);
                adjustments += Math.abs(this.adjustPath(flowRates, a, diffHead));
            });

            if (adjustments < MINIMUM_FLOW_RATE_CHANGE) {
                break;
            }
            console.log('Continuing iteration, total adjustments: ' + adjustments);
        }

        return flowRates;
    }

    // Tracks the pressure drop along the path, and augments the path so that the pressure difference is the same as
    // the expected difference.
    // Returns the delta speed, for iteration exit purposes.
    adjustPath(flows: FlowAssignment, path: Array<Edge<string, string>>, expectedDifferenceHead: number = 0): number {

        // Augment the path backwards
        // Use ternary search to find the smallest value of the sum of concave functions.
        let totalHeadLoss: number  = 0;
        const bestAdjustment = terniarySearch(-10, 10, (num) => {
            totalHeadLoss = 0;
            path.forEach((v) => {
                const connector = this.objectStore.get(v.value)!;
                totalHeadLoss += this.getObjectFrictionHeadLoss(
                    connector,
                    flows.getFlow(v.uid, v.from) + num,
                    v.from,
                    v.to,
                );
            });
            return Math.abs(-expectedDifferenceHead - totalHeadLoss);
        });




        console.log("adjusting path with adjustment " + bestAdjustment + ' head difference: ' + expectedDifferenceHead + ' total head loss: ' + totalHeadLoss);
        console.log('from: ' + path[0].from + ' to: ' + path[path.length - 1].to);


        path.forEach((e) => {
            console.log(e.from + " => " + e.to + " flow: " + flows.getFlow(e.uid, e.from));
            const connector = this.objectStore.get(e.value)!;
            const pd = this.getObjectFrictionHeadLoss(
                connector,
                flows.getFlow(e.uid, e.from) + bestAdjustment,
                e.from,
                e.to,
            );
            console.log(pd);
        });

        path.forEach((v) => {
            flows.addFlow(v.uid, v.from, bestAdjustment);
        });

        return bestAdjustment;
    }

    getObjectFrictionHeadLoss(object: BaseBackedObject, flowLS: number, from: string, to: string, signed = true): number {
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

                const system = this.doc.drawing.flowSystems.find((s) => s.uid === entity.systemUid)!;
                const fluid = this.catalog.fluids[system.fluid];
                const pipe = object as Pipe;

                const volLM =
                    parseCatalogNumberExact(entity.calculation!.realInternalDiameterMM)! ** 2 * Math.PI / 4 / 1000;
                const velocityMS = flowLS / volLM;

                const page = pipe.getCatalogBySizePage(this.doc, this.catalog);
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
                    const pipe = this.objectStore.get(p) as Pipe;
                    smallestDiameterMM = Math.min(
                        smallestDiameterMM === undefined ? Infinity : smallestDiameterMM,
                        parseCatalogNumberExact(pipe.entity.calculation!.realInternalDiameterMM)!,
                    );
                });

                if (smallestDiameterMM === undefined) {
                    throw new Error('Couldn\'t find smallest diameter');

                }

                const valvePage = (object as Valve).getCatalogPage(this.catalog, smallestDiameterMM);
                if (!valvePage) {
                    throw new Error('valvePage');
                }

                const volLM = smallestDiameterMM ** 2 * Math.PI / 4 / 1000;
                const velocityMS = flowLS / volLM;
                const kValue = parseCatalogNumberExact(valvePage.kValue);
                if (kValue === null) {
                    throw new Error('kValue invalid from catalog');
                }
                return sign * kValue * velocityMS ** 2 / (2 * GRAVITATIONAL_ACCELERATION);
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
                    return sign * 1e10 + flowLS;
                }
                const pdKPAfield = interpolateTable(this.catalog.mixingValves.tmv.pressureLossKPAbyFlowRateLS, flowLS);
                const pdKPA = parseCatalogNumberExact(pdKPAfield);
                if (pdKPA === null) {
                    throw new Error('pressure drop for TMV not available');
                }

                // We need the fluid density because TMV pressure stats are in KPA, not head loss
                // which is what the rest of the calculations are base off of.

                const systemUid = (this.objectStore.get(entity.warmOutputUid)!.entity as SystemNodeEntity).systemUid;
                const fluid = this.doc.drawing.flowSystems.find((s) => s.uid === systemUid)!.fluid;
                const density = parseCatalogNumberExact(this.catalog.fluids[fluid].densityKGM3)!;

                // https://neutrium.net/equipment/conversion-between-head-and-pressure/
                return sign * pdKPA * 1000 / (density * GRAVITATIONAL_ACCELERATION);
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

    getInitialFlowRates(demandsLS: Map<string, number>, suppliesKPA: Map<string, number>): FlowAssignment {
        const result: FlowAssignment = new FlowAssignment();

        demandsLS.forEach((f, n) => {
            // find a source for this flow.
            const path = this.network.anyPath(n, Array.from(suppliesKPA.keys()), undefined, undefined, true, true);
            console.log('demand ' + n + ' has path ' + JSON.stringify(path));
            if (path) {
                path.reverse().forEach((e) => {
                    result.addFlow(e.uid, e.to, f);
                });
            }
        });

        return result;
    }

    getFlowAmountLS(
        demandsLS: Map<string, number>,
        suppliesKPA: Map<string, number>,
        excludeNodes: Set<string>,
        excludeEdges: Set<string>,
    ): number {
        const demandsMet = new Set<string>();
        const seen = new Set<string>(excludeNodes);
        const seenEdges = new Set<string>(excludeEdges);

        suppliesKPA.forEach((s, k) => {
            this.network.dfs(
                k,
                (n) => {
                    if (demandsLS.has(n)) {
                        demandsMet.add(n);
                    }
                },
                undefined,
                undefined,
                undefined,
                seen,
                seenEdges,
            );
        });

        let ans = 0;
        demandsMet.forEach((d) => {
            ans += demandsLS.get(d)!;
        });
        return ans;
    }
}

