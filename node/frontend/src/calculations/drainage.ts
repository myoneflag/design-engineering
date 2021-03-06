import PipeEntity, { fillPipeDefaultFields } from "../../../common/src/api/document/entities/pipe-entity";
import { CalculationContext } from "./types";
import { FlowSystemParameters, NetworkType } from "../../../common/src/api/document/drawing";
import CalculationEngine, { EdgeType, FlowEdge, FlowNode } from "./calculation-engine";
import { EntityType } from "../../../common/src/api/document/entities/types";
import { assertUnreachable, isDrainage, StandardFlowSystemUids, SupportedDrainageMethods } from "../../../common/src/api/config";
import { addPsdCounts, compareDrainagePsdCounts, PsdCountEntry, subPsdCounts, zeroPsdCounts } from "./utils";
import FittingEntity from "../../../common/src/api/document/entities/fitting-entity";
import Pipe from "../htmlcanvas/objects/pipe";
import { parseCatalogNumberExact, upperBoundTable } from "../../../common/src/lib/utils";
import UnionFind from "./union-find";
import { fillFixtureFields } from "../../../common/src/api/document/entities/fixtures/fixture-entity";
import { Edge } from "./graph";
import PipeCalculation, { NoFlowAvailableReason } from "../store/document/calculations/pipe-calculation";
import { convertMeasurementSystem, Units } from "../../../common/src/lib/measurements";
import { addWarning, Warning } from "../store/document/calculations/warnings";
import { ValveType } from "../../../common/src/api/document/entities/directed-valves/valve-types";

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
                if (calc.realNominalPipeDiameterMM === null) {
                    calc.noFlowAvailableReason = NoFlowAvailableReason.NO_SUITABLE_PIPE_SIZE;
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
                        if (entity.gradePCT !== null) {
                            calc.gradePCT = entity.gradePCT; // user override grade
                        }
                        break;
                    }
                }


                if (calc.realNominalPipeDiameterMM === null) {
                    addWarning(entity.uid, calc, Warning.UPDATE_FLOW_SYSTEM_SETTINGS, "drainage");
                    calc.noFlowAvailableReason = NoFlowAvailableReason.NO_SUITABLE_PIPE_SIZE;
                }
            }
            break;
        case NetworkType.CONNECTIONS:
            // AKA vents.
            break;

    }

    if (entity.diameterMM !== null) {
        calc.realNominalPipeDiameterMM = calc.optimalInnerPipeDiameterMM = entity.diameterMM;
    }
}

export function sizeVentPipe(entity: PipeEntity, context: CalculationContext, psdUnits: PsdCountEntry) {
    const calc = context.globalStore.getOrCreateCalculation(entity);
    calc.psdUnits = psdUnits;

    const system = context.doc.drawing.metadata.flowSystems.find((fs) => fs.uid === entity.systemUid)!;
    const calculatedVentSize = getSizeOfVent(system, psdUnits);
    if (entity.diameterMM == null) {
        calc.optimalInnerPipeDiameterMM = calc.realNominalPipeDiameterMM = calculatedVentSize;
    } else {
        if (calculatedVentSize && entity.diameterMM < calculatedVentSize) {
            addWarning(entity.uid, calc, Warning.OVERRIDEN_PIPE_DIAMETER_INSUFFICIENT, "drainage");
        }
    }
    if (calc.realNominalPipeDiameterMM === null) {
        calc.noFlowAvailableReason = NoFlowAvailableReason.NO_SUITABLE_PIPE_SIZE;
    }
}

export function getSizeOfVent(system: FlowSystemParameters, psdUnits: PsdCountEntry) {
    for (const entry of system.drainageProperties.ventSizing) {
        if (entry.minUnits <= psdUnits.drainageUnits && entry.maxUnits >= psdUnits.drainageUnits) {
            return entry.sizeMM;
        }
    }
    return null;
}


// This function must be run AFTER PSDs have been propagated.
export function processDrainage(context: CalculationEngine) {
    const roots = processVentRoots(context);
    const exits = findVentExits(context);
    propagateVentedness(context, roots);
    const capacities = assignVentCapacities(context, roots);
    sizeVents(context, capacities, exits);
    // produceUnventedWarnings(context, roots);

    processFixedStacks(context);
    calculateFalls(context);

    // size I.O. and its connecting pipe going through a drainage pipe
    sizeIOandPipes(context);
}

function sizeIOandPipes(context: CalculationEngine) {
    for (const obj of context.networkObjects()) {
        if (obj.entity.type === EntityType.DIRECTED_VALVE &&
            obj.entity.valve.type === ValveType.INSPECTION_OPENING) {

            const IO = obj.entity;
            const connections = context.globalStore.getConnections(obj.entity.uid);

            const pipes = new Set<PipeEntity>();

            let finish = false;
            if (connections.length) {
                context.flowGraph.dfs(
                    {
                        connectable: obj.entity.uid,
                        connection: connections[0],
                    },
                    undefined,
                    undefined,
                    (edge) => {
                        if (edge.value.type === EdgeType.PIPE) {
                            const o = context.globalStore.get(edge.value.uid) as Pipe;
                            const pipe = o.entity;
                            const filled = fillPipeDefaultFields(context.drawing, o.computedLengthM, pipe);
                            const pc = context.globalStore.getOrCreateCalculation(pipe);

                            if (pc.psdUnits?.drainageUnits && !finish) {
                                const ioCalc = context.globalStore.getOrCreateCalculation(IO);
                                ioCalc.sizeMM = (pc.realNominalPipeDiameterMM || 0) > 110
                                    ? 160
                                    : 110;

                                pipes.forEach(i => sizePipe(i, pc.realNominalPipeDiameterMM || 0, context));

                                finish = !finish;
                            }

                            if (!finish) {
                                pipes.add(filled);
                            }
                        }
                    },
                    undefined,
                    undefined,
                )
            }
        }
    }
}

function sizePipe(filledPipe: PipeEntity, pipSize: number, context: CalculationContext) {
    const pc = context.globalStore.getOrCreateCalculation(filledPipe);

    pc.realNominalPipeDiameterMM = (pipSize > 110)
        ? ["castIronSewer", "uPVCSewer"].includes(filledPipe.material!)
            ? 150
            : 160
        : ["castIronSewer", "uPVCSewer"].includes(filledPipe.material!)
            ? 100
            : 110;
}

export function calculateFalls(context: CalculationEngine) {
    for (const obj of context.networkObjects()) {
        if (obj.entity.type === EntityType.PIPE) {
            const pipe = context.globalStore.get(obj.entity.uid) as Pipe;
            const filled = fillPipeDefaultFields(context.drawing, pipe.computedLengthM, pipe.entity);
            if (!isDrainage(filled.systemUid, context.drawing.metadata.flowSystems)) {
                continue;
            }

            // grade only applies to horizontal pipes.
            // But calculate it for all - if it isn't horizontal it just won't get shown, that's all.
            const pCalc = context.globalStore.getOrCreateCalculation(pipe.entity);
            if (pCalc.gradePCT && pCalc.lengthM) {
                pCalc.fallM = pCalc.gradePCT * pCalc.lengthM / 100;
            }
        }
    }
}

interface VentSource {
    node: FlowNode;
    entityUid: string;
    pipeSize: number;
    system: FlowSystemParameters;
    drainageUnits: number | null;
}

// Refer to https://h2xengineering.atlassian.net/secure/RapidBoard.jspa?rapidView=2&projectKey=DEV&modal=detail&selectedIssue=DEV-145
export function assignVentCapacities(context: CalculationEngine, roots: Map<string, PsdCountEntry>): Map<string, PsdCountEntry> {
    const result = new Map<string, PsdCountEntry>();
    // keep track of pipe LUs for warnings
    const unventedLUs = new Map<string, PsdCountEntry>();

    const entryPoints: VentSource[] = [];

    const fixtureOutlets: string[] = [];

    // For every fixture, find the closest vented pipe downstream, and add it to the vent root associated.
    for (const obj of context.networkObjects()) {
        if (obj.entity.type === EntityType.FIXTURE) {
            const fixture = obj.entity;
            const filled = fillFixtureFields(context.drawing, context.catalog, fixture);

            let drainageUnits: number | null = 0;
            switch (context.doc.drawing.metadata.calculationParams.drainageMethod) {
                case SupportedDrainageMethods.AS2018FixtureUnits:
                    drainageUnits = filled.asnzFixtureUnits;
                    break;
                case SupportedDrainageMethods.EN1205622000DischargeUnits:
                    drainageUnits = filled.enDischargeUnits;
                    break;
                case SupportedDrainageMethods.UPC2018DrainageFixtureUnits:
                    drainageUnits = filled.upcFixtureUnits;
                    break;
                default:
                    assertUnreachable(context.doc.drawing.metadata.calculationParams.drainageMethod)
            }

            if (obj.entity.abbreviation === 'WC') {
                drainageUnits = 0;
            }

            for (const outletUid of fixture.roughInsInOrder) {
                if (isDrainage(outletUid, context.drawing.metadata.flowSystems)) {

                    const outlet = fixture.roughIns[outletUid];
                    const connections = context.globalStore.getConnections(outlet.uid);
                    fixtureOutlets.push(outlet.uid.replace('.1', '.0'));

                    if (connections.length > 0) {
                        const pipe = context.globalStore.get(connections[0]) as Pipe;
                        const pCalcOriginal = context.globalStore.getOrCreateCalculation(pipe.entity);
                        const originalSize = pCalcOriginal.realNominalPipeDiameterMM;

                        const system = context.doc.drawing.metadata.flowSystems.find((s) =>
                            s.uid === pipe.entity.systemUid
                        );
                        if (!system) {
                            continue;
                        }

                        if (!originalSize) {
                            // We need the pipe to be sized to know how much venting it needs
                        } else {
                            entryPoints.push({
                                node: { connectable: outlet.uid, connection: connections[0] },
                                entityUid: outlet.uid,
                                pipeSize: originalSize,
                                system,
                                drainageUnits,
                            });
                        }
                    }
                }
            }
        } else if (obj.entity.type === EntityType.LOAD_NODE) {

            const connections = context.globalStore.getConnections(obj.entity.uid);
            if (connections.length > 0) {
                for (let i = 0; i < connections.length; i++) {
                    const pipe = context.globalStore.get(connections[i]) as Pipe;
                    if (!isDrainage(pipe.entity.systemUid, context.drawing.metadata.flowSystems)) {
                        continue;
                    } else {
                        i = connections.length - 1;
                    }

                    const pCalcOriginal = context.globalStore.getOrCreateCalculation(pipe.entity);

                    if (pCalcOriginal.flowFrom === obj.entity.uid) {
                        continue;
                    }

                    const originalSize = pCalcOriginal.realNominalPipeDiameterMM;
                    const system = context.doc.drawing.metadata.flowSystems.find((s) =>
                        s.uid === pipe.entity.systemUid
                    );
                    if (!system) {
                        continue;
                    }
                    const drainageUnits = pCalcOriginal.psdUnits?.drainageUnits;

                    if (!originalSize) {
                        // We need the pipe to be sized to know how much venting it needs
                    } else {
                        entryPoints.push({
                            node: { connectable: obj.entity.uid, connection: connections[i] },
                            entityUid: obj.entity.uid,
                            pipeSize: originalSize,
                            system,
                            drainageUnits: drainageUnits!,
                        });
                    }
                }
            }
        }
    }


    for (const ep of entryPoints) {

        const parentOf = new Map<string, Edge<FlowNode, FlowEdge>>();

        const distTo = new Map<string, number>();
        const maxUnventedLengthM = upperBoundTable(
            ep.system.drainageProperties.maxUnventedLengthM,
            ep.pipeSize,
        );

        context.flowGraph.dfsRecursive(
            ep.node,
            undefined,
            undefined,
            (edge) => {
                if (edge.value.type === EdgeType.PIPE) {
                    const pipe = context.globalStore.get(edge.value.uid) as Pipe;
                    parentOf.set(edge.to.connectable, edge);
                    if (!pipe || !isDrainage(pipe.entity.systemUid, context.drawing.metadata.flowSystems)) {
                        return true;
                    }

                    // only go upstream
                    const pCalc = context.globalStore.getOrCreateCalculation(pipe.entity);
                    if (edge.to.connectable !== pCalc.flowFrom) {
                        return true;
                    }
                    const prevUnvented = unventedLUs.get(edge.value.uid) || zeroPsdCounts();
                    unventedLUs.set(edge.value.uid, addPsdCounts(
                        prevUnvented,
                        {
                            continuousFlowLS: 0,
                            dwellings: 0,
                            gasMJH: 0,
                            gasMJHUnDiversified: 0,
                            gasMJHDiversified: 0,
                            gasDiversity: 0,
                            units: 0,
                            drainageUnits: ep.drainageUnits || 0,
                        },
                        context.doc,
                        context.catalog,
                    ));

                    // the whole point of this algo - assign this flow to the vent root
                    // that reaches this pipe.
                    if (pCalc.ventRoot) {
                        const curr = result.get(pCalc.ventRoot) || zeroPsdCounts();

                        result.set(pCalc.ventRoot, addPsdCounts(
                            curr,
                            {
                                continuousFlowLS: 0,
                                dwellings: 0,
                                gasMJH: 0,
                                gasMJHUnDiversified: 0,
                                gasMJHDiversified: 0,
                                gasDiversity: 0,
                                units: 0,
                                drainageUnits: ep.drainageUnits || 0,
                            },
                            context.doc,
                            context.catalog,
                        ));
                        return true;
                    } else {
                        // Check that the pipe will not exceed max unvented length or FU/DU
                        const unventedLength = (distTo.get(edge.from.connectable) || 0) + pCalc.lengthM!;

                        distTo.set(edge.to.connectable, unventedLength);

                        if (maxUnventedLengthM != null && (unventedLength > maxUnventedLengthM
                            || pCalc.ventTooFarDist)
                        ) {
                            const accountedFor = pCalc.ventTooFarDist;
                            let curr: Edge<FlowNode, FlowEdge> | undefined = edge;
                            let visitedUnventedRun: Set<string> = new Set();
                            while (curr) {
                                const currPipe = context.globalStore.get(curr.value.uid);
                                if (currPipe?.entity.type === EntityType.PIPE) {
                                    const currPCalc = context.globalStore.getOrCreateCalculation(currPipe.entity);
                                    if (visitedUnventedRun.has(curr.value.uid)) {
                                        addWarning(currPipe.entity.uid, currPCalc, Warning.LOOP_IN_PIPESYSTEM_DETECTED, "drainage");
                                        console.warn("Loop in pipesystem detected for id: " + curr.value.uid)
                                        break;
                                    }
                                    visitedUnventedRun.add(curr.value.uid)

                                    const [units, maxConverted] =
                                        convertMeasurementSystem(context.doc.drawing.metadata.units, Units.Meters, maxUnventedLengthM!);
                                    const [_, unventedConverted] =
                                        convertMeasurementSystem(context.doc.drawing.metadata.units, Units.Meters, unventedLength!);
                                    currPCalc.ventTooFarDist = true;
                                    if (fixtureOutlets.includes(currPipe.entity.endpointUid[0]) || fixtureOutlets.includes(currPipe.entity.endpointUid[1])) {
                                        addWarning(
                                            currPipe.entity.uid,
                                            currPCalc,
                                            Warning.MAX_UNVENTED_LENGTH,
                                            "drainage",
                                            {
                                                value: (maxConverted as number).toFixed(2) + units,
                                                max: (unventedConverted as number).toFixed(2) + units
                                            }
                                        );
                                    }
                                    curr = parentOf.get(curr.from.connectable);
                                }
                            }
                            if (accountedFor) {
                                return true;
                            };
                        }
                    }
                }
            }
        );
    }

    for (const ep of entryPoints) {

        const maxUnventedWCs = upperBoundTable(
            ep.system.drainageProperties.maxUnventedCapacityWCs,
            ep.pipeSize,
        );

        let unitsPerWc = 0;
        switch (context.doc.drawing.metadata.calculationParams.drainageMethod) {
            case SupportedDrainageMethods.AS2018FixtureUnits:
                unitsPerWc = parseCatalogNumberExact(context.catalog.fixtures['wc'].asnzFixtureUnits)!;
                break;
            case SupportedDrainageMethods.EN1205622000DischargeUnits:
                unitsPerWc = parseCatalogNumberExact(context.catalog.fixtures['wc'].enDrainageSystem[context.doc.drawing.metadata.calculationParams.drainageSystem])!;
                break;
            case SupportedDrainageMethods.UPC2018DrainageFixtureUnits:
                unitsPerWc = parseCatalogNumberExact(context.catalog.fixtures['wc'].upcFixtureUnits)!;
                break;
            default:
                assertUnreachable(context.doc.drawing.metadata.calculationParams.drainageMethod);
        }

        context.flowGraph.dfsRecursive(
            ep.node,
            undefined,
            undefined,
            (edge) => {
                if (edge.value.type === EdgeType.PIPE) {
                    const pipe = context.globalStore.get(edge.value.uid) as Pipe;
                    const pCalc = context.globalStore.getOrCreateCalculation(pipe.entity);

                    if (pCalc.ventRoot) {
                        return;
                    }
                    if (unventedLUs.get(edge.value.uid)) {
                        const totalDrainageUnits = pCalc.psdUnits?.drainageUnits || 0;
                        const unventedLU = unventedLUs.get(edge.value.uid)!.drainageUnits || 0;
                        if (pCalc.warnings?.filter((warning) => warning.type === Warning.MAX_UNVENTED_DRAINAGE_FLOW_EXCEEDED)?.length) {
                            return;
                        }
                        if (maxUnventedWCs && totalDrainageUnits - unventedLU > maxUnventedWCs * unitsPerWc) {
                            pCalc.ventTooFarWC = true;
                            addWarning(pipe.entity.uid, pCalc, Warning.MAX_UNVENTED_DRAINAGE_FLOW_EXCEEDED, "drainage", { value: maxUnventedWCs + ' WC\'s' });
                        }
                    }
                }
            }
        );
    }

    return result;
}

export function produceUnventedWarnings(context: CalculationEngine, roots: Map<string, PsdCountEntry>) {
    produceUnventedLengthWarningsAndGetUnventedGroup(context);
    produceUnventedUnitsWarnings(context, roots);
}

// Strategy:
// 1. Union find groups of unvented stuff together
// 2. Calculate the size of each group.
// 3. Go back to every fixture and check how many units the group it is connect to is.
// 4. Profit. No ???.
// We need roots as a param just to know what nodes to exclude, to make sure groups connected at a
// node that is vented are not joined together.
export function produceUnventedUnitsWarnings(context: CalculationEngine, roots: Map<string, PsdCountEntry>) {
    const groups = new UnionFind<string>();

    // 1. Generate the groups
    for (const obj of context.networkObjects()) {
        if (obj.entity.type === EntityType.FIXTURE) {
            const fixture = obj.entity;
            for (const outletUid of fixture.roughInsInOrder) {
                if (isDrainage(outletUid, context.drawing.metadata.flowSystems)) {
                    const outlet = fixture.roughIns[outletUid];
                    const connections = context.globalStore.getConnections(outlet.uid);

                    if (connections.length > 0) {

                        context.flowGraph.dfsRecursive(
                            { connectable: outlet.uid, connection: connections[0] },
                            undefined,
                            undefined,
                            (edge) => {
                                if (edge.value.type === EdgeType.PIPE) {
                                    const pipe = context.globalStore.get(edge.value.uid) as Pipe;
                                    if (!pipe || !isDrainage(pipe.entity.systemUid, context.drawing.metadata.flowSystems)) {
                                        return true;
                                    }
                                    const pCalc = context.globalStore.getOrCreateCalculation(pipe.entity);
                                    const nodesVented = roots.has(edge.from.connectable) || roots.has(edge.to.connectable);
                                    if (nodesVented || pCalc.ventRoot) {
                                        return true;
                                    }



                                    groups.join(edge.from.connectable, edge.to.connectable);
                                }
                            }
                        );
                    }
                }
            }
        }
    }

    // 2. Get the psdUnits of each group.
    const unitsOfGroup = new Map<string, PsdCountEntry>();
    for (const obj of context.networkObjects()) {
        if (obj.entity.type === EntityType.FIXTURE) {
            const fixture = obj.entity;
            for (const outletUid of fixture.roughInsInOrder) {
                if (isDrainage(outletUid, context.drawing.metadata.flowSystems)) {
                    const outlet = fixture.roughIns[outletUid];

                    const groupId = groups.find(outlet.uid);

                    const units = unitsOfGroup.get(groupId) || zeroPsdCounts();
                    const connections = context.globalStore.getConnections(outlet.uid);
                    if (connections.length > 0) {
                        const connectedPipe = context.globalStore.get(connections[0]) as Pipe;
                        const connectedPCalc = context.globalStore.getOrCreateCalculation(connectedPipe.entity);
                        const additionalUnits = connectedPCalc?.psdUnits;
                        if (additionalUnits) {
                            const sumUnits = addPsdCounts(units, additionalUnits, context.doc, context.catalog);
                            unitsOfGroup.set(groupId, sumUnits);
                        }
                    }

                }
            }
        }
    }

    // 3. Use the units of each group to generate warnings.

    let unitsPerWc = 0;
    switch (context.doc.drawing.metadata.calculationParams.drainageMethod) {
        case SupportedDrainageMethods.AS2018FixtureUnits:
            unitsPerWc = parseCatalogNumberExact(context.catalog.fixtures['wc'].asnzFixtureUnits)!;
            break;
        case SupportedDrainageMethods.EN1205622000DischargeUnits:
            unitsPerWc = parseCatalogNumberExact(context.catalog.fixtures['wc'].enDrainageSystem[context.doc.drawing.metadata.calculationParams.drainageSystem])!;
            break;
        case SupportedDrainageMethods.UPC2018DrainageFixtureUnits:
            unitsPerWc = parseCatalogNumberExact(context.catalog.fixtures['wc'].upcFixtureUnits)!;
            break;
        default:
            assertUnreachable(context.doc.drawing.metadata.calculationParams.drainageMethod);
    }
    for (const obj of context.networkObjects()) {
        if (obj.entity.type === EntityType.FIXTURE) {
            const fixture = obj.entity;
            for (const outletUid of fixture.roughInsInOrder) {
                if (isDrainage(outletUid, context.drawing.metadata.flowSystems)) {
                    const outlet = fixture.roughIns[outletUid];

                    // Don't trust the system of the outlet - use the first pipe instead because the outlet
                    // is a fixed drainage system but the user can draw any drainage system onto it.
                    // const system = context.doc.drawing.metadata.flowSystems.find((s) => s.uid === outletUid);

                    // if (!system) {
                    //    continue;
                    // }

                    const groupId = groups.find(outlet.uid);

                    const units = unitsOfGroup.get(groupId);

                    const connections = context.globalStore.getConnections(outlet.uid);
                    if (connections.length > 0 && units) {
                        const pipe = context.globalStore.get(connections[0]) as Pipe;
                        const pCalcOriginal = context.globalStore.getOrCreateCalculation(pipe.entity);
                        const originalSize = pCalcOriginal.realNominalPipeDiameterMM;

                        const system = context.doc.drawing.metadata.flowSystems.find((s) =>
                            s.uid === pipe.entity.systemUid
                        );
                        if (!system) {
                            continue;
                        }

                        if (!originalSize) {
                            // We need the pipe to be sized to know how much venting it needs
                            continue;
                        }

                        const maxUnventedWCs = upperBoundTable(
                            system.drainageProperties.maxUnventedCapacityWCs,
                            originalSize
                        );

                        if (maxUnventedWCs === undefined || maxUnventedWCs === null) {
                            // unlimited
                            continue;
                        }

                        const maxUnventedUnits = unitsPerWc * maxUnventedWCs;

                        console.log("For fixture " + fixture.uid + " we have " + units.drainageUnits + ' and max is ' + maxUnventedUnits);
                        if (units.drainageUnits > maxUnventedUnits) {
                            const fcalc = context.globalStore.getOrCreateCalculation(fixture);
                            addWarning(fixture.uid, fcalc, Warning.MAX_UNVENTED_DRAINAGE_FLOW_EXCEEDED, "drainage", { value: maxUnventedWCs + ' WC\'s' });
                        }
                    }
                }
            }
        }
    }
}

// Make warnings for unvented fixtures that ought to be vented.
export function produceUnventedLengthWarningsAndGetUnventedGroup(context: CalculationEngine) {

    for (const obj of context.networkObjects()) {
        if (obj.entity.type === EntityType.FIXTURE) {
            const fixture = obj.entity;
            for (const outletUid of fixture.roughInsInOrder) {
                if (isDrainage(outletUid, context.drawing.metadata.flowSystems)) {
                    const outlet = fixture.roughIns[outletUid];
                    const connections = context.globalStore.getConnections(outlet.uid);

                    if (connections.length > 0) {
                        // Theoretically, the vent shouldn't ever split (only combine), but we will handle it just in case.
                        const lengthAtNode = new Map<string, number>();

                        // Don't trust the system of the outlet - use the first pipe instead because the outlet
                        // is a fixed drainage system but the user can draw any drainage system onto it.
                        // const system = context.doc.drawing.metadata.flowSystems.find((s) => s.uid === outletUid);
                        // if (!system) {
                        //    continue;
                        // }

                        // outlets should only connect to one pipe. So for that pipe, use its size as a canary.
                        const pipe = context.globalStore.get(connections[0]) as Pipe;
                        const pCalcOriginal = context.globalStore.getOrCreateCalculation(pipe.entity);
                        const originalSize = pCalcOriginal.realNominalPipeDiameterMM;

                        const system = context.doc.drawing.metadata.flowSystems.find((s) =>
                            s.uid === pipe.entity.systemUid
                        );
                        if (!system) {
                            continue;
                        }

                        if (!originalSize) {
                            // We need the pipe to be sized to know how much venting it needs
                            continue;
                        }

                        const maxUnventedLengthM = upperBoundTable(
                            system.drainageProperties.maxUnventedLengthM,
                            originalSize
                        );

                        if (maxUnventedLengthM === undefined || maxUnventedLengthM === null) {
                            // it is unbounded
                            continue;
                        }

                        let maxUnventedExceeded = false;
                        context.flowGraph.dfsRecursive(
                            { connectable: outlet.uid, connection: connections[0] },
                            undefined,
                            undefined,
                            (edge) => {
                                if (edge.value.type === EdgeType.PIPE) {
                                    const pipe = context.globalStore.get(edge.value.uid) as Pipe;
                                    if (!pipe || !isDrainage(pipe.entity.systemUid, context.drawing.metadata.flowSystems)) {
                                        return true;
                                    }

                                    const pcalc = context.globalStore.getOrCreateCalculation(pipe.entity);
                                    if (edge.to.connectable !== pcalc.flowFrom) {
                                        return true;
                                    }
                                    // If it is already vented, we are done with the calculation.
                                    if (pcalc.ventRoot) {
                                        return true;
                                    }

                                    // We already accomplished our goal.
                                    if (maxUnventedExceeded) {
                                        return true;
                                    }

                                    const currLength = lengthAtNode.get(edge.from.connectable) || 0;
                                    const newLength = currLength + (pcalc.lengthM || 0);
                                    if (newLength > maxUnventedLengthM) {
                                        // Too big.
                                        maxUnventedExceeded = true;
                                        return true;
                                    }
                                    lengthAtNode.set(edge.to.connectable, newLength);
                                }
                            }
                        );

                        if (maxUnventedExceeded) {
                            const fcalc = context.globalStore.getOrCreateCalculation(fixture);
                            const [units, converted] =
                                convertMeasurementSystem(context.doc.drawing.metadata.units, Units.Meters, maxUnventedLengthM);
                            addWarning(fixture.uid, fcalc, Warning.MAX_UNVENTED_LENGTH, "drainage", { value: (converted as number).toFixed(2) + units });
                        }
                    }
                }
            }
        }
    }

}

export function propagateVentedness(context: CalculationEngine, roots: Map<string, PsdCountEntry>) {
    const seen = new Set<string>();
    const seenEdges = new Set<string>();
    for (const root of Array.from(roots.keys())) {
        const connection = context.globalStore.getConnections(root);
        context.flowGraph.dfsRecursive(
            { connectable: root, connection: connection[0] },
            undefined,
            undefined,
            (edge) => {
                if (edge.value.type === EdgeType.PIPE) {
                    // Only go towards the source.
                    const pipe = context.globalStore.get(edge.value.uid) as Pipe;
                    const pcalc = context.globalStore.getOrCreateCalculation(pipe.entity);
                    if (edge.to.connectable !== pcalc.flowFrom) {
                        seenEdges.delete(edge.uid);
                        return true;
                    } else {
                        if (pcalc.ventRoot) {
                            return true;
                        }
                        pcalc.ventRoot = root;
                    }
                }
            },
            undefined,
            seen,
            seenEdges,
        );
    }
}

// Assumes that vents are arranged in a tree like pattern.
export function sizeVents(context: CalculationEngine, roots: Map<string, PsdCountEntry>, exits: FittingEntity[]) {
    const seenPipes = new Set<string>();

    const exitSet = new Set<string>(exits.map((e) => e.uid));

    for (const e of exits) {
        const flowOfNode = new Map<string, PsdCountEntry>();
        let multipleVentExits = false; // the algorithm only supports a unique vent exit.
        const listOfVents: PipeEntity[] = []; // To retroactively create warnings later.

        const connection = context.globalStore.getConnections(e.uid);

        // The strategy is for the children nodes to be populated with their loads in flowOfNode,
        // then when it comes time to exit the pipe, we would know the load of our downstream, and
        // also update our upstream node.
        // Note: Here, "downstream" means from the exit to the source. So closer to exit = upstream,
        // closer to drainage pipe = downstream.
        context.flowGraph.dfsRecursive(
            { connectable: e.uid, connection: connection[0] },
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
                    || !isDrainage(pipe.entity.systemUid, context.drawing.metadata.flowSystems)
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
                flowOfNode.set(edge.from.connectable, addPsdCounts(downstreamFlow, existingUpstreamFlow, context.doc, context.catalog));

                // Size the pipe. That's what we're here for, right?
                const pipe = context.globalStore.get(edge.value.uid);
                if (pipe
                    && pipe.entity.type === EntityType.PIPE
                    && isDrainage(pipe.entity.systemUid, context.drawing.metadata.flowSystems)
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

    let seenFlowSource = false;
    let randomPipeUid = '';

    for (const obj of context.networkObjects()) {
        if (obj.entity.type === EntityType.FLOW_SOURCE) {
            if (isDrainage(obj.entity.systemUid, context.drawing.metadata.flowSystems)) {

                // The strategy: from a sewer connection, we will traverse the graph of pipes.
                // Using a similar method to processVents, we will propagate up the total sum
                // of nodes experienced at all immediate vented nodes downstream. Then, once we
                // have that, the unvented load at any point is the load of the pipe upstream
                // from it minus the load experienced (and neutralized) by the vented nodes below.

                seenFlowSource = true;
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
                    { connectable: obj.entity.uid, connection: catalyst },
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
                            || !isDrainage(pipe.entity.systemUid, context.drawing.metadata.flowSystems)
                            || (pipe.entity.network !== NetworkType.RETICULATIONS && pipe.entity.network !== NetworkType.RISERS)
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
                                if (isDrainage(cobj.entity.systemUid, context.drawing.metadata.flowSystems) && cobj.entity.network === NetworkType.CONNECTIONS) {
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
                                flowAtNextVent.set(upstreamUid, addPsdCounts(upstreamNextFlowTally, calc.psdUnits, context.doc, context.catalog));
                                // Record this root.
                                result.set(edge.to.connectable, subPsdCounts(calc.psdUnits, downstreamNextFlowTally));;
                            } else {
                                missingCalculations = true;
                            }
                        } else {
                            flowAtNextVent.set(upstreamUid, addPsdCounts(upstreamNextFlowTally, downstreamNextFlowTally, context.doc, context.catalog));
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
        if (obj.entity.type === EntityType.PIPE) {
            if (!randomPipeUid && isDrainage(obj.entity.systemUid, context.drawing.metadata.flowSystems)) {
                randomPipeUid = obj.entity.uid;
            }
        }
    }
    // there is no flow source, provide a warning into random Pipe
    if (!seenFlowSource && randomPipeUid) {
        const p = context.globalStore.get(randomPipeUid) as Pipe;
        const pCalc = context.globalStore.getOrCreateCalculation(p.entity);
        addWarning(p.entity.uid, pCalc, Warning.ADD_FLOW_SOURCE_TO_SYSTEM, "drainage");
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
                    if (pipe.entity.network === NetworkType.CONNECTIONS && isDrainage(pipe.entity.systemUid, context.drawing.metadata.flowSystems)) {
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
            if (object.entity.network === NetworkType.RISERS && isDrainage(object.entity.systemUid, context.drawing.metadata.flowSystems)) {
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
        { connectable: member.endpointUid[0], connection: member.uid },
        undefined,
        undefined,
        (edge) => {
            seen.add(edge.value.uid);
            if (edge.value.type === EdgeType.PIPE) {
                const pipe = context.globalStore.get(edge.value.uid)!.entity as PipeEntity;
                if (isDrainage(pipe.systemUid, context.drawing.metadata.flowSystems) && pipe.network === NetworkType.RISERS) {
                    // Is Stack, continue DFS along it.
                    const calc = context.globalStore.getOrCreateCalculation(pipe);
                    if (calc.psdUnits) {
                        const cmp = compareDrainagePsdCounts(calc.psdUnits, highestLU);
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
