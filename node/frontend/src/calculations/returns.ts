import { EntityType } from "../../../common/src/api/document/entities/types";
import { PlantType } from "../../../common/src/api/document/entities/plants/plant-types";
import Graph from "./graph";
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
import Context = Mocha.Context;

export function identifyReturns(engine: CalculationEngine) {
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
            console.log('connected component has ' + JSON.stringify(component));

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

            const orderLookup = simpleGraph.isSeriesParallel(o.entity.outletUid, o.entity.plant.returnUid);
            if (orderLookup) {
                console.log('orderLookup:');
                console.log(JSON.stringify(Array.from(orderLookup.entries())));

                // we are good.
                console.log('we are returning with a series parallel graph. Therefore, it is a valid return.');
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
                console.log('our graph is not series parallel');
            }
        }
    }
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

    while (true) {
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

        const nu_free                   = (0.6 + 0.387 * radiationW_M2K ** (1/6) / (1 + (0.559 / prandtlNumber) ** (9 / 16)) ** (8 / 27)) ** 2;
        const freeConvectionW_M2K       = nu_free * thermalConductivityW_MK / (totalOutsideDiameter / 1000);

        const nu_combined               = (nu_forced ** 4 + nu_free ** 4) ** (1/4);
        const combinedConvectionW_M2K   = nu_combined * thermalConductivityW_MK / (totalOutsideDiameter / 1000);
        const overallAirSideHtcW_M2K    = combinedConvectionW_M2K + radiationW_M2K;

        // Pipe Resistance
        const pipeThermalConductivityW_MK = evaluatePolynomial(THERMAL_CONDUCTIVITY[filled.material!], tempC + 273.15);
        const pipeWallResistanceM2K_W   = (totalOutsideDiameter / 1000) * Math.log(bareOutsideDiameter / pCalc.realInternalDiameterMM);

        // Insulation Resistance
        const averageInsulationTempK    = (surfaceTempC + interfaceTempC) / 2 + 273.15;
        const insulationThermalConductivityW_MK = evaluatePolynomial(THERMAL_CONDUCTIVITY[flowSystem.insulationMaterial], averageInsulationTempK);
        const insulationResistanceM2K_W = (totalOutsideDiameter / 1000) * Math.log(totalOutsideDiameter / bareOutsideDiameter) / (2 * insulationThermalConductivityW_MK);

        // Overall Resistance
        const overallResistanceM2_KW    = (insulationResistanceM2K_W + pipeWallResistanceM2K_W + 1) / overallAirSideHtcW_M2K;
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
