import uuid from 'uuid';
import _ from 'lodash';
import assert from 'assert';

export default class Graph<N, E> {
    adjacencyList: Map<N, Array<Edge<N, E>>> = new Map<N, Array<Edge<N, E>>>();
    edgeList: Map<string, Edge<N, E>> = new Map<string, Edge<N, E>>();
    reverseAdjacencyList: Map<N, Array<Edge<N, E>>> = new Map<N, Array<Edge<N, E>>>();

    addNode(node: N) {
        if (!this.adjacencyList.has(node)) {
            this.adjacencyList.set(node, []);
            this.reverseAdjacencyList.set(node, []);
        }
    }

    addDirectedEdge(from: N, to: N, edgeValue: E, uid?: string, isDirected: boolean = true) {
        if (uid === undefined) {
            uid = uuid();
        }
        this.addNode(from);
        this.addNode(to);
        const val = this.adjacencyList.get(from)!;
        const reverseVal = this.reverseAdjacencyList.get(to)!;
        const forward = {
                from, to, value: edgeValue, isDirected, uid, isReversed: false,
        };
        const backward = {
            from: to, to: from, value: edgeValue, isDirected, uid, isReversed: isDirected,
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
        const seen: Set<N>  = new Set<N>();
        roots.forEach((root) => {
            this.dagTraversalRecursive(root, null, seen, traversals);
        });
        return traversals;
    }

    dagTraversalRecursive(curr: N, parentPath: Edge<N, E> | null, seen: Set<N>, traversals: Array<Traversal<N, E>>) {
        if (seen.has(curr)) {
            return;
        }
        seen.add(curr);
        const traversal: Traversal<N, E> = {
            node: curr, parent: parentPath, children: [],
        };

        const nei = this.adjacencyList.get(curr);
        if (nei) {
            nei.forEach((next) => {
                if (parentPath === null || parentPath.from !== next.to) {
                    traversal.children.push(next);
                }
                if (!seen.has(next.to)) {
                    this.dagTraversalRecursive(next.to, next, seen, traversals);
                }
            });
        } else {
            throw new Error('Node missing from adjacency list ' + curr);
        }

        traversals.push(traversal);
    }

    /**
     * Guaranteed that visitEdge is called exactly once for all reachable edges, and visitNode
     * is called once for each visitable node.
     */
    dfs(
        curr: N,
        visitNode?: (node: N) => (boolean | void),
        leaveNode?: (node: N) => void,
        visitEdge?: (edge: Edge<N, E>) => (boolean | void),
        leaveEdge?: (edge: Edge<N, E>) => void,
        seen?: Set<N>,
        seenEdges?: Set<string>,
        directed: boolean = true,
        reversed: boolean = false,
    ) {
        if (seenEdges === undefined) {
            seenEdges = new Set<string>();
        }
        if (seen === undefined) {
            seen = new Set<N>();
        }

        if (seen.has(curr)) {
            return;
        }
        seen.add(curr);

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
        const forward = this.adjacencyList.get(curr);
        const backward = this.reverseAdjacencyList.get(curr);
        if (!forward || !backward) {
            throw new Error('cannot find node ' + curr);
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
            if (!seen!.has(next.to)) {
                this.dfs(next.to, visitNode, leaveNode, visitEdge, leaveEdge, seen, seenEdges, directed, reversed);
            }
            if (leaveEdge) {
                leaveEdge(next);
            }
        });

        if (leaveNode) {
            leaveNode(curr);
        }
    }

    /**
     * Only makes sense for directed graphs.
     */
    connectedComponents(): Array<SubGraph<N, E>> {
        const components: Array<SubGraph<N, E>> = new Array<SubGraph<N, E>>();
        const seen: Set<N> = new Set<N>();

        this.adjacencyList.forEach((adj, node) => {
            const subGraph: SubGraph<N, E> = [[], []];
            if (!seen.has(node)) {
                this.dfs(
                    node,
                    (n) => {
                        subGraph[0].push(n);
                    },
                    undefined,
                    (e) => {
                        subGraph[1].push(e);
                    },
                    undefined,
                    seen,
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
        reversed: boolean = false,
    ): Array<Edge<N, E>> | null {
        const cache: Array<Edge<N, E>> = [];
        let result: Array<Edge<N, E>> | null = null;
        let found = false;

        this.dfs(
            from,
            (n) => {
                if (to instanceof Set && to.has(n) || _.isArray(to) && to.indexOf(n) !== -1 || to === n) {
                    found = true;
                    result = _.cloneDeep(cache);
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
            seenNodes,
            seenEdges,
            directed,
            reversed,
        );

        return result;
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
            },
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


    sourceArcCover(sources: Set<N>, accountedFor?: Set<string>): Array<Array<Edge<N, E>>> {
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
            const srcPath1 = this.anyPath(v.from, Array.from(sources.keys()), undefined, new Set([k]), false);
            if (srcPath1) {
                const srcPath2 = this.anyPath(
                    v.to,
                    Array.from(sources.keys()),
                    undefined,
                    new Set([k]),
                    false,
                );
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
        return path.reverse().map((e): Edge<N, E> => {
            return {
                from: e.to,
                isDirected: e.isDirected,
                isReversed: e.isDirected ? !e.isReversed : false,
                to: e.from,
                uid: e.uid,
                value: e.value,
            };
        });
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
