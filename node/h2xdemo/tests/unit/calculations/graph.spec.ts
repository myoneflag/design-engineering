import Graph from '@/calculations/graph';
import {expect} from 'chai';
import * as _ from 'lodash';


describe('graph.ts', () => {
    it('dfs single node or single edge', () => {
        const graph: Graph<{node: string}, number> = new Graph<{node: string}, number>();
        addSingleNode(graph);
        const visited: string[] = [];
        graph.dfs({node: 'A'}, (n) => {
                visited.push(n.node);
            },
            undefined,
            () => {
                expect(false);
            },
        );
        expect(visited.sort()).eql(['A']);

        const cc = graph.connectedComponents();
        expect(cc).eql([[[{node: 'A'}], []]]);


        const graph2: Graph<{node: string}, number> = new Graph<{node: string}, number>();
        addSingleEdge(graph2);
        const visited2: string[] = [];
        const visitedEdges: number[] = [];
        graph2.dfs({node: 'B'}, (n) => {
                visited2.push(n.node);
            },
            undefined,

                (e) => {
                visitedEdges.push(e.value);
                expect(e.to).eql({node: 'C'});
            },
        );
        expect(visited2).eql(['B', 'C']);

        expect(visitedEdges).eql([1]);

        const cc2 = graph2.connectedComponents();
        expect(cc2.map((c) => c[0])).eql([[{node: 'B'}, {node: 'C'}]]);
    });

    it('traverses a directed graph', () => {
        const graph = new Graph<{node: string}, number>();
        addSimpleDirectedGraph(graph);

        const visitations: Array<[string, string]> = new Array<[string, string]>();

        /**
         * D --3-->F --5-->G
         * ^      /
         * 2     4
         * |    /
         * E<--
         */

        graph.dfs({node: 'D'},
            undefined,
            undefined,
            (edge) => {
                visitations.push([edge.from.node, edge.to.node]);
            },
        );

        expect(visitations.sort()).eql([
            ['D', 'F'],
            ['E', 'D'],
            ['F', 'E'],
            ['F', 'G'],
        ]);

        const traversal = graph.dagTraversal([{node: 'E'}]);
        removeUidForTesting(traversal);
        expect(traversal).eql([
            {
                node: {node: 'G'},
                parent: {
                    from: {node: 'F'},
                    to: {node: 'G'},
                    value: 5,
                    isDirected: true,
                    isReversed: false,
                },
                children: [

                ],
            },
            {
                node: {node: 'F'},
                parent: {
                    from: {node: 'D'},
                    to: {node: 'F'},
                    value: 3,
                    isDirected: true,
                    isReversed: false,
                },
                children: [
                    {
                        from: {node: 'F'},
                        to: {node: 'E'},
                        value: 4,
                        isDirected: true,
                        isReversed: false,
                    },
                    {
                        from: {node: 'F'},
                        to: {node: 'G'},
                        value: 5,
                        isDirected: true,
                        isReversed: false,
                    },
                ],
            },
            {
                node: {node: 'D'},
                parent: {
                    from: {node: 'E'},
                    to: {node: 'D'},
                    value: 2,
                    isDirected: true,
                    isReversed: false,
                },
                children: [
                    {
                        from: {node: 'D'},
                        to: {node: 'F'},
                        value: 3,
                        isDirected: true,
                        isReversed: false,
                    },
                ],
            },
            {
                node: {node: 'E'},
                parent: null,
                children: [
                    {
                        from: {node: 'E'},
                        to: {node: 'D'},
                        value: 2,
                        isDirected: true,
                        isReversed: false,
                    },
                ],
            },
        ]);
    });

    it ('traverses a simple tree', () => {
        const graph = new Graph<{node: string}, number>();
        addSimpleTree(graph);

        const visitations: Array<[string, string]> = new Array<[string, string]>();
        const seen = new Set<string>();
        graph.dfs(
            {node: 'L'},
            undefined,
            undefined,
            (edge) => {
                visitations.push([edge.from.node, edge.to.node]);
            },
        );

        /**
         *                      N
         *                     /
         *                    9
         *                  /
         * J --7-- I --8-- K --10-- M
         *        /         \
         *       6          11
         *      /            \
         *     H              L
         */

        expect(visitations.sort()).eql([
            ['I', 'H'],
            ['I', 'J'],
            ['K', 'I'],
            ['K', 'M'],
            ['K', 'N'],
            ['L', 'K'],
        ]);

        visitations.splice(0);
        seen.clear();

        graph.dfs({node: 'K'},
            undefined,
            undefined,
            undefined,
            (edge) => {
                visitations.push([edge.from.node, edge.to.node]);
            },
        );

        expect(visitations.sort()).eql([
            ['I', 'H'],
            ['I', 'J'],
            ['K', 'I'],
            ['K', 'L'],
            ['K', 'M'],
            ['K', 'N'],
        ]);
    });

    it('finds components', () => {
        const graph = new Graph<{node: string}, number>();
        addSimpleTree(graph);
        addSimpleDirectedGraph(graph);
        addSingleEdge(graph);
        addSingleNode(graph);

        const components = graph.connectedComponents();

        const sizes = components.map(([a, b]) => [a.length, b.length]);

        expect(sizes.sort((a, b) => a[0] < b[0] ? -1 : 1)).eql([
            [1, 0],
            [2, 1],
            [4, 4],
            [7, 6],
        ]);
    });

    it('finds a path', () => {
        const graph = new Graph<{node: string}, number>();
        addSimpleTree(graph);

        const path = graph.anyPath({node: 'J'}, {node: 'L'});
        expect(path).not.eq(null);
        expect(path!.map((e) => e.to)).eql([{node: 'I'}, {node: 'K'}, {node: 'L'}]);

        const graph2 = new Graph<{node: string}, number>();
        addSimpleDirectedGraph(graph2);

        const path2 = graph2.anyPath({node: 'E'}, {node: 'G'});
        expect(path2).not.eq(null);
        expect(path2!.map((e) => e.to)).eql([{node: 'D'}, {node: 'F'}, {node: 'G'}]);

        const path3 = graph2.anyPath({node: 'G'}, {node: 'E'});
        expect(path3).eq(null);
    });

    it('finds edge cycle cover', () => {
        const graph = new Graph<{node: string}, number>();
        addSimpleDirectedGraph(graph);

        const cycleCover = graph.edgeCycleCover(true);
        expect(cycleCover.map((k) => k.map((e) => [e.from.node, e.to.node]).sort()).sort()).eql(
            [
                [
                    ['D', 'F'],
                    ['E', 'D'],
                    ['F', 'E'],
                ],
            ],
        );
        for (let i = 1; i < cycleCover[0].length - 1; i++) {
            expect(cycleCover[0][i].from).eql(cycleCover[0][i - 1].to);
        }
        expect(cycleCover[0][0].from).eql(cycleCover[0][cycleCover[0].length - 1].to);
    });

    it('finds arc cover', () => {
       const graph = new Graph<{node: string}, number>();
       addSimpleTree(graph);

       const arc = graph.sourceArcCover([{node: 'M'}, {node: 'N'}, {node: 'H'}]);
       expect(arc.length).eq(2);
       const endpoints = new Set<string>();
       arc.forEach((a) => {
           endpoints.add(a[0].from.node);
           endpoints.add(a[a.length - 1].to.node);
       });
       expect(Array.from(endpoints.values()).sort()).eql(['H', 'M', 'N']);
       arc.forEach((a) => {
           for (let i = 1; i < a.length - 1; i++) {
               expect(a[i].from).eql(a[i - 1].to);
           }
       });
    });

    it('dijkstra returns a path with one edge', () => {
        const graph = new Graph<{node: string}, number>();
        addSingleEdge(graph);

        const visitedNodes: string[] = [];
        const visitedEdges: number[] = [];

        graph.dijkstra(
            {node: 'B'},
            (e) => {
                return e.value;
            },
            (n) => {
                visitedNodes.push(n.node.node);
            },
            (e) => {
                visitedEdges.push(e.value);
            },
        );

        expect(visitedNodes).eql(['B', 'C']);
        expect(visitedEdges).eql([1]);
    });

    it('traverses a directed cyclic graph with dijkstra', () => {

        const graph = new Graph<{node: string}, number>();
        addSimpleDirectedGraph(graph);

        const visitedNodes: string[] = [];
        const visitedEdges: number[] = [];

        graph.dijkstra(
            {node: 'D'},
            (e) => {
                return e.value;
            },
            (n) => {
                visitedNodes.push(n.node.node);
            },
            (e) => {
                visitedEdges.push(e.value);
            },
        );

        expect(visitedNodes).eql(['D', 'F', 'E', 'G']);
        expect(visitedEdges).eql([3, 4, 5, 2]);
    });

    it('traverses a tree with dijkstra and missing edges/nodes', () => {

        const graph = new Graph<{node: string}, number>();
        addSimpleTree(graph);

        const visitedNodes: string[] = [];
        const visitedEdges: number[] = [];

        graph.dijkstra(
            {node: 'J'},
            (e) => {
                return e.value;
            },
            (n) => {
                visitedNodes.push(n.node.node);
            },
            (e) => {
                visitedEdges.push(e.value);
                if (e.value === 6) {
                    return true;
                }
            },
            new Set<{node: string}>([{node: 'M'}]),
            new Set<string>(['9']),
        );

        expect(visitedNodes).eql(['J', 'I', 'K', 'L']);
        expect(visitedEdges).eql([7, 6, 8, 10, 11]);
    });

    it('should find shortest path', () => {
        const graph = new Graph<{node: string}, number>();
        addSimpleDirectedGraph(graph);

        const result = graph.shortestPath({node: 'E'}, {node: 'G'}, (e) => e.value);
        expect(result);
        expect(result![1]).eq(10);
        expect(result![0].map((e) => e.to)).eql([{node: 'D'}, {node: 'F'}, {node: 'G'}]);

        const result2 = graph.shortestPath({node: 'E'}, {node: 'G'}, (e) => e.value, undefined, undefined, false);
        expect(result2);
        expect(result2![1]).eq(9);
        expect(result2![0].map((e) => e.to)).eql([{node: 'F'}, {node: 'G'}]);

        const result3 = graph.shortestPath({node: 'G'}, {node: 'D'}, (e) => e.value);
        expect(result3).eq(null);

        const result4 = graph.shortestPath({node: 'D'}, {node: 'F'}, (e) => e.value, undefined, undefined, true, true);
        expect(result4);
        expect(result4![1]).eq(6);
        expect(result4![0].map((e) => e.to)).eql([{node: 'E'}, {node: 'F'}]);
    });
});


/**
 * A
 */
function addSingleNode(graph: Graph<{node: string}, number>) {
    graph.addNode({node: 'A'});
}

/**
 * B -1- C
 */
function addSingleEdge(graph: Graph<{node: string}, number>) {
    graph.addEdge({node: 'B'}, {node: 'C'}, 1);
}

/**
 * D --3-->F --5-->G
 * ^      /
 * 2     4
 * |    /
 * E<--
 */
function addSimpleDirectedGraph(graph: Graph<{node: string}, number>) {
    graph.addDirectedEdge({node: 'E'}, {node: 'D'}, 2);
    graph.addDirectedEdge({node: 'D'}, {node: 'F'},  3);
    graph.addDirectedEdge({node: 'F'}, {node: 'E'},  4);
    graph.addDirectedEdge({node: 'F'}, {node: 'G'},  5);
}


function removeUidForTesting(obj: any) {
    if (_.isArray(obj)) {
        obj.forEach(removeUidForTesting);
    } else if (_.isObject(obj)) {
        for (const key of Object.keys(obj)) {
            if (key === 'uid') {
                delete((obj as any)[key]);
            } else {
                removeUidForTesting((obj as any)[key]);
            }
        }
    }
}

/**
 *                      N
 *                     /
 *                    9
 *                  /
 * J --7-- I --8-- K --10-- M
 *        /         \
 *       6          11
 *      /            \
 *     H              L
 */
function addSimpleTree(graph: Graph<{node: string}, number>) {
    graph.addEdge({node: 'H'}, {node: 'I'}, 6, '6');
    graph.addEdge({node: 'J'}, {node: 'I'}, 7, '7');
    graph.addEdge({node: 'K'}, {node: 'I'}, 8, '8');
    graph.addEdge({node: 'K'}, {node: 'N'}, 9, '9');
    graph.addEdge({node: 'M'}, {node: 'K'}, 10, '10');
    graph.addEdge({node: 'K'}, {node: 'L'}, 11, '11');
}
