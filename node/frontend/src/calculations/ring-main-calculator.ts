import CalculationEngine, { EdgeType, FlowEdge, FlowNode } from "./calculation-engine";
import PipeEntity, { fillPipeDefaultFields } from "../../../common/src/api/document/entities/pipe-entity";
import { Edge } from "./graph";
import { FlowAssignment } from "./flow-assignment";
import { countPsdProfile, lookupFlowRate, mergePsdProfile, PsdProfile } from "./utils";
import Pipe from "../htmlcanvas/objects/pipe";
import { lowerBoundTable, parseCatalogNumberExact } from "../../../common/src/lib/utils";
import { EPS } from "./pressure-drops";
import { adjustPathHardyCross } from "./flow-solver";
import DirectedValve from "../htmlcanvas/objects/directed-valve";
import { ValveType } from "../../../common/src/api/document/entities/directed-valves/valve-types";
import { assertUnreachable, RingMainCalculationMethod } from "../../../common/src/api/config";

export class RingMainCalculator {
    engine: CalculationEngine;

    // Here it is assumed that all sizable branches have been sized.
    // We will only size isolated simple rings.
    constructor(engine: CalculationEngine) {
        this.engine = engine;
    }

    findRingMains(): Array<Array<Edge<FlowNode, FlowEdge>>> {
        // only pipes in undirected rings form ring mains.
        const res: Array<Array<Edge<FlowNode, FlowEdge>>> = [];
        const visitedEdges = new Set<string>();
        for (const e of this.engine.flowGraph.edgeList.values()) {
            if (e.value.type === EdgeType.PIPE && !visitedEdges.has(e.uid)) {
                const ret = this.engine.flowGraph.getCycleCovering(visitedEdges, e, true, (e) => {
                    switch (e.value.type) {
                        case EdgeType.PIPE:
                        case EdgeType.FITTING_FLOW:
                        case EdgeType.ISOLATION_THROUGH:
                            return true; // because undirected
                        case EdgeType.BIG_VALVE_HOT_HOT:
                        case EdgeType.BIG_VALVE_HOT_WARM:
                        case EdgeType.BIG_VALVE_COLD_WARM:
                        case EdgeType.BIG_VALVE_COLD_COLD:
                        case EdgeType.FLOW_SOURCE_EDGE:
                        case EdgeType.CHECK_THROUGH:
                        case EdgeType.PLANT_THROUGH:
                            return false; // because directed, and can't form ring main
                    }
                });

                if (ret) {
                    res.push(ret);
                }
            }
        }

        return res;
    }


    // Assigns flow equally via PSD.
    sizeSingleRing(ring: Array<Edge<FlowNode, FlowEdge>>): FlowAssignment | null {
        // find source in ring. At the same time, eliminate cases where there are multiple sources,
        // ambiguous pipes leading in/out.
        const pipesInRing = new Set<string>();
        console.log('considering new ring...');
        for (const r of ring) {
            if (r.value.type === EdgeType.PIPE) {
                pipesInRing.add(r.value.uid);
            }
        }
        console.log('ok let\;s go');
        let sourceNode: string | null = null;
        const sinks: Array<[FlowNode, PsdProfile]> = [];
        const totalPsd = new PsdProfile();
        let systemUid: string | null = null;
        for (const edge of ring) {
            const nuid = edge.to.connectable;
            if (edge.value.type === EdgeType.PIPE) {
                systemUid = (this.engine.globalStore.get(edge.value.uid) as Pipe).entity.systemUid;
                const conns = this.engine.globalStore.getConnections(nuid);

                let psd = new PsdProfile();

                for (const cuid of conns) {
                    if (pipesInRing.has(cuid)) {
                        continue;
                    }
                    const ccalc = this.engine.globalStore.getOrCreateCalculation(this.engine.globalStore.get(cuid)!.entity as PipeEntity);
                    if (ccalc.peakFlowRate === null) {
                        console.log('in/out pipe ' + cuid + ' connected to ' + nuid + ' has no defined demand');
                        return null;
                    }

                    if (ccalc.flowFrom === null) {
                        throw new Error('missing flow from attribute');
                    }

                    if (ccalc.flowFrom !== nuid) {
                        // is a source, flowing in.
                        if (sourceNode) {
                            console.log('muiltiple flow sources, first was ' + sourceNode + ' second was ' + nuid);
                            return null;
                        }
                        sourceNode = nuid;
                    } else {
                        // is a sink, flowing out
                        mergePsdProfile(psd, ccalc.psdProfile!);
                    }

                }

                if (psd.size !== 0) {
                    mergePsdProfile(totalPsd, psd);
                    sinks.push([edge.to, psd]);
                }
            }
        }

        if (sourceNode === null || systemUid === null) {
            console.log('no source found');
            // TODO: everything zero. But wait, this is kinda impossible since we should be sized already at 0...
            return null;
        }

        // now divide equally among us.
        const psdCountTotal = countPsdProfile(totalPsd);
        const totalFRLS = lookupFlowRate(psdCountTotal, this.engine.doc, this.engine.catalog, systemUid, false)!;

        const sinkFlowsLS = new Map<string, number>();
        for (const [suid, profile] of sinks) {
            const pcount = countPsdProfile(profile);
            if (totalFRLS.fromDwellings) {
                sinkFlowsLS.set(suid.connectable, totalFRLS.flowRateLS *  pcount.dwellings / psdCountTotal.dwellings);
            } else {
                const fromUnits = totalFRLS.flowRateLS - psdCountTotal.continuousFlowLS;
                const fromUnitsAdjusted = fromUnits ? fromUnits * pcount.units / psdCountTotal.units : 0;
                sinkFlowsLS.set(suid.connectable, fromUnitsAdjusted + pcount.continuousFlowLS);
            }
        }
        // the total flow in the ring might be higher than the calculated one to adjust for correlation
        let actualTotalFlowLS = 0;
        for (const f of sinkFlowsLS.values()) {
            actualTotalFlowLS += f;
        }

        console.log('sinkFlowLS: ' + JSON.stringify(Array.from(sinkFlowsLS.entries())));
        console.log('actual flow rate: ' + actualTotalFlowLS);

        // initialize any flow from the only source to each of the sinks, along the ring.
        // Fix the flow at the start to zero. Recreate one possible flow scenario.

        let currFlow = 0;
        const assignment = new FlowAssignment();

        for (const r of ring) {
            if (r.value.type === EdgeType.PIPE) {
                if (sinkFlowsLS.has(r.from.connectable)) {
                    currFlow -= sinkFlowsLS.get(r.from.connectable)!;
                }
                if (r.from.connectable === sourceNode) {
                    currFlow += actualTotalFlowLS;
                }
            }

            assignment.addFlow(r.uid, this.engine.flowGraph.sn(r.from), currFlow);
        }

        if (Math.abs(currFlow) > EPS) {
            throw new Error('somehow this didn\'t work');
        }

        // initial sizes
        for (const r of ring) {
            if (r.value.type === EdgeType.PIPE) {
                const pipeObject = (this.engine.globalStore.get(r.value.uid) as Pipe);
                const pcalc = this.engine.globalStore.getOrCreateCalculation(pipeObject.entity);
                const filled = fillPipeDefaultFields(this.engine.drawing, pipeObject.computedLengthM, pipeObject.entity);
                let initialSize = lowerBoundTable(this.engine.catalog.pipes[filled.material!].pipesBySize, 0)!;
                if (pipeObject.entity.diameterMM) {
                    // there is a custom diameter
                    initialSize = this.engine.getPipeByNominal(pipeObject.entity, pipeObject.entity.diameterMM)!;
                }
                pcalc.realNominalPipeDiameterMM = parseCatalogNumberExact(initialSize.diameterNominalMM);
                pcalc.realInternalDiameterMM = parseCatalogNumberExact(initialSize.diameterInternalMM);
            }
        }

        let peakFlowFromIsolation = new FlowAssignment();

        switch (this.engine.doc.drawing.metadata.calculationParams.ringMainCalculationMethod) {
            case RingMainCalculationMethod.ISOLATION_CASES:
            case RingMainCalculationMethod.MAX_DISTRIBUTED_AND_ISOLATION_CASES:
                peakFlowFromIsolation = this.sizeRingWithIsolationScenarios(ring, sourceNode, sinks, systemUid);
                break;
            case RingMainCalculationMethod.PSD_FLOW_RATE_DISTRIBUTED:
                break;
            default:
                assertUnreachable(this.engine.doc.drawing.metadata.calculationParams.ringMainCalculationMethod);
        }

        switch (this.engine.doc.drawing.metadata.calculationParams.ringMainCalculationMethod) {
            case RingMainCalculationMethod.PSD_FLOW_RATE_DISTRIBUTED:
                break;
            case RingMainCalculationMethod.MAX_DISTRIBUTED_AND_ISOLATION_CASES:
                break;
            case RingMainCalculationMethod.ISOLATION_CASES:
                for (const r of ring) {
                    if (r.value.type === EdgeType.PIPE) {

                        const pipeObject = (this.engine.globalStore.get(r.value.uid) as Pipe);
                        const pcalc = this.engine.globalStore.getOrCreateCalculation(pipeObject.entity);
                        this.engine.sizePipeForFlowRate(pipeObject.entity, Math.abs(peakFlowFromIsolation.getFlow(r.value.uid)));
                        pcalc.isRingMain = true;
                    }
                }
                return peakFlowFromIsolation;
            default:
                assertUnreachable(this.engine.doc.drawing.metadata.calculationParams.ringMainCalculationMethod);
        }
        // 10 MAX_ITERS
        for (let i = 0; i < 10; i++) {
            let adjustments = 0;

            switch (this.engine.doc.drawing.metadata.calculationParams.ringMainCalculationMethod) {
                case RingMainCalculationMethod.PSD_FLOW_RATE_DISTRIBUTED:
                case RingMainCalculationMethod.MAX_DISTRIBUTED_AND_ISOLATION_CASES:
                    adjustments = adjustPathHardyCross(
                        assignment,
                        ring,
                        this.engine.flowGraph,
                        0,
                        this.engine,
                    );
                    break;
                default:
                    assertUnreachable(this.engine.doc.drawing.metadata.calculationParams.ringMainCalculationMethod);
            }

            for (const r of ring) {
                if (r.value.type === EdgeType.PIPE) {

                    const pipeObject = (this.engine.globalStore.get(r.value.uid) as Pipe);
                    const pcalc = this.engine.globalStore.getOrCreateCalculation(pipeObject.entity);
                    this.engine.sizePipeForFlowRate(pipeObject.entity, Math.max(
                        Math.abs(peakFlowFromIsolation.getFlow(r.value.uid)),
                        Math.abs(assignment.getFlow(r.uid)),
                    ));
                    pcalc.isRingMain = true;
                }
            }

            if (adjustments < EPS) {
                console.log('stopping because no more changes');
                break;
            }

        }
        return assignment;
    }

    sizeRingWithIsolationScenarios(ring: Array<Edge<FlowNode, FlowEdge>>, sourceNode: string, sinks: Array<[FlowNode, PsdProfile]>, systemUid: string): FlowAssignment {
        // For this problem, imagine that the source is at 12 o'clock as a visualization only.
        const sourceIx = ring.findIndex((e) => e.to.connectable === sourceNode);
        if (sourceIx === -1) {
            throw new Error('source not found');
        }

        // find extreme of the isolation valves
        const isolationLocations: number[] = [];
        for (let i = 0; i < ring.length; i++) {
            const ix = (sourceIx + i) % ring.length;
            if (ring[ix].value.type === EdgeType.ISOLATION_THROUGH) {

                const obj = this.engine.globalStore.get(ring[ix].to.connectable) as DirectedValve;
                if (obj.entity.valve.type !== ValveType.ISOLATION_VALVE) {
                    throw new Error('misconfigured flow graph');
                }
                if (obj.entity.valve.makeIsolationCaseOnRingMains) {
                    isolationLocations.push(ix);
                }
            }
        }

        if (isolationLocations.length === 0) {
            return new FlowAssignment();
        }

        const sinksByConnectable = new Map<string, PsdProfile>();
        for (const [fn, psd] of sinks) {
            sinksByConnectable.set(fn.connectable, psd);
        }

        const leftToRight = new FlowAssignment();
        // From rightmost isolation valve, work backwards
        let psd = new PsdProfile();
        for (let i = 0; i < ring.length; i++) {
            const ix = (isolationLocations[isolationLocations.length - 1] - i + ring.length) % ring.length;
            if (ix === sourceIx) {
                break;
            }

            if (ring[ix].value.type === EdgeType.PIPE) {
                if (sinksByConnectable.has(ring[ix].to.connectable)) {
                    mergePsdProfile(psd, sinksByConnectable.get(ring[ix].to.connectable)!);
                }

                const fr = lookupFlowRate(countPsdProfile(psd), this.engine.doc, this.engine.catalog, systemUid)!;
                leftToRight.addFlow(ring[ix].value.uid, ring[ix].from.connectable, fr.flowRateLS);
            }
        }
        const rightToLeft = new FlowAssignment();
        psd = new PsdProfile();
        for (let i = 0; i < ring.length; i++) {
            const ix = (isolationLocations[0] + i + ring.length) % ring.length;

            if (ring[ix].value.type === EdgeType.PIPE) {
                if (sinksByConnectable.has(ring[ix].from.connectable)) {
                    mergePsdProfile(psd, sinksByConnectable.get(ring[ix].from.connectable)!);
                }

                const fr = lookupFlowRate(countPsdProfile(psd), this.engine.doc, this.engine.catalog, systemUid)!;
                rightToLeft.addFlow(ring[ix].value.uid, ring[ix].to.connectable, fr.flowRateLS);
            }

            if (ix === sourceIx) {
                break;
            }
        }

        // aggregate left to right
        const aggregate = new FlowAssignment();
        for (const edge of new Set([...leftToRight.keys(), ...rightToLeft.keys()])) {
            if (Math.abs(rightToLeft.getFlow(edge)) > Math.abs(leftToRight.getFlow(edge))) {
                aggregate.set(edge, rightToLeft.get(edge)!);
            } else {
                aggregate.set(edge, leftToRight.get(edge)!);
            }
        }
        return aggregate;
    }

    calculateAllRings() {
        const rings = this.findRingMains();
        console.log('rings: ' + rings.length + ' ' + JSON.stringify(rings.map((rs) => rs.length)));
        for (const r of rings) {
            this.sizeSingleRing(r);
        }
    }
}