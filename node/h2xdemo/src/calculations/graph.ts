import uuid from 'uuid';

export default class Graph<N, E> {
    adjacencyList: Map<N, Array<EdgeWrapper<N, E>>> = new Map<N, Array<EdgeWrapper<N, E>>>();

    addNode(node: N) {
        if (!this.adjacencyList.has(node)) {
            this.adjacencyList.set(node, []);
        }
    }

    addDirectedEdge(from: N, to: N, edgeValue: E, uid?: string) {
        let isDirected = false;
        if (uid === undefined) {
            uid = uuid();
            isDirected = true;
        }
        this.addNode(from);
        this.addNode(to);
        const val = this.adjacencyList.get(from)!;
        val.push({
            edge: {
                from, to, value: edgeValue, isDirected,
            },
            uid,
        });
    }

    addEdge(a: N, b: N, edgeValue: E) {
        const uid = uuid();
        this.addDirectedEdge(a, b, edgeValue, uid);
        this.addDirectedEdge(b, a, edgeValue, uid);
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
                if (parentPath === null || parentPath.from !== next.edge.to) {
                    traversal.children.push(next.edge);
                }
                if (!seen.has(next.edge.to)) {
                    this.dagTraversalRecursive(next.edge.to, next.edge, seen, traversals);
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
    dfs<V1, V2>(
        curr: N,
        seen: Set<N>,
        customValue: V1 | null,
        visitNode: (node: N, value: V1 | null) => V2 | void,
        visitEdge: (edge: Edge<N, E>, value: V2 | null) => V1 | void,
        seenEdges?: Set<string>,
    ) {
        if (seenEdges === undefined) {
            seenEdges = new Set<string>();
        }

        if (seen.has(curr)) {
            return;
        }
        seen.add(curr);
        const v2 = visitNode(curr, customValue);

        const nei = this.adjacencyList.get(curr);
        if (nei) {
            nei.forEach((next) => {
                if (seenEdges!.has(next.uid)) {
                    return;
                }
                seenEdges!.add(next.uid);

                const v1 = visitEdge(next.edge, v2 === undefined ? null : v2);
                if (!seen.has(next.edge.to)) {
                    this.dfs(next.edge.to, seen, v1 === undefined ? null : v1, visitNode, visitEdge, seenEdges);
                }
            });
        } else {
            throw new Error('Node missing from adjacency list ' + curr);
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
                    seen,
                    null,
                    (n, v) => {
                        subGraph[0].push(n);
                    },
                    (e, v) => {
                        subGraph[1].push(e);
                    },
                );
                components.push(subGraph);
            }
        });

        return components;
    }

    reachable(root: N): SubGraph<N, E> {
        const subGraph: SubGraph<N, E> = [[], []];
        const seen: Set<N> = new Set<N>();
        this.dfs(
            root,
            seen,
            null,
            (n, v) => {
                subGraph[0].push(n);
            },
            (e, v) => {
                subGraph[1].push(e);
            },
        );
        return subGraph;
    }
}

export type SubGraph<N, E> = [N[], Array<Edge<N, E>>];

interface EdgeWrapper<N, E> {
    edge: Edge<N, E>;
    uid: string;
}

export interface Edge<N, E> {
    from: N;
    to: N;
    value: E;
    isDirected: boolean;
}

export interface Traversal<N, E> {
    node: N;
    children: Array<Edge<N, E>>;
    parent: Edge<N, E> | null;
}
