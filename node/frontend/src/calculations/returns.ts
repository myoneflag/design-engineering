import { EntityType } from "../../../common/src/api/document/entities/types";
import { PlantType, ReturnSystemPlant } from "../../../common/src/api/document/entities/plants/plant-types";
import Graph, { Edge } from "./graph";
import { assertUnreachable } from "../../../common/src/api/config";
import PipeEntity, { fillPipeDefaultFields } from "../../../common/src/api/document/entities/pipe-entity";
import { Configuration, NoFlowAvailableReason } from "../store/document/calculations/pipe-calculation";
import CalculationEngine, { EdgeType, FlowEdge, FlowNode } from "./calculation-engine";
import { CalculationContext, PressurePushMode } from "./types";
import Pipe from "../htmlcanvas/objects/pipe";
import {
    AIR_PROPERTIES,
    SURFACE_EMISSIVITY,
    THERMAL_CONDUCTIVITY
} from "../../../common/src/api/constants/air-properties";
import { evaluatePolynomial } from "../../../common/src/lib/polynomials";
import { isSeriesParallel, SPNode, SPTree } from "./series-parallel";
import PlantEntity, { fillPlantDefaults } from "../../../common/src/api/document/entities/plants/plant-entity";
import { interpolateTable } from "../../../common/src/lib/utils";
import { ValveType } from "../../../common/src/api/document/entities/directed-valves/valve-types";
import DirectedValve from "../htmlcanvas/objects/directed-valve";
import { warn } from "vue-class-component/lib/util";

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

    if (!pCalc.realNominalPipeDiameterMM || !pCalc.realInternalDiameterMM || !pCalc.realOutsideDiameterMM) {
        return null;
    }

    const flowSystem = context.doc.drawing.metadata.flowSystems.find((fs) => fs.uid === pipe.entity.systemUid)!;

    const DELTA_INIT = 1;
    const ambientTemperatureC = context.doc.drawing.metadata.calculationParams.roomTemperatureC;
    let surfaceTempC = ambientTemperatureC + DELTA_INIT;
    let interfaceTempC = tempC - DELTA_INIT;


    const insulationThicknessMM = flowSystem.insulationThicknessMM;
    const bareOutsideDiameter = pCalc.realOutsideDiameterMM;
    const totalOutsideDiameter = bareOutsideDiameter + insulationThicknessMM * 2;

    let oldHeatLoss = -Infinity;

    let iters = 0;
    while (true) {
        iters += 1;
        if (iters > 30) return null;
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
        const radiationW_M2K            = 0.00000005670373 * SURFACE_EMISSIVITY[flowSystem.insulationJacket] * ((surfaceTempC + 273.15) ** 4 - (ambientTemperatureC + 273.15) ** 4) / ((surfaceTempC + 273.15) - (ambientTemperatureC + 273.15));


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


        if (true) {
            /*
            console.log(filled.material);
            console.log(JSON.stringify(THERMAL_CONDUCTIVITY[filled.material!]));
            console.log(typeof tempC);
            console.log(tempC + 273.15);
            console.log('special guys:');
            console.log('averageFilmTemperatureC: ' + averageFilmTemperatureC);
            console.log('averageFilmTemperatureK: ' + averageFilmTemperatureK);
            console.log('thermalConductivityW_MK: ' + thermalConductivityW_MK);
            console.log('viscosity_N_SM2: ' + viscosity_N_SM2);
            console.log('prandtlNumber: ' + prandtlNumber);
            console.log('expansionCoefficient_1_K: ' + expansionCoefficient_1_K);
            console.log('airDensity_KG_M3: ' + airDensity_KG_M3);
            console.log('kinematicViscosityM2_S: ' + kinematicViscosityM2_S);
            console.log('specificHeatKJ_KGK: ' + specificHeatKJ_KGK);
            console.log('alphaM2_S: ' + alphaM2_S);
            console.log('reynoldsNumber: ' + reynoldsNumber);
            console.log('rayleighNumber: ' + rayleighNumber);
                console.log('radiationW_M2K: ' + radiationW_M2K);
            console.log('nu_forced: ' + nu_forced);
            console.log('forcedConvectionW_M2K: ' + forcedConvectionW_M2K);
            console.log('nu_free: ' + nu_free);
            console.log('freeConvectionW_M2K: ' + freeConvectionW_M2K);
            console.log('nu_combined: ' + nu_combined);
            console.log('combinedConvectionW_M2K: ' + combinedConvectionW_M2K);
            console.log('overallAirSideHtcW_M2K: ' + overallAirSideHtcW_M2K);
                console.log('pipeThermalConductivityW_MK: ' + pipeThermalConductivityW_MK);
            console.log('pipeWallResistanceM2K_W: ' + pipeWallResistanceM2K_W);
                console.log('averageInsulationTempK: ' + averageInsulationTempK);
            console.log('insulationThermalConductivityW_MK: ' + insulationThermalConductivityW_MK);
            console.log('insulationResistanceM2K_W: ' + insulationResistanceM2K_W);
                console.log('overallResistanceM2_KW: ' + overallResistanceM2_KW);
            console.log('heatFlowW_M2: ' + heatFlowW_M2);
            console.log('interfaceTempC: ' + interfaceTempC);
            console.log('surfaceTempC: ' + surfaceTempC);
            console.log('heatLossPerUnitLengthW_M: ' + heatLossPerUnitLengthW_M);*/

        }

        if (Math.abs(oldHeatLoss - heatLossPerUnitLengthW_M) < MAX_ITER_CHANGE && iters > 5) {
            return heatLossPerUnitLengthW_M;
        }
        oldHeatLoss = heatLossPerUnitLengthW_M;
    }
}


export function getHeatLossOfPipeWATT(context: CalculationContext, pipe: Pipe, tempC: number) {
    const filled = fillPipeDefaultFields(context.drawing, pipe.computedLengthM, pipe.entity);
    const moment = getHeatLossOfPipeMomentWATT_M(context, pipe, tempC, Number(context.drawing.metadata.calculationParams.windSpeedForHeatLossMS));
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

    if (isNaN(currFlowRate)) {
        throw new Error('flow rate is NaN');
    }

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

                    let propHeatLoss = 0;
                    if (totalHeatLossWATT) {
                        propHeatLoss = currFlowRate * thisHeatLossWATT / totalHeatLossWATT;
                    }

                    const tmp = setFlowRatesNode(context, filledReturn, n, propHeatLoss, heatLossCache);
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
                    pCalc.totalPeakFlowRateLS = Math.max(peakFlowRate, pCalc.rawReturnFlowRateLS);
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

    const pCalc = context.globalStore.getOrCreateCalculation(record.plant);
    pCalc.heatLossKW = totalHeatLoss === null ? null : totalHeatLoss / 1000;

    const system = context.drawing.metadata.flowSystems.find((fs) => fs.uid === record.plant.outletSystemUid);
    if (!system) {
        throw new Error('Flow system not found');
    }

    const specificHeat = interpolateTable(context.catalog.fluids[system.fluid].specificHeatByTemperatureKJ_KGK, filled.outletTemperatureC!);

    if (totalHeatLoss === null || specificHeat === null) {
        // can't.
        return null;
    }

    const flowRateLS = totalHeatLoss / 1000 / (specificHeat * (filled.outletTemperatureC! - filled.plant.returnMinimumTemperatureC!));
    pCalc.circulationFlowRateLS = flowRateLS;

    return setFlowRatesNode(context, filled.plant, record.spTree, flowRateLS, node2heatLoss);
}

interface BalanceCheckResult {
    balanced: boolean;
    warning: string | null;
    leafSeries: boolean;
}

function setNodeWarningRecursive(engine: CalculationEngine, node: SPNode<Edge<unknown, FlowEdge>>, warning: string) {
    switch (node.type) {
        case "parallel":
            for (const n of node.siblings) {
                setNodeWarningRecursive(engine, n, warning);
            }
            break;
        case "series":
            for (const n of node.children) {
                setNodeWarningRecursive(engine, n, warning);
            }
            break;
        case "leaf":
            if (node.edgeConcrete.value.type === EdgeType.PIPE) {
                const pipe = engine.globalStore.get(node.edgeConcrete.value.uid) as Pipe;
                const pCalc = engine.globalStore.getOrCreateCalculation(pipe.entity);

                pCalc.warning = warning;
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
            let warning: string | null = null;
            let leafSeries = node.siblings.length === 1;

            for (const c of node.siblings) {
                const res = warnMissingBalancingValvesRecursive(engine, c);
                balanced = balanced && res.balanced;
                leafSeries = leafSeries && res.leafSeries;
                warning = warning || res.warning;

                if (!res.balanced && (node.siblings.length > 1) && res.leafSeries) {
                    setNodeWarningRecursive(engine, c, 'Missing Balancing Valve for Return');
                } else if (res.warning && (node.siblings.length > 1) && res.leafSeries) {
                    setNodeWarningRecursive(engine, c, res.warning);
                }

            }

            // don't propagate warnings beyond their loop
            return { balanced, leafSeries, warning: (node.siblings.length > 1 ? null : warning)};
        }
        case "series": {
            let balanced = false;
            let leafSeries = true;
            let warning: string | null = null;
            for (const c of node.children) {
                const res = warnMissingBalancingValvesRecursive(engine, c);
                balanced = balanced || res.balanced;
                leafSeries = leafSeries && res.leafSeries;
                warning = warning || res.warning;
            }
            return { balanced, leafSeries, warning };
        }
        case "leaf":
            let connectedToBalancingValve = false;
            let warning: string | null = null;
            const po = engine.globalStore.get(node.edgeConcrete.value.uid) as Pipe;
            const pCalc = engine.globalStore.getOrCreateCalculation(po.entity);

            if (!pCalc.flowFrom) {
                throw new Error('expected flow from');
            }

            let uid =  pCalc.flowFrom;
            const o = engine.globalStore.get(uid)!;
            if (o.entity.type === EntityType.DIRECTED_VALVE) {
                switch (o.entity.valve.type) {
                    case ValveType.ISOLATION_VALVE:
                    case ValveType.WATER_METER:
                    case ValveType.STRAINER:
                        // whatevs, not directed
                        break;
                    case ValveType.CHECK_VALVE:
                    case ValveType.RPZD_SINGLE:
                    case ValveType.RPZD_DOUBLE_SHARED:
                    case ValveType.RPZD_DOUBLE_ISOLATED:
                        if (node.edgeConcrete.value.uid === o.entity.sourceUid) {
                            const calc = engine.globalStore.getOrCreateCalculation(o.entity);
                            calc.warning = 'Valve in wrong direction';
                            warning = calc.warning;
                        }
                        break;
                    case ValveType.PRV_SINGLE:
                    case ValveType.PRV_DOUBLE:
                    case ValveType.PRV_TRIPLE:
                        const calc = engine.globalStore.getOrCreateCalculation(o.entity);
                        calc.warning = 'PRVs are forbidden here';
                        warning = calc.warning;
                        break;
                    case ValveType.BALANCING:
                        connectedToBalancingValve = true;
                        break;
                    default:
                        assertUnreachable(o.entity.valve);
                }
                if (o.entity.valve.type === ValveType.BALANCING) {
                }
            }

            return {
                warning,
                balanced: connectedToBalancingValve,
                leafSeries: true,
            };
    }
    assertUnreachable(node);
}

export function warnMissingBalancingValves(engine: CalculationEngine, record: ReturnRecord): boolean {
    const res = warnMissingBalancingValvesRecursive(engine, record.spTree);
    if (!res.balanced && res.leafSeries) {
        setNodeWarningRecursive(engine, record.spTree, 'Missing Balancing Valve for Return');
    }
    return !res.balanced;
}

const RETURNS_RESIZE_MAX_ITER = 10;

export function returnFlowRates(engine: CalculationEngine, returns: ReturnRecord[]) {
    for (const ret of returns) {
        // Set flow rates of returns, then resize the pipes if necessary.
        for (let i = 0; i < RETURNS_RESIZE_MAX_ITER; i++) {

            const diff = setFlowRatesForReturn(engine, ret);
            if (!diff) {
                break;
            }
        }

        // Identify segments that don't have balancing valves
        const hasMissing = warnMissingBalancingValves(engine, ret);
    }
}


interface BalanceResult {
    valveUid: string | null;
    leafSeries: boolean;
    minPressure: number | null;
    maxPressure: number | null;
}


export function findValveImbalances(
    engine: CalculationEngine,
    nodePressureKPA: Map<string, number | null>,
    valveUids: Map<string, string | null>,
    pressureDropKPA: Map<string, number | null>,
    isLeafSeries: Map<string, boolean>,
    node: SPNode<Edge<string, FlowEdge>>,
): BalanceResult {
    let valveUid: string | null = null;
    let leafSeries = true;
    let minPressure: number | null = Infinity;
    let maxPressure: number | null = -Infinity;

    switch (node.type) {
        case "parallel": {
            leafSeries = node.siblings.length === 1;

            for (const c of node.siblings) {
                const res = findValveImbalances(engine, nodePressureKPA, valveUids, pressureDropKPA, isLeafSeries, c);
                leafSeries = leafSeries && res.leafSeries;
                if (res.minPressure === null || minPressure === null) {
                    minPressure = null;
                } else {
                    minPressure = Math.min(minPressure, res.minPressure);
                }

                if (res.maxPressure === null || maxPressure === null) {
                    maxPressure = null;
                } else {
                    maxPressure = Math.max(maxPressure, res.maxPressure);
                }
            }

            break;
        }
        case "series": {
            for (const c of node.children) {
                const res = findValveImbalances(engine, nodePressureKPA, valveUids, pressureDropKPA, isLeafSeries, c);
                valveUid = valveUid || res.valveUid;
                leafSeries = leafSeries && res.leafSeries;
                if (res.minPressure === null || minPressure === null) {
                    minPressure = null;
                } else {
                    minPressure = Math.min(minPressure, res.minPressure);
                }

                if (res.maxPressure === null || maxPressure === null) {
                    maxPressure = null;
                } else {
                    maxPressure = Math.max(maxPressure, res.maxPressure);
                }
            }
            break;
        }
        case "leaf": {
            valveUid = null;
            leafSeries = true;

            const pressures = [];

            for (const uid of [node.edgeConcrete.from, node.edgeConcrete.to]) {
                const p = nodePressureKPA.get(engine.serializeNode({connectable: uid, connection: node.edgeConcrete.value.uid}));
                pressures.push(p === undefined ? null : p);
            }


            // only account for a valve once
            if (node.edgeConcrete.value.type === EdgeType.PIPE) {
                const flowFrom = engine.globalStore.getOrCreateCalculation((engine.globalStore.get(node.edgeConcrete.value.uid) as Pipe).entity).flowFrom;

                if (!flowFrom) {
                    // cannot balance deez valves since we can't agree on a canonical direction.
                } else {

                    const o = engine.globalStore.get(flowFrom)!;
                    if (o.entity.type === EntityType.DIRECTED_VALVE) {
                        if (o.entity.valve.type === ValveType.BALANCING) {
                            valveUid = o.entity.uid;
                        }
                    }

                }

            }
            // prefer null over numbers, to ensure that if we make a min or max exist, it is because every dependent
            // value was defined.
            minPressure = null;
            maxPressure = null;
            if (pressures[0] !== null && pressures[1] !== null) {
                minPressure = Math.min(pressures[0], pressures[1]);
                maxPressure = Math.max(pressures[0], pressures[1]);
            }
            break;
        }
        default:
            assertUnreachable(node);
    }
    if (maxPressure !== null && minPressure !== null) {
        pressureDropKPA.set(node.edge, maxPressure - minPressure);
    } else {
        pressureDropKPA.set(node.edge, null);
    }

    isLeafSeries.set(node.edge, leafSeries);
    valveUids.set(node.edge, valveUid);

    return {valveUid, leafSeries, maxPressure, minPressure};
}

// Returns true if the pressure drop was consumed, for the purposes of only having one segment in a series consume it.
function setValveBalances(engine: CalculationEngine,
                          leafValveUid: Map<string, string | null>,
                          pressureDropKPA: Map<string, number | null>,
                          isLeafSeries: Map<string, boolean>,
                          node: SPNode<Edge<string, FlowEdge>>,
                          pressureDropDifferentialKPA: number,
): boolean {
    switch (node.type) {
        case "parallel": {
            let consumed = false;
            let highestPressureDrop: number | null = -Infinity;
            for (const c of node.siblings) {
                const val = pressureDropKPA.get(c.edge);
                if (highestPressureDrop === null || val === null || val === undefined) {
                    highestPressureDrop = null;
                } else {
                    highestPressureDrop = Math.max(highestPressureDrop, val);
                }
            }

            if (highestPressureDrop !== null) {
                for (const c of node.siblings) {
                    const val = pressureDropKPA.get(c.edge)!;
                    const seen = setValveBalances(engine, leafValveUid, pressureDropKPA, isLeafSeries, c,pressureDropDifferentialKPA + highestPressureDrop - val);
                    if (seen) {
                        consumed = true;
                    }
                }
            }

            return consumed; // assumes that the network was valid in the first place
        }
        case "series": {
            let consumed = false;

            for (const c of node.children) {
                consumed = setValveBalances(engine, leafValveUid, pressureDropKPA, isLeafSeries, c, pressureDropDifferentialKPA) || consumed;
                if (consumed) {
                    pressureDropDifferentialKPA = 0;
                }
            }
            return consumed;
        }
        case "leaf":

            if (leafValveUid.get(node.edge)) {
                // this thang has a valve.
                const o = engine.globalStore.get(leafValveUid.get(node.edge)!) as DirectedValve;
                if (o.entity.valve.type !== ValveType.BALANCING) {
                    throw new Error('Expected a balancing valve');
                }

                const vCalc = engine.globalStore.getOrCreateCalculation(o.entity);
                // pressureDropDifferentialKPA is the missing pressure in this leg ASSUMING that the balancing valves were
                // ALREADY at min_ba... so that's why we add MINIMUM_... here.
                vCalc.pressureDropKPA = pressureDropDifferentialKPA + MINIMUM_BALANCING_VALVE_PRESSURE_DROP_KPA;
                // hl = (kValue * velocityMS ** 2)) / (2 * ga);
                // hl * 2 ga / vms**2 = kValue



                const bar = vCalc.pressureDropKPA / 100;
                const conns = engine.globalStore.getConnections(o.uid);
                const pCalc = engine.globalStore.getOrCreateCalculation((engine.globalStore.get(conns[0]) as Pipe).entity);
                const flowLS = pCalc.totalPeakFlowRateLS!;
                const flowM3H = flowLS / 1000 * 60 * 60;

                vCalc.kvValue = flowM3H * Math.sqrt(1 / bar);
                return true;
            } else {
                // Nada.
                return false;
            }
    }
    assertUnreachable(node);
}

export function returnBalanceValves(engine: CalculationEngine, returns: ReturnRecord[]) {
    for (const ret of returns) {
        // calculate pressures through the return based on return rates only.
        const flowOut: FlowNode = {
            connectable: ret.plant.outletUid,
            connection: ret.plant.uid,
        };
        const pressureAtOutlet = 0; // for purposes of just determining pressure differences, it's OK to start with an unknown initial pressure.
        const pressuresInStaticReturnKPA = new Map<string, number | null>();

        engine.pushPressureThroughNetwork(flowOut, pressureAtOutlet, new Map<string, number|null>(), pressuresInStaticReturnKPA, PressurePushMode.CirculationFlowOnly);

        const pressureDropKPA = new Map<string, number>();
        const isLeafSeries = new Map<string, boolean>();
        const valveUids = new Map<string, string | null>();

        findValveImbalances(engine, pressuresInStaticReturnKPA, valveUids, pressureDropKPA, isLeafSeries, ret.spTree);
        setValveBalances(engine, valveUids, pressureDropKPA, isLeafSeries, ret.spTree, 0);

        const pCalc = engine.globalStore.getOrCreateCalculation(ret.plant);
        pCalc.circulationPressureLoss = pressureDropKPA.get(ret.spTree.edge)!;
    }
}

export const MINIMUM_BALANCING_VALVE_PRESSURE_DROP_KPA = 10;
