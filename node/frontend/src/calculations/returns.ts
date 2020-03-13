import { EntityType } from "../../../common/src/api/document/entities/types";
import { PlantType, ReturnSystemPlant } from "../../../common/src/api/document/entities/plants/plant-types";
import Graph, { Edge } from "./graph";
import { assertUnreachable } from "../../../common/src/api/config";
import PipeEntity, { fillPipeDefaultFields } from "../../../common/src/api/document/entities/pipe-entity";
import { Configuration, NoFlowAvailableReason } from "../store/document/calculations/pipe-calculation";
import CalculationEngine, { EdgeType, FlowEdge } from "./calculation-engine";
import { CalculationContext } from "./types";
import Pipe from "../htmlcanvas/objects/pipe";
import {
    AIR_PROPERTIES,
    SURFACE_EMMISIVITY,
    THERMAL_CONDUCTIVITY
} from "../../../common/src/api/constants/air-properties";
import { evaluatePolynomial } from "../../../common/src/lib/polynomials";
import { isSeriesParallel, SPNode, SPTree } from "./series-parallel";
import PlantEntity, { fillPlantDefaults } from "../../../common/src/api/document/entities/plants/plant-entity";
import { interpolateTable } from "../../../common/src/lib/utils";
import { ValveType } from "../../../common/src/api/document/entities/directed-valves/valve-types";

export interface ReturnRecord {
    spTree: SPTree<Edge<string, FlowEdge>>;
    plant: PlantEntity;
}

export function identifyReturns(engine: CalculationEngine): ReturnRecord[] {
    const records: ReturnRecord[] = [];
    for (const o of engine.networkObjects()) {
        if (o.entity.type === EntityType.PLANT && o.entity.plant.type === PlantType.RETURN_SYSTEM) {
            const connsOutlet = engine.globalStore.getConnections(o.entity.outletUid);
            const connsReturn = engine.globalStore.getConnections(o.entity.plant.returnUid);
            if (connsOutlet.length !== 1) {
                continue;
            }
            if (connsReturn.length !== 1) {
                continue;
            }


            const thisNode = { connectable: o.entity.outletUid, connection: o.entity.uid };
            const component = engine.flowGraph.getConnectedComponent(thisNode);

            const newGraph = Graph.fromSubgraph(component, engine.serializeNode);

            // add faux edge between source and sink of return pump because it was excluded in the original graph
            // but is needed here to extract the loops.
            newGraph.addDirectedEdge(
                {
                    connectable: o.entity.plant.returnUid,
                    connection:  o.entity.uid ,
                },
                {
                    connectable: o.entity.outletUid,
                    connection: o.entity.uid ,
                },
                {
                    type: EdgeType.RETURN_PUMP,
                    uid: o.entity.uid,
                },
            );

            const biConnected = newGraph.findBridgeSeparatedComponents()[1];

            const returnComponent = biConnected.find(([nodes, edges]) => {
                return nodes.find((n) => engine.serializeNode(n) === engine.serializeNode(thisNode));
            });

            if (!returnComponent) {
                throw new Error('Graph algorithm error - no connected component contains the return node');
            }

            // construct a simple graph for series-parallel analysis
            const simpleGraph = new Graph<string, FlowEdge>((n) => n);
            for (const e of returnComponent[1]) {
                switch (e.value.type) {
                    case EdgeType.PIPE:
                    case EdgeType.BIG_VALVE_HOT_HOT:
                    case EdgeType.BIG_VALVE_HOT_WARM:
                    case EdgeType.BIG_VALVE_COLD_WARM:
                    case EdgeType.BIG_VALVE_COLD_COLD:
                        simpleGraph.addEdge(e.from.connectable, e.to.connectable, e.value, e.uid);
                        break;
                    case EdgeType.BALANCING_THROUGH:
                    case EdgeType.FITTING_FLOW:
                    case EdgeType.FLOW_SOURCE_EDGE:
                    case EdgeType.CHECK_THROUGH:
                    case EdgeType.ISOLATION_THROUGH:
                    case EdgeType.PLANT_THROUGH:
                        // an extrapolated edge which will interfere with series parallel analysis.
                        break;
                    case EdgeType.RETURN_PUMP:
                        // DO nothing. The edges related to the pump are done on the pipe.
                        break;
                    default:
                        assertUnreachable(e.value.type);
                }
            }

            const res = isSeriesParallel(simpleGraph, o.entity.outletUid, o.entity.plant.returnUid);
            if (res) {
                const [orderLookup, spTree] = res;
                records.push({spTree, plant: o.entity});
                // we are good.
                for (const e of returnComponent[1]) {
                    if (e.value.type === EdgeType.PIPE) {
                        const p = engine.globalStore.get(e.value.uid)!.entity as PipeEntity;
                        const pc = engine.globalStore.getOrCreateCalculation(p);
                        pc.configuration = Configuration.RETURN;
                        pc.flowFrom = orderLookup.get(e.uid)!;
                    }
                }
            } else {
                for (const e of returnComponent[1]) {
                    if (e.value.type === EdgeType.PIPE) {
                        const p = engine.globalStore.get(e.value.uid)!.entity as PipeEntity;
                        const pc = engine.globalStore.getOrCreateCalculation(p);
                        pc.configuration = Configuration.RETURN;
                        pc.noFlowAvailableReason = NoFlowAvailableReason.INVALID_RETURN_NETWORK;
                    }
                }
                // we are not good.
            }
        }
    }
    return records;
}

const MAX_ITER_CHANGE = 1e-7;

// Context: hot water through a pipe loses temperature as it goes. How much temperature it loses depends on its current
// temperature, among other things. So to find the heat loss of a whole segment of pipe, we stop at every small
// temperature change to re-evaluate. Hence this function, which is called many times along a piece of pipe in order
// to simulate its true heat loss.
// Using cheguide's iterative formula to calculate heat loss, a port of the spreadsheet.
export function getHeatLossOfPipeMomentWATT_M(context: CalculationContext, pipe: Pipe, tempC: number, windSpeedMS: number): number | null {
    const pCalc = context.globalStore.getOrCreateCalculation(pipe.entity);
    const filled = fillPipeDefaultFields(context.drawing, pipe.computedLengthM, pipe.entity);
    const ga = context.doc.drawing.metadata.calculationParams.gravitationalAcceleration;

    if (!pCalc.realNominalPipeDiameterMM || !pCalc.realInternalDiameterMM) {
        return null;
    }

    const flowSystem = context.doc.drawing.metadata.flowSystems.find((fs) => fs.uid === pipe.entity.systemUid)!;

    const DELTA_INIT = 1;
    const ambientTemperatureC = context.doc.drawing.metadata.calculationParams.roomTemperatureC;
    let surfaceTempC = ambientTemperatureC + DELTA_INIT;
    let interfaceTempC = tempC - DELTA_INIT;


    const insulationThicknessMM = flowSystem.insulationThicknessMM;
    const bareOutsideDiameter = pCalc.realInternalDiameterMM * 1.125;
    const totalOutsideDiameter = bareOutsideDiameter + insulationThicknessMM * 2;

    let oldHeatLoss = -Infinity;

    let iters = 0;
    while (true) {
        iters += 1;
        if (iters > 10) return null;
        // Calculation for insulated pipe
        const averageFilmTemperatureC   = (surfaceTempC + context.doc.drawing.metadata.calculationParams.roomTemperatureC) / 2;
        const averageFilmTemperatureK   = averageFilmTemperatureC + 273.15;
        const thermalConductivityW_MK   = evaluatePolynomial(AIR_PROPERTIES.thermalConductivityW_MK_3, averageFilmTemperatureK) / 1e3;
        const viscosity_N_SM2           = evaluatePolynomial(AIR_PROPERTIES.viscosityNS_M2_7, averageFilmTemperatureK) / 1e7;
        const prandtlNumber             = evaluatePolynomial(AIR_PROPERTIES.prandtlNumber, averageFilmTemperatureK);
        const expansionCoefficient_1_K  = 1 / averageFilmTemperatureK;
        const airDensity_KG_M3          = 29 / 0.0820575 / averageFilmTemperatureK;
        const kinematicViscosityM2_S    = evaluatePolynomial(AIR_PROPERTIES.kinematicViscosityM2_S_6, averageFilmTemperatureK) / 1e6;
        const specificHeatKJ_KGK        = evaluatePolynomial(AIR_PROPERTIES.specificHeatKJ_KGK, averageFilmTemperatureK);
        const alphaM2_S                 = evaluatePolynomial(AIR_PROPERTIES.alphaM2_S_6, averageFilmTemperatureK) / 1e6;
        const reynoldsNumber            = totalOutsideDiameter / 1000 * windSpeedMS / kinematicViscosityM2_S;
        const rayleighNumber            = ga * expansionCoefficient_1_K * Math.abs(surfaceTempC - ambientTemperatureC) * (totalOutsideDiameter / 1000) ** 3 / (kinematicViscosityM2_S * alphaM2_S);


        // Air film resistance
        const radiationW_M2K            = 0.00000005670373 * SURFACE_EMMISIVITY[flowSystem.insulationMaterial] * ((surfaceTempC + 273.15) ** 4 - (ambientTemperatureC + 273.15));

        const nu_forced                 = 0.3 + (0.62*Math.sqrt(reynoldsNumber) * Math.pow(prandtlNumber, 1/3)) * (1 + (reynoldsNumber / 282000) ** (5/8)) ** (4/5) / (1 + (0.4 / prandtlNumber) ** (2/3)) ** (1/4);
        const forcedConvectionW_M2K     = nu_forced * thermalConductivityW_MK / (totalOutsideDiameter / 1000);

        const nu_free                   = (0.6 + 0.387 * rayleighNumber ** (1/6) / (1 + (0.559 / prandtlNumber) ** (9 / 16)) ** (8 / 27)) ** 2;
        const freeConvectionW_M2K       = nu_free * thermalConductivityW_MK / (totalOutsideDiameter / 1000);

        const nu_combined               = (nu_forced ** 4 + nu_free ** 4) ** (1/4);
        const combinedConvectionW_M2K   = nu_combined * thermalConductivityW_MK / (totalOutsideDiameter / 1000);
        const overallAirSideHtcW_M2K    = combinedConvectionW_M2K + radiationW_M2K;

        // Pipe Resistance
        const pipeThermalConductivityW_MK = evaluatePolynomial(THERMAL_CONDUCTIVITY[filled.material!], tempC + 273.15);
        const pipeWallResistanceM2K_W   = (totalOutsideDiameter / 1000) * Math.log(bareOutsideDiameter / pCalc.realInternalDiameterMM) / (2 * pipeThermalConductivityW_MK);

        // Insulation Resistance
        const averageInsulationTempK    = (surfaceTempC + interfaceTempC) / 2 + 273.15;
        const insulationThermalConductivityW_MK = evaluatePolynomial(THERMAL_CONDUCTIVITY[flowSystem.insulationMaterial], averageInsulationTempK);
        const insulationResistanceM2K_W = (totalOutsideDiameter / 1000) * Math.log(totalOutsideDiameter / bareOutsideDiameter) / (2 * insulationThermalConductivityW_MK);

        // Overall Resistance
        const overallResistanceM2_KW    = insulationResistanceM2K_W + pipeWallResistanceM2K_W + 1 / overallAirSideHtcW_M2K;
        const heatFlowW_M2              = (tempC - ambientTemperatureC) / overallResistanceM2_KW;


        interfaceTempC                  = tempC - heatFlowW_M2 * pipeWallResistanceM2K_W;

        surfaceTempC                    = interfaceTempC - heatFlowW_M2 * insulationResistanceM2K_W;

        const heatLossPerUnitLengthW_M  = heatFlowW_M2 * Math.PI * (totalOutsideDiameter / 1000);
        if (Math.abs(oldHeatLoss - heatLossPerUnitLengthW_M) < MAX_ITER_CHANGE) {
            return heatLossPerUnitLengthW_M;
        }
        oldHeatLoss = heatLossPerUnitLengthW_M;
    }
}


export function getHeatLossOfPipeWATT(context: CalculationContext, pipe: Pipe, tempC: number) {
    const filled = fillPipeDefaultFields(context.drawing, pipe.computedLengthM, pipe.entity);
    const moment = getHeatLossOfPipeMomentWATT_M(context, pipe, tempC, 0);
    if (moment === null || filled.lengthM === null) {
        return null;
    }
    return moment * filled.lengthM;
}

function getNodeHeatLossWATT(context: CalculationContext, node: SPNode<Edge<unknown, FlowEdge>>, tempC: number, cache: Map<string, number | null>): number | null {
    if (cache.has(node.edge)) {
        return cache.get(node.edge)!;
    }

    let tot: number | null = 0;

    switch (node.type) {
        case "parallel":
            for (const sib of node.siblings) {
                const res = getNodeHeatLossWATT(context, sib, tempC, cache);
                if (res === null || tot === null) {
                    tot = null;
                } else {
                    tot += res;
                }
            }
            break;
        case "series":
            for (const sib of node.children) {
                const res = getNodeHeatLossWATT(context, sib, tempC, cache);
                if (res === null || tot === null) {
                    tot = null;
                } else {
                    tot += res;
                }
            }
            break;
        case "leaf":
            switch (node.edgeConcrete.value.type) {
                case EdgeType.PIPE:
                    const pipe = context.globalStore.get(node.edgeConcrete.value.uid) as Pipe;
                    tot = getHeatLossOfPipeWATT(context, pipe, tempC);
                    break;
                case EdgeType.BIG_VALVE_HOT_HOT:
                case EdgeType.BIG_VALVE_HOT_WARM:
                case EdgeType.BIG_VALVE_COLD_WARM:
                case EdgeType.BIG_VALVE_COLD_COLD:
                case EdgeType.FITTING_FLOW:
                case EdgeType.FLOW_SOURCE_EDGE:
                case EdgeType.CHECK_THROUGH:
                case EdgeType.ISOLATION_THROUGH:
                case EdgeType.PLANT_THROUGH:
                case EdgeType.RETURN_PUMP:
                case EdgeType.BALANCING_THROUGH:
                    break;
                default:
                    assertUnreachable(node.edgeConcrete.value.type);
            }
            break;
        default:
            assertUnreachable(node);
    }

    cache.set(node.edge, tot);
    return tot;
}

// The strategy is to split flow rate down the paths, proportional to their heat loss.
// also, return the delta in pipe sizes that occurred, becuase yeah one of our processes want dat
function setFlowRatesNode(
    context: CalculationEngine,
    filledReturn: ReturnSystemPlant,
    currNode: SPNode<Edge<unknown, FlowEdge>>,
    currFlowRate: number,
    heatLossCache: Map<string, number | null>,
    ): number| null {
    let res: number | null = 0;
    switch (currNode.type) {
        case "parallel":
            const totalHeatLossWATT = heatLossCache.get(currNode.edge)!;

            if (totalHeatLossWATT !== null) {
                for (const n of currNode.siblings) {
                    const thisHeatLossWATT = heatLossCache.get(n.edge)!;
                    if (thisHeatLossWATT === null) {
                        throw new Error('wat impossible - totalHeatLossWATT would have to be null then');
                    }

                    const tmp = setFlowRatesNode(context, filledReturn, n, currFlowRate * thisHeatLossWATT / totalHeatLossWATT, heatLossCache);
                    if (tmp === null || res === null) {
                        res = null;
                    } else {
                        res += tmp;
                    }
                }
            }
            break;
        case "series":
            for (const n of currNode.children) {
                const tmp = setFlowRatesNode(context, filledReturn, n, currFlowRate, heatLossCache);
                if (tmp === null || res === null) {
                    res = null;
                } else {
                    res += tmp;
                }
            }
            break;
        case "leaf":
            // physically set the flow rate for the pipe.
            if (currNode.edgeConcrete.value.type === EdgeType.PIPE) {
                const pipe = context.globalStore.get(currNode.edgeConcrete.value.uid) as Pipe;
                const filled = fillPipeDefaultFields(context.drawing, pipe.computedLengthM, pipe.entity);
                const pCalc = context.globalStore.getOrCreateCalculation(pipe.entity);
                pCalc.rawReturnFlowRateLS = currFlowRate;


                const origSize = pCalc.realNominalPipeDiameterMM;

                let peakFlowRate = pCalc.PSDFlowRateLS;
                if (peakFlowRate !== null) {
                    if (filledReturn.addReturnToPSDFlowRate) {
                        peakFlowRate += pCalc.rawReturnFlowRateLS;
                    }
                }

                context.sizePipeForFlowRate(pipe.entity, [
                    [peakFlowRate, filled.maximumVelocityMS!],
                    [pCalc.rawReturnFlowRateLS, filledReturn.returnVelocityMS!],
                ]);
                if (pCalc.realNominalPipeDiameterMM === null || origSize === null) {
                    res = null;
                } else {
                    res = Math.abs(pCalc.realNominalPipeDiameterMM - origSize);
                }
            }
            break;
        default:
            assertUnreachable(currNode);
    }
    return res;
}

// Takes a look at the return loop, and calculates the return flow rates of each pipe. Pipes are found as leaf nodes
// in the series parallel tree.
export function setFlowRatesForReturn(context: CalculationEngine, record: ReturnRecord): number | null {
    const filled = fillPlantDefaults(record.plant, context.drawing);

    if (filled.plant.type !== PlantType.RETURN_SYSTEM) {
        throw new Error('Can only set return flow rates for return system');
    }

    const node2heatLoss = new Map<string, number>();
    const totalHeatLoss = getNodeHeatLossWATT(context, record.spTree, filled.outletTemperatureC!, node2heatLoss);

    const system = context.drawing.metadata.flowSystems.find((fs) => fs.uid === record.plant.outletSystemUid);
    if (!system) {
        throw new Error('Flow system not found');
    }

    const specificHeat = interpolateTable(context.catalog.fluids[system.fluid].specificHeatByTemperatureKJ_KGK, filled.outletTemperatureC!);

    if (totalHeatLoss === null || specificHeat === null) {
        // can't.
        return null;
    }

    const flowRateLS = totalHeatLoss/1000 / (specificHeat * (filled.outletTemperatureC! - filled.plant.returnMinimumTemperatureC!));

    return setFlowRatesNode(context, filled.plant, record.spTree, flowRateLS, node2heatLoss);
}

interface BalanceCheckResult {
    balanced: boolean;
    leafSeries: boolean;
}

function setWarnMissingBalancingValve(engine: CalculationEngine, node: SPNode<Edge<unknown, FlowEdge>>) {
    switch (node.type) {
        case "parallel":
            for (const n of node.siblings) {
                setWarnMissingBalancingValve(engine, n);
            }
            break;
        case "series":
            for (const n of node.children) {
                setWarnMissingBalancingValve(engine, n);
            }
            break;
        case "leaf":
            if (node.edgeConcrete.value.type === EdgeType.PIPE) {
                const pipe = engine.globalStore.get(node.edgeConcrete.value.uid) as Pipe;
                const pCalc = engine.globalStore.getOrCreateCalculation(pipe.entity);

                pCalc.warning = 'Missing Balancing Valve for Return';
                pCalc.rawReturnFlowRateLS = null; // Create dotted line
            }
            break;
        default:
            assertUnreachable(node);
    }
}

function warnMissingBalancingValvesRecursive(engine: CalculationEngine, node: SPNode<Edge<string, FlowEdge>>): BalanceCheckResult {
    switch (node.type) {
        case "parallel": {
            let balanced = true;
            let leafSeries = node.siblings.length === 1;

            for (const c of node.siblings) {
                const res = warnMissingBalancingValvesRecursive(engine, c);
                balanced = balanced && res.balanced;
                leafSeries = leafSeries && res.leafSeries;

                if (!res.balanced && (node.siblings.length > 1) && res.leafSeries) {
                    console.log('setting node balancing ' + JSON.stringify(res) + ' ' + node.siblings.length);
                    setWarnMissingBalancingValve(engine, c);
                }
            }

            return {balanced, leafSeries};
        }
        case "series": {
            let balanced = false;
            let leafSeries = true;
            for (const c of node.children) {
                const res = warnMissingBalancingValvesRecursive(engine, c);
                balanced = balanced || res.balanced;
                leafSeries = leafSeries && res.leafSeries;
            }
            return {balanced, leafSeries};
        }
        case "leaf":
            let connectedToBalancingValve = false;
            for (const uid of [node.edgeConcrete.from, node.edgeConcrete.to]) {
                const o = engine.globalStore.get(uid)!;
                if (o.entity.type === EntityType.DIRECTED_VALVE) {
                    if (o.entity.valve.type === ValveType.BALANCING) {
                        connectedToBalancingValve = true;
                    }
                }
            }

            if (connectedToBalancingValve) {
                return {
                    balanced: true,
                    leafSeries: true,
                };
            } else {
                return {
                    balanced: false,
                    leafSeries: true,
                };
            }
    }
    assertUnreachable(node);
}

export function warnMissingBalancingValves(engine: CalculationEngine, record: ReturnRecord): boolean {
    const res = warnMissingBalancingValvesRecursive(engine, record.spTree);
    console.log('result from return system: ' + JSON.stringify(res));
    if (!res.balanced && res.leafSeries) {
        setWarnMissingBalancingValve(engine, record.spTree);
    }
    return !res.balanced;
}

const RETURNS_RESIZE_MAX_ITER = 10;

export function processReturns(engine: CalculationEngine, returns: ReturnRecord[]) {
    for (const ret of returns) {
        // Set flow rates of returns, then resize the pipes if necessary.
        for (let i = 0; i < RETURNS_RESIZE_MAX_ITER; i++) {

            const diff = setFlowRatesForReturn(engine, ret);
            if (!diff) {
                break;
            }

            console.log('resized a return by ' + diff + ' iter ' + i);
        }

        // Identify segments that don't have balancing valves
        const hasMissing = warnMissingBalancingValves(engine, ret);
    }
}
