import PipeEntity, {fillPipeDefaultFields} from "../../../common/src/api/document/entities/pipe-entity";
import {CalculationContext} from "./types";
import {FlowSystemParameters, NetworkType} from "../../../common/src/api/document/drawing";
import CalculationEngine, {EdgeType} from "./calculation-engine";
import {EntityType} from "../../../common/src/api/document/entities/types";
import {isDrainage} from "../../../common/src/api/config";
import {addPsdCounts, comparePsdCounts, PsdCountEntry, subPsdCounts, zeroPsdCounts} from "./utils";
import FittingEntity from "../../../common/src/api/document/entities/fitting-entity";
import Pipe from "../htmlcanvas/objects/pipe";


export function sizeDrainagePipe(entity: PipeEntity, context: CalculationContext, overridePsdUnits?: PsdCountEntry) {
    const calc = context.globalStore.getOrCreateCalculation(entity);
    const psdUnits = overridePsdUnits || calc.psdUnits;
    const system = context.doc.drawing.metadata.flowSystems.find((s) => s.uid === entity.systemUid);

    if (!system) {
        return;
    }

    switch (entity.network) {
        case NetworkType.RISERS:

            // Just calculate it like it is a diminishing stack, the code for calculating fixed stacks
            // will override it later when it is called afterwards in calculation-engine.ts.
            // Alternatively, this is reused when calculating each segment of the full fixed stack,
            // after the appropriate psdUnits is set in the calculation.
            if (psdUnits !== null && psdUnits.drainageUnits !== null) {
                for (const size of system.drainageProperties.stackPipeSizing) {
                    if (size.minUnits <= psdUnits.drainageUnits && size.maxUnits >= psdUnits.drainageUnits) {
                        calc.realNominalPipeDiameterMM = calc.optimalInnerPipeDiameterMM = size.sizeMM;
                        break;
                    }
                }

                if (system.drainageProperties.stackDedicatedVent) {
                    calc.stackDedicatedVentSize = getSizeOfVent(system, psdUnits);
                }
            }
            break;
        case NetworkType.RETICULATIONS:
            if (psdUnits !== null && psdUnits.drainageUnits !== null) {
                for (const size of system.drainageProperties.horizontalPipeSizing) {
                    if (size.minUnits <= psdUnits.drainageUnits && size.maxUnits >= psdUnits.drainageUnits) {
                        calc.realNominalPipeDiameterMM = calc.optimalInnerPipeDiameterMM = size.sizeMM;
                        calc.gradePCT = size.gradePCT;
                        break;
                    }
                }
            }
            break;
        case NetworkType.CONNECTIONS:
            // AKA vents.
            break;

    }
}

export function sizeVentPipe(entity: PipeEntity, context: CalculationContext, psdUnits: PsdCountEntry) {
    const calc = context.globalStore.getOrCreateCalculation(entity);
    calc.psdUnits = psdUnits;

    const system = context.doc.drawing.metadata.flowSystems.find((fs) => fs.uid === entity.systemUid)!;
    calc.optimalInnerPipeDiameterMM = calc.realNominalPipeDiameterMM = getSizeOfVent(system, psdUnits);
}

export function getSizeOfVent(system: FlowSystemParameters, psdUnits: PsdCountEntry) {
    for (const entry of system.drainageProperties.ventSizing) {
        if (entry.minUnits <= psdUnits.drainageUnits && entry.maxUnits >= psdUnits.drainageUnits) {
            return entry.sizeMM;
        }
    }
    return null;
}

export function sizeDedicatedVentOfPipe(entity: PipeEntity, context: CalculationContext, psdUnits: PsdCountEntry) {
    const calc = context.globalStore.getOrCreateCalculation(entity);
    calc.psdUnits = psdUnits;

    const system = context.doc.drawing.metadata.flowSystems.find((fs) => fs.uid === entity.systemUid)!;
    for (const entry of system.drainageProperties.ventSizing) {
        if (entry.minUnits <= psdUnits.drainageUnits && entry.maxUnits >= psdUnits.drainageUnits) {
            calc.stackDedicatedVentSize = entry.sizeMM;
            break;
        }
    }
}

// This function must be run AFTER PSDs have been propagated.
export function processDrainage(context: CalculationEngine) {
    const roots = processVentRoots(context);
    const exits = findVentExits(context);
    processVents(context, roots, exits);

    processFixedStacks(context);
}

// Assumes that vents are arranged in a tree like pattern.
export function processVents(context: CalculationEngine, roots: Map<string, PsdCountEntry>, exits: FittingEntity[]) {
    const seenPipes = new Set<string>();

    const exitSet = new Set<string>(exits.map((e) => e.uid));

    for (const e of exits) {
        const flowOfNode = new Map<string, PsdCountEntry>();
        const lengthOfNode = new Map<string, number>();
        let multipleVentExits = false; // the algorithm only supports a unique vent exit.
        const listOfVents: PipeEntity[] = []; // To retroactively create warnings later.

        const connection = context.globalStore.getConnections(e.uid);

        // The strategy is for the children nodes to be populated with their loads in flowOfNode,
        // then when it comes time to exit the pipe, we would know the load of our downstream, and
        // also update our upstream node.
        // Note: Here, "downstream" means from the exit to the source. So closer to exit = upstream,
        // closer to drainage pipe = downstream.
        context.flowGraph.dfsRecursive(
            {connectable: e.uid, connection: connection[0]},
            undefined,
            undefined,
            (edge) => {
                if (edge.value.type !== EdgeType.PIPE) {
                    return;
                }

                // Only go down vents
                const pipe = context.globalStore.get(edge.value.uid);
                if (!pipe
                    || pipe.entity.type !== EntityType.PIPE
                    || !isDrainage(pipe.entity.systemUid)
                    || pipe.entity.network !== NetworkType.CONNECTIONS
                ) {
                    return true;
                }

                if (seenPipes.has(edge.value.uid)) {
                    return true; // this shouldn't really happen unless there are multiple vent exits per group.
                    // But we check for it anyway and break here to save computation in that case.
                }
                seenPipes.add(edge.value.uid);

                listOfVents.push(pipe.entity);

                // Look for terminal cases going down
                const to = edge.to.connectable;
                if (roots.has(to)) {
                    flowOfNode.set(edge.to.connectable, roots.get(to) || zeroPsdCounts());
                }
                if (exitSet.has(to) && to !== e.uid) {
                    // We have found a connected exit that is not us. There are two exits - this makes vent
                    // sizing ambiguous and is currently not supported.
                    multipleVentExits = true;
                }
            },
            (edge, wasCancelled) => {
                if (wasCancelled) {
                    return;
                }

                if (edge.value.type !== EdgeType.PIPE) {
                    return;
                }

                const downstreamFlow = flowOfNode.get(edge.to.connectable) || zeroPsdCounts();

                // Propagate to upstream
                const existingUpstreamFlow = flowOfNode.get(edge.from.connectable) || zeroPsdCounts();
                flowOfNode.set(edge.from.connectable, addPsdCounts(downstreamFlow, existingUpstreamFlow));

                // Size the pipe. That's what we're here for, right?
                const pipe = context.globalStore.get(edge.value.uid);
                if (pipe
                    && pipe.entity.type === EntityType.PIPE
                    && isDrainage(pipe.entity.systemUid)
                    && pipe.entity.network === NetworkType.CONNECTIONS
                ) {
                    sizeVentPipe(pipe.entity, context, downstreamFlow);
                } else {
                    throw new Error('Leaving a pipe that wasn\'t a vent');
                }
            }
        );

        if (multipleVentExits) {
            // TODO: invalidate the sizings and produce warnings.
            console.log("ERROR: There are multiple vent exits");
        }
    }
}


export function processVentRoots(context: CalculationEngine): Map<string, PsdCountEntry> {
    const result = new Map<string, PsdCountEntry>();

    // Even though in a well drawn document, we won't visit pipes twice (everything is a tree),
    // in case it IS poorly draw, keep this seen set to help avoid taking too much time.
    const seenPipes = new Set<string>();

    for (const obj of context.networkObjects()) {
        if (obj.entity.type === EntityType.FLOW_SOURCE) {
            if (isDrainage(obj.entity.systemUid)) {

                // The strategy: from a sewer connection, we will traverse the graph of pipes.
                // Using a similar method to processVents, we will propagate up the total sum
                // of nodes experienced at all immediate vented nodes downstream. Then, once we
                // have that, the unvented load at any point is the load of the pipe upstream
                // from it minus the load experienced (and neutralized) by the vented nodes below.

                const flowAtNextVent = new Map<string, PsdCountEntry>();
                const lenghtAtNextVent = new Map<string, number>();
                let multipleSewerConnections = false;
                let missingCalculations = false;
                const listOfPipes: PipeEntity[] = [];

                const connections = context.globalStore.getConnections(obj.entity.uid);
                if (!connections.length) {
                    continue;
                }

                const catalyst = connections[0];
                context.flowGraph.dfsRecursive(
                    {connectable: obj.entity.uid, connection: catalyst},
                    undefined,
                    undefined,
                    (edge) => {
                        if (edge.value.type !== EdgeType.PIPE) {
                            return;
                        }

                        // Only go down drainage pipes
                        const pipe = context.globalStore.get(edge.value.uid);
                        if (!pipe
                            || pipe.entity.type !== EntityType.PIPE
                            || !isDrainage(pipe.entity.systemUid)
                            || pipe.entity.network !== NetworkType.RETICULATIONS
                        ) {
                            return true;
                        }

                        if (seenPipes.has(edge.value.uid)) {
                            return true; // this shouldn't really happen unless there are multiple drainages per group.
                        }
                        seenPipes.add(edge.value.uid);

                        listOfPipes.push(pipe.entity);
                    },
                    (edge, wasCancelled) => {
                        if (wasCancelled) {
                            return;
                        }
                        if (edge.value.type !== EdgeType.PIPE) {
                            return;
                        }

                        // Every potential vent root is represented by the pipe "upstream" from it.
                        const downUid = edge.to.connectable;
                        const connections = context.globalStore.getConnections(downUid);
                        let isRoot = false;

                        for (const cuid of connections) {
                            const cobj = context.globalStore.get(cuid);
                            if (cobj && cobj.entity.type === EntityType.PIPE) {
                                if (isDrainage(cobj.entity.systemUid) && cobj.entity.network === NetworkType.CONNECTIONS) {
                                    isRoot = true;
                                }
                            }
                        }

                        const upstreamUid = edge.from.connectable;

                        const pipe = context.globalStore.get(edge.value.uid) as Pipe;
                        if (!pipe || pipe.entity.type !== EntityType.PIPE) {
                            return;
                        }
                        const calc = context.globalStore.getOrCreateCalculation(pipe.entity);
                        const filled = fillPipeDefaultFields(context.drawing, pipe.computedLengthM, pipe.entity);

                        const upstreamNextFlowTally = flowAtNextVent.get(upstreamUid) || zeroPsdCounts();
                        const downstreamNextFlowTally = flowAtNextVent.get(downUid) || zeroPsdCounts();

                        const upstreamNextLengthTally = lenghtAtNextVent.get(upstreamUid) || 0;
                        const downstreamNextLengthTally = lenghtAtNextVent.get(downUid) || 0;

                        if (isRoot) {
                            lenghtAtNextVent.set(upstreamUid, Math.max(upstreamNextLengthTally, filled.lengthM!));
                            if (calc.psdUnits) {
                                flowAtNextVent.set(upstreamUid, addPsdCounts(upstreamNextFlowTally, calc.psdUnits));
                                // Record this root.
                                result.set(edge.to.connectable, subPsdCounts(calc.psdUnits, downstreamNextFlowTally));;
                            } else {
                                missingCalculations = true;
                            }
                        } else {
                            flowAtNextVent.set(upstreamUid, addPsdCounts(upstreamNextFlowTally, downstreamNextFlowTally));
                        }
                    }
                );

                if (missingCalculations) {
                    // TODO: produce warnings for missing calculations
                    console.log("ERROR: There are missing PSD values along the pipes leading into the vent");
                }
                if (multipleSewerConnections) {
                    // TODO: produce warnings for multiple sewer connections connected to same system.
                    console.log("ERROR: There are multiple sewer connections");
                }
            }
        }
    }
    return result;
}

export function findVentExits(context: CalculationEngine): FittingEntity[] {
    const result: FittingEntity[] = [];
    for (const obj of context.networkObjects()) {
        if (obj.entity.type === EntityType.FITTING) {
            const connections = context.globalStore.getConnections(obj.entity.uid);
            if (connections.length === 1) {
                const pipe = context.globalStore.get(connections[0])!;
                if (pipe.entity.type === EntityType.PIPE) {
                    if (pipe.entity.network === NetworkType.CONNECTIONS && isDrainage(pipe.entity.systemUid)) {
                        result.push(obj.entity);
                    }
                }
            }
        }
    }
    return result;
}

export function processFixedStacks(context: CalculationEngine) {
    const seen = new Set<string>();
    for (const uid of context.networkObjectUids) {
        if (seen.has(uid)) {
            continue;
        }

        const object = context.globalStore.get(uid)!;
        if (object.entity.type === EntityType.PIPE) {
            if (object.entity.network === NetworkType.RISERS && isDrainage(object.entity.systemUid)) {
                // Is a stack!
                processFixedStack(context, object.entity, seen);
            }
        }

        seen.add(uid);
    }
}

export function processFixedStack(context: CalculationEngine, member: PipeEntity, seen: Set<string>) {

    let highestLU: PsdCountEntry = zeroPsdCounts();
    const fullStack: PipeEntity[] = [];
    let isUndefined = false;

    const seenSystemUids = new Set<string>();

    context.flowGraph.dfs(
        {connectable: member.endpointUid[0], connection: member.uid},
        undefined,
        undefined,
        (edge) => {
            seen.add(edge.value.uid);
            if (edge.value.type === EdgeType.PIPE) {
                const pipe = context.globalStore.get(edge.value.uid)!.entity as PipeEntity;
                if (isDrainage(pipe.systemUid) && pipe.network === NetworkType.RISERS) {
                    // Is Stack, continue DFS along it.
                    const calc = context.globalStore.getOrCreateCalculation(pipe);
                    if (calc.psdUnits) {
                        const cmp = comparePsdCounts(calc.psdUnits, highestLU);
                        if (cmp !== null && cmp > 0) {
                            highestLU = calc.psdUnits;
                        } else if (cmp === null) {
                            isUndefined = true;
                        }
                    } else {
                        isUndefined = true;
                    }
                    fullStack.push(pipe);
                    seenSystemUids.add(pipe.systemUid);
                } else {
                    return true; // Don't go along anything that isn't a stack.
                }
            }
        },
    );

    if (isUndefined) {
        // produce a warning TODO
        console.log("Pipe in stack has undefined PSD, can't size properly now.");
        return;
    }

    let allStackNotDiminishing = true;
    let allStackDiminishing = true;
    for (const suid of Array.from(seenSystemUids.values())) {
        const system = context.doc.drawing.metadata.flowSystems.find((fs) => fs.uid === suid);
        if (!system || system.drainageProperties.stackSizeDiminish === true) {
            allStackNotDiminishing = false;
        } else if (!system || system.drainageProperties.stackSizeDiminish === false) {
            allStackDiminishing = false;
        }
    }

    if (!allStackNotDiminishing && !allStackDiminishing) {
        // produce a warning that segments in this pipe have incompatable settings for stack size diminishing
        return;
    }

    // We are good
    if (allStackNotDiminishing) {
        // OK so finally, in this case we actually want to size the stack.
        for (const pipe of fullStack) {
            const calc = context.globalStore.getOrCreateCalculation(pipe);
            sizeDrainagePipe(pipe, context, highestLU);
        }
    }
}