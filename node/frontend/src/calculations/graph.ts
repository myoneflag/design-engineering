import uuid from "uuid";
import _ from "lodash";
import assert from "assert";
import TinyQueue from "tinyqueue";
import stringify from "json-stable-stringify";
import { cloneSimple } from "../../../common/src/lib/utils";

enum SPEventType {
    REMOVE_NODE,
    REMOVE_EDGE,
}

type SPEvent<N> = {type: SPEventType.REMOVE_NODE, node: N}

export default class Graph<N, E> {
    adjacencyList: Map<string, Array<Edge<N, E>>> = new Map<string, Array<Edge<N, E>>>();
    edgeList: Map<string, Edge<N, E>> = new Map<string, Edge<N, E>>();
    reverseAdjacencyList: Map<string, Array<Edge<N, E>>> = new Map<string, Array<Edge<N, E>>>();
    id2Node: Map<string, N> = new Map<string, N>();

    sn: (node: N) => string;

    visited = 0;
    bridgeTimeTick = 0;

    constructor(sn: (node: N) => string) {
        this.sn = sn;
    }

    static fromSubgraph<N, E>(sub: SubGraph<N, E>, sn: (node: N) => string) {
        const result = new Graph<N, E>(sn);
        const [nodes, edges] = sub;
        for (const n of nodes) {
            result.addNode(n);
        }
        for (const e of edges) {
            result.addDirectedEdge(
                e.from,
                e.to,
                e.value,
                e.uid,
                e.isDirected
            );
        }
        return result;
    }

    addNode(node: N) {
        const nk = this.sn(node);
        if (!this.adjacencyList.has(nk)) {
            this.adjacencyList.set(nk, []);
            this.reverseAdjacencyList.set(nk, []);
            this.id2Node.set(nk, node);
        }
    }

    // Returns the map from edge => direction (sourceNode) if the graph is a series parallel graph.
    isSeriesParallel(source: N, sink: N): Map<string, N> | null {
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
        const sourceS = this.sn(source);
        const sinkS = this.sn(sink);

        console.log('checking series parallel for a graph with ' + this.edgeList.size + ' edges');

        // Here we store when a node compresses its two edges into one.
        const compressions: Array<[[string, string], string]> = [];

        for (const [eid, edge] of this.edgeList) {
            const fromS = this.sn(edge.from);
            const toS = this.sn(edge.to);
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

                        compressions.push([[ea, eb], eab]);

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

                    edgesRemoved ++;
                }
            } else {
                break;
            }
        }

        console.log('deleted ' + edgesRemoved + ' in the process');
        // check that the graph is degenerate
        if (edgesRemoved === this.edgeList.size - 1) {
            // Reconstruct the ordering of nodes by walking through the compressions backwards, building up a lookup
            // table of node orders.
            const orders = new Map<string, string>();
            orders.set(se(sourceS, sinkS), sourceS);
            console.log(se(sourceS, sinkS));

            for (const [[ea, eb], eab] of compressions.reverse()) {
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
            }

            // convert ordering lookup into map from E to src.
            const result = new Map<string, N>();

            for (const [eid, edge] of this.edgeList) {
                const es = se(this.sn(edge.from), this.sn(edge.to));
                result.set(eid, this.id2Node.get(orders.get(es)!)!);
            }

            return result;
        }

        return null;
    }

    addDirectedEdge(from: N, to: N, edgeValue: E, uid?: string, isDirected: boolean = true) {
        if (uid === undefined) {
            uid = uuid();
        }
        this.addNode(from);
        this.addNode(to);
        const val = this.adjacencyList.get(this.sn(from))!;
        const reverseVal = this.reverseAdjacencyList.get(this.sn(to))!;
        const forward = {
            from,
            to,
            value: edgeValue,
            isDirected,
            uid,
            isReversed: false
        };
        const backward = {
            from: to,
            to: from,
            value: edgeValue,
            isDirected,
            uid,
            isReversed: isDirected
        };
        val.push(forward);
        reverseVal.push(backward);
        this.edgeList.set(uid, forward);
    }

    addEdge(a: N, b: N, edgeValue: E, uid?: string) {
        if (uid === undefined) {
            uid = uuid();
        }
        this.addDirectedEdge(a, b, edgeValue, uid, false);
        this.addDirectedEdge(b, a, edgeValue, uid, false);
    }

    /**
     * For a tree, forest or dag, (and <= 1 root per tree), gets a full traversal order in DFS,
     * to get a nice node order for dynamic programming, without having to rewrite
     * the recursive graph traversal.
     *
     * @param roots Starting nodes for traversal.
     * @return Traversal order (from leaves to root, every node in order guarantees that all
     * children are visited.)
     */
    dagTraversal(roots: N[]): Array<Traversal<N, E>> {
        const traversals: Array<Traversal<N, E>> = new Array<Traversal<N, E>>();
        const seen: Set<string> = new Set<string>();
        for (const root of roots) {
            this.dagTraversalRecursive(root, null, seen, traversals);
        }
        return traversals;
    }

    // Only applies to undirected graphs.
    bridgeUtil(
        u: N,
        visited: Set<string>,
        disc: Map<string, number>,
        low: Map<string, number>,
        parent: Map<string, N>,
        bridges: Array<Edge<N, E>>
    ) {
        const uk = this.sn(u);
        visited.add(uk);
        this.bridgeTimeTick++;
        disc.set(uk, this.bridgeTimeTick);
        low.set(uk, this.bridgeTimeTick);

        for (const e of [...this.adjacencyList.get(uk)!, ...this.reverseAdjacencyList.get(uk)!]) {
            const v = e.to;
            const vk = this.sn(v);

            if (!visited.has(vk)) {
                parent.set(vk, u);
                this.bridgeUtil(v, visited, disc, low, parent, bridges);

                low.set(uk, Math.min(low.get(uk)!, low.get(vk)!));

                if (low.get(vk)! > disc.get(uk)!) {
                    bridges.push(e);
                }
            } else if (vk !== (parent.get(uk) ? this.sn(parent.get(uk)!) : "")) {
                low.set(uk, Math.min(low.get(uk)!, disc.get(vk)!));
            }
        }
    }

    findBridges(): Array<Edge<N, E>> {
        const visited = new Set<string>();
        const disc = new Map<string, number>();
        const low = new Map<string, number>();
        const parent = new Map<string, N>();

        const bridges: Array<Edge<N, E>> = [];

        for (const n of this.id2Node.values()) {
            if (!visited.has(this.sn(n))) {
                this.bridgeUtil(n, visited, disc, low, parent, bridges);
            }
        }

        return bridges;
    }

    findBridgeSeparatedComponents(): [Array<Edge<N, E>>, Array<SubGraph<N, E>>] {
        const bridges = this.findBridges();

        const components: Array<SubGraph<N, E>> = [];

        const visited = new Set<string>();
        const visitedEdges = new Set<string>();
        const bridgeEdges = new Set<string>();
        for (const b of bridges) {
            visitedEdges.add(b.uid);
            bridgeEdges.add(b.uid);
        }
        // find the resulting bridge-sea
        for (const e of this.edgeList.values()) {
            if (!visitedEdges.has(e.uid) || bridgeEdges.has(e.uid)) {
                const component: SubGraph<N, E> = [[], []];

                if (bridgeEdges.has(e.uid)) {
                    component[0].push(e.from);
                    component[0].push(e.to);
                    component[1].push(e);
                } else {
                    this.dfs(
                        e.to,
                        (node) => {
                            component[0].push(node);
                        },
                        undefined,
                        (edge) => {
                            component[1].push(edge);
                        },
                        undefined,
                        visited,
                        visitedEdges,
                        false,
                        false
                    );
                }

                components.push(component);
            }
        }

        return [bridges, components];
    }

    dagTraversalRecursive(
        curr: N,
        parentPath: Edge<N, E> | null,
        seen: Set<string>,
        traversals: Array<Traversal<N, E>>
    ) {
        const ck = this.sn(curr);
        if (seen.has(ck)) {
            return;
        }
        seen.add(ck);
        const traversal: Traversal<N, E> = {
            node: curr,
            parent: parentPath,
            children: []
        };

        const nei = this.adjacencyList.get(ck);
        if (nei) {
            for (const next of nei) {
                if (parentPath === null || parentPath.from !== next.to) {
                    traversal.children.push(next);
                }
                if (!seen.has(this.sn(next.to))) {
                    this.dagTraversalRecursive(next.to, next, seen, traversals);
                }
            }
        } else {
            throw new Error("Node missing from adjacency list " + curr);
        }

        traversals.push(traversal);
    }
    /**
     * Guaranteed that visitEdge is called exactly once for all reachable edges, and visitNode
     * is called once for each visitable node.
     */
    dfs(
        start: N,
        visitNode?: (node: N) => boolean | void,
        leaveNode?: (node: N) => void,
        visitEdge?: (edge: Edge<N, E>) => boolean | void,
        leaveEdge?: (edge: Edge<N, E>) => void,
        seen?: Set<string>,
        seenEdges?: Set<string>,
        directed: boolean = true,
        reversed: boolean = false
    ) {
        this.visited++;
        if (seenEdges === undefined) {
            seenEdges = new Set<string>();
        }
        if (seen === undefined) {
            seen = new Set<string>();
        }

        let curr = start;
        const stack: N[] = [start];

        while (stack.length) {
            curr = stack.pop()!;
            const currS = this.sn(curr);

            if (seen.has(currS)) {
                continue;
            }
            seen.add(currS);

            if (visitNode) {
                const should = visitNode(curr);
                if (should !== undefined && should) {
                    if (leaveNode) {
                        leaveNode(curr);
                    }
                    return;
                }
            }

            let nei;
            const forward = this.adjacencyList.get(currS);
            const backward = this.reverseAdjacencyList.get(currS);
            if (!forward || !backward) {
                throw new Error("cannot find node " + currS);
            }
            if (!reversed) {
                nei = forward;
            } else {
                nei = backward;
            }
            if (!directed) {
                nei = [...forward, ...backward];
            }

            for (const next of nei) {
                if (seenEdges!.has(next.uid)) {
                    continue;
                }
                seenEdges!.add(next.uid);

                if (visitEdge) {
                    const should = visitEdge(next);
                    if (should !== undefined && should) {
                        if (leaveEdge) {
                            leaveEdge(next);
                        }

                        continue;
                    }
                }
                if (!seen!.has(this.sn(next.to))) {
                    stack.push(next.to);
                }
                if (leaveEdge) {
                    leaveEdge(next);
                }
            }

            if (leaveNode) {
                leaveNode(curr);
            }
        }
    }

    /**
     * Guaranteed that visitEdge is called exactly once for all reachable edges, and visitNode
     * is called once for each visitable node.
     */
    dfsRecursive(
        start: N,
        visitNode?: (node: N) => boolean | void,
        leaveNode?: (node: N) => void,
        visitEdge?: (edge: Edge<N, E>) => boolean | void,
        leaveEdge?: (edge: Edge<N, E>) => void,
        seen?: Set<string>,
        seenEdges?: Set<string>,
        directed: boolean = true,
        reversed: boolean = false
    ) {
        this.visited++;
        if (seenEdges === undefined) {
            seenEdges = new Set<string>();
        }
        if (seen === undefined) {
            seen = new Set<string>();
        }

        const currS = this.sn(start);

        if (seen.has(currS)) {
            return;
        }
        seen.add(currS);

        if (visitNode) {
            const should = visitNode(start);
            if (should !== undefined && should) {
                if (leaveNode) {
                    leaveNode(start);
                }
                return;
            }
        }

        let nei;
        const forward = this.adjacencyList.get(currS);
        const backward = this.reverseAdjacencyList.get(currS);
        if (!forward || !backward) {
            throw new Error("cannot find node " + currS);
        }
        if (!reversed) {
            nei = forward;
        } else {
            nei = backward;
        }
        if (!directed) {
            nei = [...forward, ...backward];
        }

        for (const next of nei) {
            if (seenEdges!.has(next.uid)) {
                continue;
            }
            seenEdges!.add(next.uid);

            if (visitEdge) {
                const should = visitEdge(next);
                if (should !== undefined && should) {
                    if (leaveEdge) {
                        leaveEdge(next);
                    }

                    continue;
                }
            }
            if (!seen!.has(this.sn(next.to))) {
                this.dfsRecursive(
                    next.to,
                    visitNode,
                    leaveNode,
                    visitEdge,
                    leaveEdge,
                    seen,
                    seenEdges,
                    directed,
                    reversed
                );
            }
            if (leaveEdge) {
                leaveEdge(next);
            }
        }

        if (leaveNode) {
            leaveNode(start);
        }
    }

    dijkstra(
        curr: N,
        getDistance: (edge: Edge<N, E>, weight: number) => number,
        visitNode?: (dijk: DijkstraNode<N, E>) => boolean | void,
        visitEdge?: (edge: Edge<N, E>) => boolean | void,
        excludedNodes?: Set<N>,
        excludedEdges?: Set<string>,
        directed: boolean = true,
        reversed: boolean = false
    ) {
        if (excludedEdges === undefined) {
            excludedEdges = new Set<string>();
        }
        const exNodes = new Set<string>();
        if (excludedNodes !== undefined) {
            for (const n of excludedNodes) {
                exNodes.add(this.sn(n));
            }
        }

        const start: Array<DijkstraNode<N, E>> = [
            {
                weight: 0,
                node: curr
            }
        ];
        const q = new TinyQueue(start, (a, b) => {
            return a.weight - b.weight;
        });

        while (q.length) {
            const top = q.pop()!;

            if (visitEdge && top.parent && visitEdge(top.parent)) {
                continue;
            }

            if (exNodes.has(this.sn(top.node))) {
                continue;
            }

            if (visitNode && visitNode(top)) {
                continue;
            }

            exNodes.add(this.sn(top.node));

            const forward = cloneSimple(this.adjacencyList.get(this.sn(top.node)));
            const backward = cloneSimple(this.reverseAdjacencyList.get(this.sn(top.node)));
            if (!forward || !backward) {
                throw new Error("cannot find node " + this.sn(top.node));
            }

            let nei = reversed ? backward : forward;
            if (!directed) {
                nei = [...forward, ...backward];
            }

            for (const edge of nei) {
                if (excludedEdges!.has(edge.uid)) {
                    continue;
                }
                excludedEdges!.add(edge.uid);

                q.push({
                    weight: top.weight + getDistance(edge, top.weight),
                    node: edge.to,
                    parent: edge
                });
            }
        }
    }

    /**
     * Only makes sense for directed graphs.
     */
    connectedComponents(): Array<SubGraph<N, E>> {
        const components: Array<SubGraph<N, E>> = new Array<SubGraph<N, E>>();
        const seen: Set<string> = new Set<string>();

        this.adjacencyList.forEach((adj, node) => {
            components.push(this.getConnectedComponent(node, seen));
        });

        return components;
    }

    getConnectedComponent(node: N | string, seen?: Set<string>): SubGraph<N, E> {
        if (!seen) {
            seen = new Set<string>();
        }

        let nodeS: string;
        if (typeof node === 'string') {
            nodeS = node;
        } else {
            nodeS = this.sn(node);
        }

        const subGraph: SubGraph<N, E> = [[], []];
        if (!seen.has(nodeS)) {
            this.dfs(
                this.id2Node.get(nodeS)!,
                (n) => {
                    subGraph[0].push(n);
                },
                undefined,
                (e) => {
                    subGraph[1].push(e);
                },
                undefined,
                seen
            );
        }

        return subGraph;
    }

    anyPath(
        from: N,
        to: Set<N> | N[] | N,
        seenNodes?: Set<N>,
        seenEdges?: Set<string>,
        directed: boolean = true,
        reversed: boolean = false,
        edgeFilter?: (e: Edge<N, E>) => boolean
    ): Array<Edge<N, E>> | null {
        const cache: Array<Edge<N, E>> = [];
        let result: Array<Edge<N, E>> | null = null;
        let found = false;

        let seenNodesS: Set<string> | undefined;
        if (seenNodes) {
            seenNodesS = new Set<string>();
            for (const n of seenNodes) {
                seenNodesS!.add(this.sn(n));
            }
        }

        const toS = new Set<string>();
        if (to instanceof Set || to instanceof Array) {
            for (const n of to) {
                toS.add(this.sn(n));
            }
        } else {
            toS.add(this.sn(to));
        }

        this.dfsRecursive(
            from,
            (n) => {
                if (toS.has(this.sn(n))) {
                    found = true;
                    result = cloneSimple(cache);
                }
                return found;
            },
            undefined,
            (e) => {
                if (found) {
                    return true;
                }
                cache.push(e);
                if (edgeFilter) {
                    if (!edgeFilter(e)) {
                        return true;
                    }
                }
                return false;
            },
            (e) => {
                cache.pop();
            },
            seenNodesS,
            seenEdges,
            directed,
            reversed
        );

        return result;
    }

    shortestPath(
        from: N,
        to: Set<N> | N[] | N,
        getDistance: (edge: Edge<N, E>) => number,
        seenNodes?: Set<N>,
        seenEdges?: Set<string>,
        directed: boolean = true,
        reversed: boolean = false
    ): [Array<Edge<N, E>>, number] | null {
        const parentOf: Map<string, Edge<N, E>> = new Map<string, Edge<N, E>>();
        let found = false;

        const toS: Set<string> = new Set<string>();
        if (to instanceof Set) {
            for (const n of to) {
                toS.add(this.sn(n));
            }
        } else if (to instanceof Array) {
            for (const n of to) {
                toS.add(this.sn(n));
            }
        } else {
            toS.add(this.sn(to));
        }

        let destination: N | null = null;
        let dist = 0;

        this.dijkstra(
            from,
            getDistance,
            (dijk) => {
                if (dijk.parent) {
                    parentOf.set(this.sn(dijk.node), dijk.parent);
                }
                if (found) {
                    return true;
                }
                if (toS.has(this.sn(dijk.node))) {
                    destination = dijk.node;
                    found = true;
                    dist = dijk.weight;
                    return true;
                }
            },
            undefined,
            seenNodes,
            seenEdges,
            directed,
            reversed
        );

        if (destination === null) {
            return null;
        }

        const path: Array<Edge<N, E>> = [];

        let curr: N = destination;
        while (this.sn(curr) !== this.sn(from)) {
            const prev = parentOf.get(this.sn(curr))!;
            path.unshift(prev);
            curr = prev.from;
        }

        return [path, dist];
    }

    reachable(root: N): SubGraph<N, E> {
        const subGraph: SubGraph<N, E> = [[], []];
        this.dfs(
            root,
            (n) => {
                subGraph[0].push(n);
            },
            undefined,
            (e) => {
                subGraph[1].push(e);
            }
        );
        return subGraph;
    }

    edgeCycleCover(directed: boolean = true): Array<Array<Edge<N, E>>> {
        const result: Array<Array<Edge<N, E>>> = [];
        const seenEdges: Set<string> = new Set<string>();

        this.adjacencyList.forEach((v) => {
            for (const e of v) {
                const ret = this.getCycleCovering(seenEdges, e, directed, () => true);
            }
        });

        return result;
    }

    getCycleCovering(seenEdges: Set<string>, e: Edge<N, E>, directed: boolean, edgeFilter: (e: Edge<N, E>) => boolean) {
        if (seenEdges.has(e.uid)) {
            return null;
        }

        const newEdges = new Set<string>([e.uid]);
        const thisCycle = this.anyPath(e.to, e.from, undefined, newEdges, directed, false, edgeFilter);

        if (thisCycle) {
            thisCycle.push(e);
            for (const ee of thisCycle) {
                seenEdges.add(ee.uid);
            }
            return thisCycle;
        }
        return null;
    }

    sourceArcCover(sources: N[], accountedFor?: Set<string>): Array<Array<Edge<N, E>>> {
        const result: Array<Array<Edge<N, E>>> = [];
        const notAccountedFor = new Set<string>();
        // Find flows of bridges, which have definite flow. TODO: This can be reduced in algorithmic complexity.
        const done = new Set<string>();
        this.edgeList.forEach((v, k) => {
            if (accountedFor && accountedFor.has(k)) {
                return;
            }

            if (done.has(k)) {
                return;
            }

            // Find two sources that can reach both ends.
            const srcPath1 = this.anyPath(v.from, sources, undefined, new Set([k]), false);
            if (srcPath1) {
                const srcPath2 = this.anyPath(v.to, sources, undefined, new Set([k]), false);
                if (srcPath2) {
                    // Two sources should not be the same, because if so, they would be a loop instead.
                    assert(srcPath1.length > 0 || srcPath2.length > 0);
                    if (srcPath1.length > 0 && srcPath2.length > 0) {
                        assert(srcPath1[srcPath1.length - 1].to !== srcPath2[srcPath2.length - 1].to);
                    }

                    const path1Reversed = this.reversePath(srcPath1);
                    const fullPath: Array<Edge<N, E>> = [...path1Reversed, v, ...srcPath2];
                    result.push(fullPath);
                    for (const e of fullPath) {
                        done.add(e.uid);
                    }
                } else {
                    notAccountedFor.add(k);
                }
            } else {
                notAccountedFor.add(k);
            }
        });

        return result;
    }

    reversePath(path: Array<Edge<N, E>>) {
        return path.reverse().map(
            (e): Edge<N, E> => {
                return {
                    from: e.to,
                    isDirected: e.isDirected,
                    isReversed: e.isDirected ? !e.isReversed : false,
                    to: e.from,
                    uid: e.uid,
                    value: e.value
                };
            }
        );
    }


}

export type SubGraph<N, E> = [N[], Array<Edge<N, E>>];

export interface Edge<N, E> {
    from: N;
    to: N;
    value: E;
    isDirected: boolean;
    isReversed: boolean;
    uid: string;
}

export interface Traversal<N, E> {
    node: N;
    children: Array<Edge<N, E>>;
    parent: Edge<N, E> | null;
}

export interface DijkstraNode<N, E> {
    weight: number;
    node: N;
    parent?: Edge<N, E>;
}
