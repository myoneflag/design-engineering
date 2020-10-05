import PipeEntity from "../../../common/src/api/document/entities/pipe-entity";
import {CalculationContext} from "./types";
import {NetworkType} from "../../../common/src/api/document/drawing";
import CalculationEngine, {EdgeType} from "./calculation-engine";
import {EntityType} from "../../../common/src/api/document/entities/types";
import {isDrainage} from "../../../common/src/api/config";
import {comparePsdCounts, PsdCountEntry, zeroPsdCounts} from "./utils";
import FittingEntity from "../../../common/src/api/document/entities/fitting-entity";

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


// This function must be run AFTER PSDs have been propagated.
export function processDrainage(context: CalculationEngine) {
    const roots = processVentRoots(context);
    const exits = findVentExits(context);
    processVents(context, roots, exits);

    processFixedStacks(context);
}

// Assumes that vents are arranged in a tree like pattern.
export function processVents(context: CalculationEngine, roots: Map<string, PsdCountEntry>, exits: FittingEntity[]) {

}


export function processVentRoots(context: CalculationEngine): Map<string, PsdCountEntry> {

}

export function findVentExits(context: CalculationEngine): FittingEntity[] {

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
    const connections = context.globalStore.getConnections(member.uid);

    let highestLU: PsdCountEntry = zeroPsdCounts();
    const fullStack: PipeEntity[] = [];
    let isUndefined = false;

    const seenSystemUids = new Set<string>();

    context.flowGraph.dfs(
        {connectable: connections[0], connection: member.uid},
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
        return;
    }

    let allStackNotDiminishing = true;
    let allStackDiminishing = true;
    for (const suid of seenSystemUids) {
        const system = context.doc.drawing.metadata.flowSystems.find((fs) => fs.uid === suid);
        if (!system || system.drainageProperties.stackSizeDiminish === true) {
            allStackNotDiminishing = false;
        } else if (system && system.drainageProperties.stackSizeDiminish === false) {
            allStackDiminishing = false;
        }
    }

    if (!allStackNotDiminishing || !allStackDiminishing) {
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