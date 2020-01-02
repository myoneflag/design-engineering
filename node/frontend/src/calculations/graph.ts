import uuid from "uuid";
import _ from "lodash";
import assert from "assert";
import TinyQueue from "tinyqueue";
import { cloneSimple } from "../../src/lib/utils";
import stringify from "json-stable-stringify";

export default class Graph<N, E> {
    adjacencyList: Map<string, Array<Edge<N, E>>> = new Map<string, Array<Edge<N, E>>>();
    edgeList: Map<string, Edge<N, E>> = new Map<string, Edge<N, E>>();
    reverseAdjacencyList: Map<string, Array<Edge<N, E>>> = new Map<string, Array<Edge<N, E>>>();
    id2Node: Map<string, N> = new Map<string, N>();

    sn: (node: N) => string;

    visited = 0;

    constructor(sn: (node: N) => string) {
        this.sn = sn;
    }

    addNode(node: N) {
        if (!this.adjacencyList.has(this.sn(node))) {
            this.adjacencyList.set(this.sn(node), []);
            this.reverseAdjacencyList.set(this.sn(node), []);
            this.id2Node.set(this.sn(node), node);
        }
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
        roots.forEach((root) => {
            this.dagTraversalRecursive(root, null, seen, traversals);
        });
        return traversals;
    }

    dagTraversalRecursive(
        curr: N,
        parentPath: Edge<N, E> | null,
        seen: Set<string>,
        traversals: Array<Traversal<N, E>>
    ) {
        if (seen.has(this.sn(curr))) {
            return;
        }
        seen.add(this.sn(curr));
        const traversal: Traversal<N, E> = {
            node: curr,
            parent: parentPath,
            children: []
        };

        const nei = this.adjacencyList.get(this.sn(curr));
        if (nei) {
            nei.forEach((next) => {
                if (parentPath === null || parentPath.from !== next.to) {
                    traversal.children.push(next);
                }
                if (!seen.has(this.sn(next.to))) {
                    this.dagTraversalRecursive(next.to, next, seen, traversals);
                }
            });
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

            nei.forEach((next) => {
                if (seenEdges!.has(next.uid)) {
                    return;
                }
                seenEdges!.add(next.uid);

                if (visitEdge) {
                    const should = visitEdge(next);
                    if (should !== undefined && should) {
                        if (leaveEdge) {
                            leaveEdge(next);
                        }

                        return;
                    }
                }
                if (!seen!.has(this.sn(next.to))) {
                    stack.push(next.to);
                }
                if (leaveEdge) {
                    leaveEdge(next);
                }
            });

            if (leaveNode) {
                leaveNode(curr);
            }
        }
    }

    dijkstra(
        curr: N,
        getDistance: (edge: Edge<N, E>) => number,
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
            excludedNodes.forEach((n) => exNodes.add(this.sn(n)));
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

            nei.forEach((edge) => {
                if (excludedEdges!.has(edge.uid)) {
                    return;
                }
                excludedEdges!.add(edge.uid);

                q.push({
                    weight: top.weight + getDistance(edge),
                    node: edge.to,
                    parent: edge
                });
            });
        }
    }

    /**
     * Only makes sense for directed graphs.
     */
    connectedComponents(): Array<SubGraph<N, E>> {
        const components: Array<SubGraph<N, E>> = new Array<SubGraph<N, E>>();
        const seen: Set<string> = new Set<string>();

        this.adjacencyList.forEach((adj, node) => {
            const subGraph: SubGraph<N, E> = [[], []];
            if (!seen.has(node)) {
                this.dfs(
                    this.id2Node.get(node)!,
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
                components.push(subGraph);
            }
        });

        return components;
    }

    anyPath(
        from: N,
        to: Set<N> | N[] | N,
        seenNodes?: Set<N>,
        seenEdges?: Set<string>,
        directed: boolean = true,
        reversed: boolean = false
    ): Array<Edge<N, E>> | null {
        const cache: Array<Edge<N, E>> = [];
        let result: Array<Edge<N, E>> | null = null;
        let found = false;

        let seenNodesS: Set<string> | undefined;
        if (seenNodes) {
            seenNodesS = new Set<string>();
            seenNodes.forEach((n) => seenNodesS!.add(this.sn(n)));
        }

        const toS = new Set<string>();
        if (to instanceof Set || to instanceof Array) {
            to.forEach((n: N) => toS.add(this.sn(n)));
        } else {
            toS.add(this.sn(to));
        }

        this.dfs(
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
            to.forEach((n) => toS.add(this.sn(n)));
        } else if (to instanceof Array) {
            to.forEach((n) => toS.add(this.sn(n)));
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
            v.forEach((e) => {
                if (seenEdges.has(e.uid)) {
                    return;
                }

                const newEdges = new Set<string>([e.uid]);
                const thisCycle = this.anyPath(e.to, e.from, undefined, newEdges, directed);

                if (thisCycle) {
                    thisCycle.push(e);
                    thisCycle.forEach((ee) => seenEdges.add(ee.uid));
                    result.push(thisCycle);
                }
            });
        });

        return result;
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
                    fullPath.forEach((e) => done.add(e.uid));
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
