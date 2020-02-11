import Graph, { Edge } from "../../src/calculations/graph";
import { DocumentState } from "../../src/store/document/types";
import { getFluidDensityOfSystem, kpa2head } from "../../src/calculations/pressure-drops";
import { ternarySearchForGlobalMin } from "../../src/calculations/search-functions";
import RiserEntity from "../../../common/src/api/document/entities/riser-entity";
import { FlowAssignment } from "../../src/calculations/flow-assignment";
import { getObjectFrictionHeadLoss } from "./entity-pressure-drops";
import { FlowEdge, FlowNode, FLOW_SOURCE_EDGE } from "../../src/calculations/calculation-engine";
import Fitting from "../../src/htmlcanvas/objects/fitting";
import { GlobalStore } from "../htmlcanvas/lib/global-store";
import { ObjectStore } from "../htmlcanvas/lib/object-store";
import { Catalog } from "../../../common/src/api/catalog/types";
import { CalculationContext } from "./types";

export const MINIMUM_FLOW_RATE_CHANGE = 0.0001;

export default class FlowSolver {
    network: Graph<FlowNode, FlowEdge>;
    context: CalculationContext;
    ga: number;

    constructor(network: Graph<FlowNode, FlowEdge>, context: CalculationContext) {
        this.network = network;
        this.context = context;
        this.ga = context.drawing.metadata.calculationParams.gravitationalAcceleration;
    }

    // Given a flow network of pipes, joints with given diameters, and the flow sources and sinks,
    // output the real flow through each pipe. The real physical flow is the only flow that meets the
    // following conditions:
    // 1. All flows in and out of each fixture sum to zero
    // 2. Head loss (/pressure drop) in each loop sum to zero

    solveFlowsLS(demandsLS: Map<string, number>, suppliesKPA: Map<string, number>): FlowAssignment {
        const cycles = this.network.edgeCycleCover(false);

        // uids of pipes that have their flow in a calculation.
        const accountedFor = new Set<string>();
        cycles.forEach((cycle) => {
            cycle.forEach((e) => {
                accountedFor.add(e.uid);
            });
        });

        const sources = Array.from(suppliesKPA.keys()).map((suid) => ({
            connectable: suid,
            connection: FLOW_SOURCE_EDGE
        }));
        const arcCover = this.network.sourceArcCover(sources, accountedFor);
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

        // return flowRates;low-s
        let iters = 0;
        while (true) {
            iters++;
            if (iters > 100) {
                break;
            }
            let adjustments = 0;
            cycles.forEach((c) => {
                adjustments += Math.abs(adjustPathHardyCross(flowRates, c,  this.network,0, this.context));
            });

            arcCover.forEach((a) => {
                const fromKPA = suppliesKPA.get(a[0].from.connectable);
                const toKPA = suppliesKPA.get(a[a.length - 1].to.connectable);
                if (fromKPA === undefined || toKPA === undefined) {
                    throw new Error("Endpoint of arc is not a source");
                }
                const fromDensity = getFluidDensityOfSystem(
                    (this.context.globalStore.get(a[0].from.connectable)!.entity as RiserEntity).systemUid,
                    this.context.doc,
                    this.context.catalog
                );
                const toDensity = getFluidDensityOfSystem(
                    (this.context.globalStore.get(a[a.length - 1].from.connectable)!.entity as RiserEntity).systemUid,
                    this.context.doc,
                    this.context.catalog
                );
                const diffHead = kpa2head(toKPA, fromDensity!, this.ga) - kpa2head(fromKPA, toDensity!, this.ga);
                adjustments += Math.abs(adjustPathHardyCross(flowRates, a, this.network, diffHead, this.context));
            });

            if (adjustments < MINIMUM_FLOW_RATE_CHANGE) {
                break;
            }
        }
        return flowRates;
    }

    getInitialFlowRates(demandsLS: Map<string, number>, suppliesKPA: Map<string, number>): FlowAssignment {
        const result: FlowAssignment = new FlowAssignment();

        demandsLS.forEach((f, n) => {
            // find a source for this flow.
            const path = this.network.anyPath(
                { connectable: n, connection: this.context.globalStore.get(n)!.entity.parentUid! },
                Array.from(suppliesKPA.keys()).map((k) => ({ connectable: k, connection: FLOW_SOURCE_EDGE })),
                undefined,
                undefined,
                true,
                true
            );
            if (path) {
                path.reverse().forEach((e) => {
                    result.addFlow(e.uid, this.network.sn(e.to), f);
                });
            }
        });

        return result;
    }
}

// Tracks the pressure drop along the path, and augments the path so that the pressure difference is the same as
// the expected difference.
// Returns the delta speed, for iteration exit purposes.
export function adjustPathHardyCross(
    flows: FlowAssignment,
    path: Array<Edge<FlowNode, FlowEdge>>,
    network: Graph<FlowNode, FlowEdge>,
    expectedDifferenceHead: number = 0,
    context: CalculationContext,
): number {
    // Augment the path backwards
    // Use ternary search to find the smallest value of the sum of concave functions.
    let totalHeadLoss: number = 0;
    try {
        const bestAdjustment = ternarySearchForGlobalMin((num) => {
            totalHeadLoss = 0;
            path.forEach((v) => {
                const connector = context.globalStore.get(v.value.uid)!;

                const delta = getObjectFrictionHeadLoss(
                    context,
                    connector,
                    flows.getFlow(v.uid, network.sn(v.from)) + num,
                    v.from,
                    v.to,
                    true,
                    null,
                );
                if (delta === null) {
                    throw new Error("Could not get friction loss of pipe");
                }
                totalHeadLoss += delta;
            });
            return Math.abs(-expectedDifferenceHead - totalHeadLoss);
        });

        path.forEach((v) => {
            flows.addFlow(v.uid, network.sn(v.from), bestAdjustment);
        });

        return bestAdjustment;
    } catch (e) {
        // tslint:disable-next-line:no-console
        console.log(
            "error while adjusting path: " +
            JSON.stringify(path.map((v) => context.globalStore.get(v.value.uid)!.type)) +
            " expected difference: " +
            expectedDifferenceHead
        );

        // tslint:disable-next-line:no-console
        console.log("og flows: " + JSON.stringify(path.map((p) => flows.getFlow(p.uid, network.sn(p.from)))));
        // tslint:disable-next-line:no-console
        console.log("uids: " + JSON.stringify(path.map((p) => p.value.uid)));

        // tslint:disable-next-line:no-console
        console.log("last ones:");
        const o = context.globalStore.get(path[0].value.uid) as Fitting;
        for (let i = -0.25; i <= 0.25; i += 0.01) {
            // tslint:disable-next-line:no-console
            console.log(
                o.getFrictionHeadLoss(
                    context,
                    i,
                    path[1].from,
                    path[1].to,
                    true
                )
            );
        }

        throw e;
    }
}
