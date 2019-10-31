import Graph, {Edge} from '@/calculations/graph';
import {ObjectStore} from '@/htmlcanvas/lib/types';
import {Catalog} from '@/store/catalog/types';
import {DocumentState} from '@/store/document/types';
import {getFluidDensityOfSystem, kpa2head} from '@/calculations/pressure-drops';
import {ternarySearchForGlobalMin} from '@/calculations/search-functions';
import FlowSourceEntity from '@/store/document/entities/flow-source-entity';
import {FlowAssignment} from '@/calculations/flow-assignment';
import { getObjectFrictionHeadLoss } from './entity-pressure-drops';

export const MINIMUM_FLOW_RATE_CHANGE = 0.0001;

export default class FlowSolver {

    network: Graph<string, string>;
    objectStore: ObjectStore;
    catalog: Catalog;
    doc: DocumentState;
    ga: number;

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
        this.ga = doc.drawing.calculationParams.gravitationalAcceleration;
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

        // return flowRates;
        let iters = 0;
        while (true) {
            iters++;
            if (iters > 200) {
                break;
            }
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
                const diffHead = kpa2head(toKPA, fromDensity!, this.ga) - kpa2head(fromKPA, toDensity!, this.ga);
                adjustments += Math.abs(this.adjustPath(flowRates, a, diffHead));
            });

            if (adjustments < MINIMUM_FLOW_RATE_CHANGE) {
                break;
            }
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
        const bestAdjustment = ternarySearchForGlobalMin((num) => {
            totalHeadLoss = 0;
            path.forEach((v) => {
                const connector = this.objectStore.get(v.value)!;
                const delta = getObjectFrictionHeadLoss(
                    {drawing: this.doc.drawing, catalog: this.catalog, objectStore: this.objectStore},
                    connector,
                    flows.getFlow(v.uid, v.from) + num,
                    v.from,
                    v.to,
                );
                totalHeadLoss += delta;
            });
            return Math.abs(-expectedDifferenceHead - totalHeadLoss);
        });

        path.forEach((v) => {
            flows.addFlow(v.uid, v.from, bestAdjustment);
        });

        return bestAdjustment;
    }


    getInitialFlowRates(demandsLS: Map<string, number>, suppliesKPA: Map<string, number>): FlowAssignment {
        const result: FlowAssignment = new FlowAssignment();

        demandsLS.forEach((f, n) => {
            // find a source for this flow.
            const path = this.network.anyPath(n, Array.from(suppliesKPA.keys()), undefined, undefined, true, true);
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

