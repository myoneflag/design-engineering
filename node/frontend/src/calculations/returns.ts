import { EntityType } from "../../../common/src/api/document/entities/types";
import { PlantType } from "../../../common/src/api/document/entities/plants/plant-types";
import Graph from "./graph";
import { assertUnreachable } from "../../../common/src/api/config";
import PipeEntity from "../../../common/src/api/document/entities/pipe-entity";
import { Configuration } from "../store/document/calculations/pipe-calculation";
import CalculationEngine, { EdgeType, FlowEdge } from "./calculation-engine";

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
                // we are not good.
                console.log('our graph is not series parallel');
            }
        }
    }
}
