
// Returns the map from edge => direction (sourceNode) if the graph is a series parallel graph.
import Graph, { Edge } from "./graph";

interface SeriesJoin {
    type: 'series';
    oldEdges: [string, string];
    newEdge: string;
}

interface ParallelJoin {
    type: 'parallel';
    edge: string;
}

type Compression = SeriesJoin | ParallelJoin;

// every edge and every "group" has it's own parallel node, even if it just has one single element (single path).
export interface ParallelNode<E> {
    type: 'parallel';
    edge: string;
    siblings: Array<SeriesTreeNode<E> | LeafNode<E>>;
}

export interface SeriesTreeNode<E> {
    type: 'series';
    edge: string;
    children: [ParallelNode<E> | LeafNode<E>, ParallelNode<E> | LeafNode<E>];
}

export interface LeafNode<E> {
    type: 'leaf';
    edge: E;
}

export type SPTree<E> = ParallelNode<E>;

export function isSeriesParallel<N, E>(graph: Graph<N, E>, source: N, sink: N): [Map<string, N>, SPTree<Edge<N, E>>] | null {
    function se(a: string, b: string) {
        return JSON.stringify([a, b].sort());
    }
    function dse(e: string) {
        return JSON.parse(e);
    }

    // use the two operations to see if it's possible to reduce the graph to the degenerate N----N  (K2) graph.
    // 1. Combine 2 consecutive edges together.
    // 2. Combine 2 coinciding edges together.
    // Maintain an index to keep things O(n) or O(n lg n)
    const edgesByEndpoints = new Map<string, number>();
    const adjList = new Map<string, string[]>();
    const sourceS = graph.sn(source);
    const sinkS = graph.sn(sink);

    console.log('checking series parallel for a graph with ' + graph.edgeList.size + ' edges');

    // Here we store when a node compresses its two edges into one.
    const compressions: Compression[] = [];

    for (const [eid, edge] of graph.edgeList) {
        const fromS = graph.sn(edge.from);
        const toS = graph.sn(edge.to);
        console.log('caching edge ' + fromS + ' ' + toS);
        if (!adjList.has(fromS)) {
            adjList.set(fromS, []);
        }
        if (!adjList.has(toS)) {
            adjList.set(toS, []);
        }

        adjList.get(fromS)!.push(toS);
        adjList.get(toS)!.push(fromS);

        const a = se(fromS, toS);
        edgesByEndpoints.set(a, (edgesByEndpoints.get(a) || 0) + 1);
    }

    // maintain a queue of nodes to squash / edges to combine.
    const nodesQ: string[] = [];
    const edgesQ: string[] = [];

    for (const [node, l] of adjList) {
        if (l.length === 2 && node !== sourceS && node !== sinkS) {
            console.log('node ' + node  + ' is a candidate');
            nodesQ.push(node);
        }
    }

    for (const [conns, n] of edgesByEndpoints) {
        for (let i = 1; i < n; i++) {
            console.log('edge ' + conns  + ' is a candidate');
            edgesQ.push(conns);
        }
    }

    let edgesRemoved = 0;
    while (true) {

        if (nodesQ.length) {
            const n = nodesQ.pop()!;
            if (adjList.has(n)) {
                if (adjList.get(n)!.length === 2 && n !== sourceS && n !== sinkS) {
                    const [a, b] = adjList.get(n)!;
                    console.log(' deleting node ' + n + ' conn to ' + a  + ' ' + b);
                    // remove the two edges adjacent
                    adjList.get(a)!.splice(adjList.get(a)!.indexOf(n), 1, b);
                    adjList.get(b)!.splice(adjList.get(b)!.indexOf(n), 1, a);
                    const ea = se(a, n);
                    const eb = se(b, n);
                    const eab = se(a, b);
                    edgesByEndpoints.set(ea, edgesByEndpoints.get(ea)! - 1);
                    edgesByEndpoints.set(eb, edgesByEndpoints.get(eb)! - 1);
                    edgesByEndpoints.set(eab, (edgesByEndpoints.get(eab) || 0) + 1);
                    if (edgesByEndpoints.get(eab)! > 1) {
                        console.log('edge ' + eab + ' is now a candidate');
                        edgesQ.push(eab);
                    }

                    compressions.push({
                        type: 'series',
                        oldEdges: [ea, eb],
                        newEdge: eab,
                    });

                    edgesRemoved ++;
                }
            }
        } else if (edgesQ.length) {
            const e = edgesQ.pop()!;
            if (edgesByEndpoints.has(e) && edgesByEndpoints.get(e)! > 1) {
                // remove coinciding edge
                const [a, b] = dse(e);
                console.log('deleting edge ' + a + ' ' + b);

                adjList.get(a)!.splice(adjList.get(a)!.indexOf(b), 1);
                adjList.get(b)!.splice(adjList.get(b)!.indexOf(a), 1);
                if (adjList.get(a)!.length === 2 && a !== sourceS && a !== sinkS) {
                    nodesQ.push(a);
                }
                if (adjList.get(b)!.length === 2 && b !== sourceS && b !== sinkS) {
                    nodesQ.push(b);
                }

                edgesByEndpoints.set(e, edgesByEndpoints.get(e)! - 1);

                compressions.push({
                    type: 'parallel',
                    edge: e,
                });

                edgesRemoved ++;
            }
        } else {
            break;
        }
    }


    console.log('deleted ' + edgesRemoved + ' in the process');

    // check that the graph is degenerate
    if (edgesRemoved === graph.edgeList.size - 1) {

        // now reconstructthhhththh the tree
        const spTree: SPTree<Edge<N, E>> = {
            type: 'parallel',
            edge: se(sourceS, sinkS),
            siblings: [],
        };
        const edge2SPNode = new Map<string, ParallelNode<Edge<N, E>>>();
        edge2SPNode.set(se(sourceS, sinkS), spTree);


        // Reconstruct the ordering of nodes by walking through the compressions backwards, building up a lookup
        // table of node orders.
        const orders = new Map<string, string>();
        orders.set(se(sourceS, sinkS), sourceS);
        console.log(se(sourceS, sinkS));

        for (const compression of compressions.reverse()) {
            switch (compression.type) {
                case "series": {
                    const [ea, eb] = compression.oldEdges;
                    const eab = compression.newEdge;
                    console.log('deducing, ' + ea + ' ' + eb + ' ' + eab);
                    const src = orders.get(eab)!;
                    const [aba, abb] = dse(eab);
                    const dst = aba === src ? abb : aba;

                    if (!src) {
                        throw new Error("couldn't reconstruct node orderings");
                    }

                    for (const e of [ea, eb]) {
                        const [a, b] = dse(e);

                        if (a === src) {
                            orders.set(e, a);
                        } else if (a === dst) {
                            orders.set(e, b);
                        } else if (b === src) {
                            orders.set(e, b);
                        } else if (b === dst) {
                            orders.set(e, a);
                        } else {
                            throw new Error("couldn't reconstruct node orderings, invalid state.");
                        }
                    }


                    const spe = edge2SPNode.get(eab);
                    if (!spe) {
                        throw new Error('Unexpected state - expected edge not found in tree representation');
                    }
                    const na: ParallelNode<Edge<N, E>> =  {
                        type: "parallel",
                        edge: ea,
                        siblings: [],
                    };
                    const nb: ParallelNode<Edge<N, E>> = {
                        type: "parallel",
                        edge: eb,
                        siblings: [],
                    };

                    edge2SPNode.set(ea, na);
                    edge2SPNode.set(eb, nb);

                    spe.siblings.push({
                        type: "series",
                        edge: eab,
                        children: [na, nb],
                    });
                    break;
                }
                case "parallel":
                    // Oops actually nop, oopsies doopsies unnecessary refactoroosies
                    break;
            }
        }

        // convert ordering lookup into map from E to src.
        // also, insert leaf nodes for the tree
        const result = new Map<string, N>();

        for (const [eid, edge] of graph.edgeList) {
            const es = se(graph.sn(edge.from), graph.sn(edge.to));
            result.set(eid, graph.id2Node.get(orders.get(es)!)!);

            const spn = edge2SPNode.get(es);
            if (!spn) {
                throw new Error('expected edge missing in the reconstructed tree');
            }
            spn.siblings.push({
                type: 'leaf',
                edge: edge,
            });
        }


        return [result, spTree];
    }

    return null;
}
