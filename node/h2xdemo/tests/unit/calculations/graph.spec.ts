import Graph from '@/calculations/graph';
import {expect} from 'chai';
import {strictEqual} from 'assert';
import * as _ from 'lodash';


describe('graph.ts', () => {
    it('dfs single node or single edge', () => {
        const graph: Graph<string, number> = new Graph<string, number>();
        addSingleNode(graph);
        const visited: string[] = [];
        graph.dfs('A', (n) => {
                visited.push(n);
            },
            undefined,
            (e) => {
                expect(false);
            },
        );
        expect(visited.sort()).eql(['A']);

        const cc = graph.connectedComponents();
        expect(cc).eql([[['A'], []]]);


        const graph2: Graph<string, number> = new Graph<string, number>();
        addSingleEdge(graph2);
        const visited2: string[] = [];
        const visitedEdges: number[] = [];
        graph2.dfs('B', (n) => {
                visited2.push(n);
            },
            undefined,

                (e) => {
                visitedEdges.push(e.value);
                expect(e.to).equal('C');
            },
        );
        expect(visited2).eql(['B', 'C']);

        expect(visitedEdges).eql([1]);

        const cc2 = graph2.connectedComponents();
        expect(cc2.map((c) => c[0])).eql([['B', 'C']]);
    });

    it('traverses a directed graph', () => {
        const graph = new Graph<string, number>();
        addSimpleDirectedGraph(graph);

        const visitations: Array<[string, string]> = new Array<[string, string]>();

        /**
         * D --3-->F --5-->G
         * ^      /
         * 2     4
         * |    /
         * E<--
         */

        graph.dfs('D',
            undefined,
            undefined,
            (edge) => {
                visitations.push([edge.from, edge.to]);
            },
        );

        expect(visitations.sort()).eql([
            ['D', 'F'],
            ['E', 'D'],
            ['F', 'E'],
            ['F', 'G'],
        ]);

        const traversal = graph.dagTraversal(['E']);
        removeUidForTesting(traversal);
        expect(traversal).eql([
            {
                node: 'G',
                parent: {
                    from: 'F',
                    to: 'G',
                    value: 5,
                    isDirected: true,
                    isReversed: false,
                },
                children: [

                ],
            },
            {
                node: 'F',
                parent: {
                    from: 'D',
                    to: 'F',
                    value: 3,
                    isDirected: true,
                    isReversed: false,
                },
                children: [
                    {
                        from: 'F',
                        to: 'E',
                        value: 4,
                        isDirected: true,
                        isReversed: false,
                    },
                    {
                        from: 'F',
                        to: 'G',
                        value: 5,
                        isDirected: true,
                        isReversed: false,
                    },
                ],
            },
            {
                node: 'D',
                parent: {
                    from: 'E',
                    to: 'D',
                    value: 2,
                    isDirected: true,
                    isReversed: false,
                },
                children: [
                    {
                        from: 'D',
                        to: 'F',
                        value: 3,
                        isDirected: true,
                        isReversed: false,
                    },
                ],
            },
            {
                node: 'E',
                parent: null,
                children: [
                    {
                        from: 'E',
                        to: 'D',
                        value: 2,
                        isDirected: true,
                        isReversed: false,
                    },
                ],
            },
        ]);
    });

    it ('traverses a simple tree', () => {
        const graph = new Graph<string, number>();
        addSimpleTree(graph);

        const visitations: Array<[string, string]> = new Array<[string, string]>();
        const seen = new Set<string>();
        graph.dfs(
            'L',
            undefined,
            undefined,
            (edge) => {
                visitations.push([edge.from, edge.to]);
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

        graph.dfs('K',
            undefined,
            undefined,
            undefined,
            (edge) => {
                visitations.push([edge.from, edge.to]);
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
        const graph = new Graph<string, number>();
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
        const graph = new Graph<string, number>();
        addSimpleTree(graph);

        const path = graph.anyPath('J', 'L');
        expect(path).not.eq(null);
        expect(path!.map((e) => e.to)).eql(['I', 'K', 'L']);

        const graph2 = new Graph<string, number>();
        addSimpleDirectedGraph(graph2);

        const path2 = graph2.anyPath('E', 'G');
        expect(path2).not.eq(null);
        expect(path2!.map((e) => e.to)).eql(['D', 'F', 'G']);

        const path3 = graph2.anyPath('G', 'E');
        expect(path3).eq(null);
    });

    it('finds edge cycle cover', () => {
        const graph = new Graph<string, number>();
        addSimpleDirectedGraph(graph);

        const cycleCover = graph.edgeCycleCover(true);
        expect(cycleCover.map((k) => k.map((e) => [e.from, e.to]).sort()).sort()).eql(
            [
                [
                    ['D', 'F'],
                    ['E', 'D'],
                    ['F', 'E'],
                ],
            ],
        );
        for (let i = 1; i < cycleCover[0].length - 1; i++) {
            expect(cycleCover[0][i].from).eq(cycleCover[0][i - 1].to);
        }
        expect(cycleCover[0][0].from).eq(cycleCover[0][cycleCover[0].length - 1].to);
    });

    it('finds arc cover', () => {
       const graph = new Graph<string, number>();
       addSimpleTree(graph);

       const arc = graph.sourceArcCover(new Set(['M', 'N', 'H']));
       expect(arc.length).eq(2);
       const endpoints = new Set<string>();
       arc.forEach((a) => {
           endpoints.add(a[0].from);
           endpoints.add(a[a.length - 1].to);
       });
       expect(Array.from(endpoints.values()).sort()).eql(['H', 'M', 'N']);
       arc.forEach((a) => {
           for (let i = 1; i < a.length - 1; i++) {
               expect(a[i].from).eq(a[i - 1].to);
           }
       });
    });

    it('dijkstra returns a path with one edge', () => {
        const graph = new Graph<string, number>();
        addSingleEdge(graph);

        const visitedNodes: string[] = [];
        const visitedEdges: number[] = [];

        graph.dijkstra(
            'B',
            (e) => {
                return e.value;
            },
            (n) => {
                visitedNodes.push(n.node);
            },
            (e) => {
                visitedEdges.push(e.value);
            },
        );

        expect(visitedNodes).eql(['B', 'C']);
        expect(visitedEdges).eql([1]);
    });

    it('traverses a directed cyclic graph with dijkstra', () => {

        const graph = new Graph<string, number>();
        addSimpleDirectedGraph(graph);

        const visitedNodes: string[] = [];
        const visitedEdges: number[] = [];

        graph.dijkstra(
            'D',
            (e) => {
                return e.value;
            },
            (n) => {
                visitedNodes.push(n.node);
            },
            (e) => {
                visitedEdges.push(e.value);
            },
        );

        expect(visitedNodes).eql(['D', 'F', 'E', 'G']);
        expect(visitedEdges).eql([3, 4, 5, 2]);
    });

    it('traverses a tree with dijkstra and missing edges/nodes', () => {

        const graph = new Graph<string, number>();
        addSimpleTree(graph);

        const visitedNodes: string[] = [];
        const visitedEdges: number[] = [];

        graph.dijkstra(
            'J',
            (e) => {
                return e.value;
            },
            (n) => {
                console.log(n);
                visitedNodes.push(n.node);
            },
            (e) => {
                visitedEdges.push(e.value);
                if (e.value === 6) {
                    return true;
                }
            },
            new Set<string>(['M']),
            new Set<string>(['9']),
        );

        expect(visitedNodes).eql(['J', 'I', 'K', 'L']);
        expect(visitedEdges).eql([7, 6, 8, 10, 11]);
    });

    it('should find shortest path', () => {
        const graph = new Graph<string, number>();
        addSimpleDirectedGraph(graph);

        const result = graph.shortestPath('E', 'G', (e) => e.value);
        expect(result);
        expect(result![1]).eq(10);
        expect(result![0].map((e) => e.to)).eql(['D', 'F', 'G']);

        console.log('here');
        const result2 = graph.shortestPath('E', 'G', (e) => e.value, undefined, undefined, false);
        expect(result2);
        expect(result2![1]).eq(9);
        expect(result2![0].map((e) => e.to)).eql(['F', 'G']);

        const result3 = graph.shortestPath('G', 'D', (e) => e.value);
        expect(result3).eq(null);

        const result4 = graph.shortestPath('D', 'F', (e) => e.value, undefined, undefined, true, true);
        expect(result4);
        expect(result4![1]).eq(6);
        expect(result4![0].map((e) => e.to)).eql(['E', 'F']);
    });
});


/**
 * A
 */
function addSingleNode(graph: Graph<string, number>) {
    graph.addNode('A');
}

/**
 * B -1- C
 */
function addSingleEdge(graph: Graph<string, number>) {
    graph.addEdge('B', 'C', 1);
}

/**
 * D --3-->F --5-->G
 * ^      /
 * 2     4
 * |    /
 * E<--
 */
function addSimpleDirectedGraph(graph: Graph<string, number>) {
    graph.addDirectedEdge('E', 'D', 2);
    graph.addDirectedEdge('D', 'F',  3);
    graph.addDirectedEdge('F', 'E',  4);
    graph.addDirectedEdge('F', 'G',  5);
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
function addSimpleTree(graph: Graph<string, number>) {
    graph.addEdge('H', 'I', 6, '6');
    graph.addEdge('J', 'I', 7, '7');
    graph.addEdge('K', 'I', 8, '8');
    graph.addEdge('K', 'N', 9, '9');
    graph.addEdge('M', 'K', 10, '10');
    graph.addEdge('K', 'L', 11, '11');
}
