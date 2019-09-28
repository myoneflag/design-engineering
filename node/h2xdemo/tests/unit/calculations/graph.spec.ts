import Graph from '@/calculations/graph';
import {expect} from 'chai';

describe('graph.ts', () => {
    it('dfs single node or single edge', () => {
        const graph: Graph<string, number> = new Graph<string, number>();
        addSingleNode(graph);
        const seen = new Set<string>();
        const visited: string[] = [];
        graph.dfs('A', seen, 'test', (n, v) => {
            expect(v).equal('test');
            visited.push(n);
        }, (e, v) => {
            expect(false);
        });
        expect(visited.sort()).eql(['A']);

        const cc = graph.connectedComponents();
        expect(cc).eql([[['A'], []]]);


        const graph2: Graph<string, number> = new Graph<string, number>();
        addSingleEdge(graph2);
        const seen2 = new Set<string>();
        const visited2: string[] = [];
        const visitedEdges: number[] = [];
        graph2.dfs('B', seen2, 'test', (n, v) => {
            expect(v).equal('test');
            visited2.push(n);
            return 1337;
        }, (e, v) => {
            visitedEdges.push(e.value);
            expect(e.to).equal('C');
            expect(v).equal(1337);
            return 'test';
        });
        expect(visited2).eql(['B', 'C']);

        expect(visitedEdges).eql([1]);

        const cc2 = graph2.connectedComponents();
        expect(cc2).eql([[['B', 'C'], [{value: 1, from: 'B', to: 'C', isDirected: false}]]]);
    });

    it('traverses a directed graph', () => {
        const graph = new Graph<string, number>();
        addSimpleDirectedGraph(graph);

        const visitations: Array<[string, string]> = new Array<[string, string]>();

        const seen = new Set<string>();
        graph.dfs('D', seen, '',
            (node, value) => {
                const newval = value + node;
                visitations.push([node, newval]);
                return newval;
            }, (edge, value) => {
                return value + edge.value.toString();
            });

        expect(visitations.sort()).eql([
            ['D', 'D'],
            ['E', 'D3F4E'],
            ['F', 'D3F'],
            ['G', 'D3F5G'],
        ]);

        const traversal = graph.dagTraversal(['E']);
        expect(traversal).eql([
            {
                node: 'G',
                parent: {
                    from: 'F',
                    to: 'G',
                    value: 5,
                    isDirected: true,
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
                },
                children: [
                    {
                        from: 'F',
                        to: 'E',
                        value: 4,
                        isDirected: true,
                    },
                    {
                        from: 'F',
                        to: 'G',
                        value: 5,
                        isDirected: true,
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
                },
                children: [
                    {
                        from: 'D',
                        to: 'F',
                        value: 3,
                        isDirected: true,
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
                    },
                ],
            },
        ]);
    });

    it ('traverses a simple undirected graph', () => {
        const graph = new Graph<string, number>();
        addSimpleTree(graph);

        const visitations: Array<[string, string]> = new Array<[string, string]>();
        const seen = new Set<string>();
        graph.dfs('L', seen, '',
            (node, value) => {
                const newval = value + node;
                visitations.push([node, newval]);
                return newval;
            }, (edge, value) => {
                return value + edge.value.toString();
            });

        expect(visitations.sort()).eql([
            ['H', 'L11K8I6H'],
            ['I', 'L11K8I'],
            ['J', 'L11K8I7J'],
            ['K', 'L11K'],
            ['L', 'L'],
            ['M', 'L11K10M'],
            ['N', 'L11K9N'],
        ]);

        visitations.splice(0);
        seen.clear();

        graph.dfs('K', seen, '',
            (node, value) => {
                const newval = value + node;
                visitations.push([node, newval]);
                return newval;
            }, (edge, value) => {
                return value + edge.value.toString();
            });

        expect(visitations.sort()).eql([
            ['H', 'K8I6H'],
            ['I', 'K8I'],
            ['J', 'K8I7J'],
            ['K', 'K'],
            ['L', 'K11L'],
            ['M', 'K10M'],
            ['N', 'K9N'],
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
    graph.addEdge('H', 'I', 6);
    graph.addEdge('J', 'I', 7);
    graph.addEdge('K', 'I', 8);
    graph.addEdge('K', 'N', 9);
    graph.addEdge('M', 'K', 10);
    graph.addEdge('K', 'L', 11);
}
