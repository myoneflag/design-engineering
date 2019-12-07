import EquationEngine from '../../../src/calculations/equation-engine';
import { expect } from 'chai';

describe('equation-engine.ts', () => {
    it('empty object is complete', () => {
        const engine = new EquationEngine();
        expect(engine.isComplete());
    });

    it ('single unresolved equation is not resolved', () => {
        const engine = new EquationEngine();
    });

    it ('christmas tree completes when submitting the root value', () => {
        const engine = new EquationEngine();

        /**
         *          A0
         *         / \
         *        B1  C2
         *       /   /| \
         *      D6 E5 F4 G3
         *               \
         *                H7
         */

        engine.submitEquation(['A'], (p1: Map<string, any>) => {
            expect(p1.get('A')).eq(0);
            return [['B', 1], ['C', 2]];
        });

        engine.submitEquation(['B'], (p1: Map<string, any>) => {
            expect(p1.get('B')).eq(1);
            return [['D', 6]];
        });

        engine.submitEquation(['C'], (p1: Map<string, any>) => {
            expect(p1.get('C')).eq(2);
            return [['E', 5], ['F', 4], ['G', 3]];
        });

        engine.submitEquation(['G'], (p1: Map<string, any>) => {
            expect(p1.get('G')).eq(3);
            return [['H', 7]];
        });

        expect(engine.isComplete()).eq(false);

        engine.submitValue('A', 0);
        expect(engine.isComplete()).eq(true);

        expect(Array.from(engine.resolved.entries()).sort()).eql([
            ['A', 0],
            ['B', 1],
            ['C', 2],
            ['D', 6],
            ['E', 5],
            ['F', 4],
            ['G', 3],
            ['H', 7],
        ]);
    });

    it('pyramid behaves appropriately', () => {
        const engine = new EquationEngine();

        /**
         * A1 B2 C3
         *  \/   |
         *  D3   E3 F4
         *   \  /  /
         *    \ | /
         *      G10
         */

        const nodes = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

        engine.submitEquation(['A', 'B'], (p1: Map<string, any>) => {
            return [['D', Array.from(p1.values()).reduce((a, b) => a + b, 0)]];
        });

        engine.submitEquation(['D', 'E', 'F'], (p1: Map<string, any>) => {
            return [['G', Array.from(p1.values()).reduce((a, b) => a + b, 0)]];
        });

        // add equation E later.

        expect(engine.isComplete()).eq(false);
        expect(nodes.map((i) => engine.get(i))).eql([
            undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        ]);

        engine.submitValue('A', 1);
        expect(nodes.map((i) => engine.get(i))).eql([
            1, undefined, undefined, undefined, undefined, undefined, undefined,
        ]);

        engine.submitValue('C', 3);
        expect(nodes.map((i) => engine.get(i))).eql([
            1, undefined, 3, undefined, undefined, undefined, undefined,
        ]);

        engine.submitValue('F', 4);
        expect(nodes.map((i) => engine.get(i))).eql([
            1, undefined, 3, undefined, undefined, 4, undefined,
        ]);

        expect(engine.isComplete()).eq(false);
        engine.submitValue('B', 2);
        expect(nodes.map((i) => engine.get(i))).eql([
            1, 2, 3, 3, undefined, 4, undefined,
        ]);
        expect(engine.isComplete()).eq(false);

        engine.submitEquation(['C'], (p1: Map<string, any>) => {
            return [['E', Array.from(p1.values()).reduce((a, b) => a + b, 0)]];
        });
        expect(engine.isComplete()).eq(true);
        expect(nodes.map((i) => engine.get(i))).eql([
            1, 2, 3, 3, 3, 4, 10,
        ]);
    });

    it('DAGger in my heart', () => {
        const engine = new EquationEngine();

        /**
         *        A1  B2
         *       / \/  \
         *      C1 D.D3 E2
         *       \ / \ /
         *       F7   G8
         */

        const nodes = ['A', 'B', 'C', 'D', 'DD', 'E', 'F', 'G'];

        engine.submitValue('A', 1);
        engine.submitValue('B', 2);
        engine.submitEquation(['D', 'DD', 'E'], (p1: Map<string, any>) => {
            const val = Array.from(p1.values()).reduce((a, b) => a + b, 0);
            return [['G', val]];
        });
        expect(nodes.map((i) => engine.get(i))).eql([
            1, 2, undefined, undefined, undefined, undefined, undefined, undefined,
        ]);

        engine.submitEquation(['B'], (p1: Map<string, any>) => {
            const val = Array.from(p1.values()).reduce((a, b) => a + b, 0);
            return [['E', val]];
        });
        expect(nodes.map((i) => engine.get(i))).eql([
            1, 2, undefined, undefined, undefined, 2, undefined, undefined,
        ]);


        engine.submitEquation(['A'], (p1: Map<string, any>) => {
            const val = Array.from(p1.values()).reduce((a, b) => a + b, 0);
            return [['C', val]];
        });
        expect(nodes.map((i) => engine.get(i))).eql([
            1, 2, 1, undefined, undefined, 2, undefined, undefined,
        ]);

        engine.submitEquation(['A', 'B'], (p1: Map<string, any>) => {
            const val = Array.from(p1.values()).reduce((a, b) => a + b, 0);
            return [['D', val], ['DD', val]];
        });
        expect(nodes.map((i) => engine.get(i))).eql([
            1, 2, 1, 3, 3, 2, undefined, 8,
        ]);
        engine.submitEquation(['C', 'D', 'DD'], (p1: Map<string, any>) => {
            const val = Array.from(p1.values()).reduce((a, b) => a + b, 0);
            return [['F', val]];
        });
        expect(nodes.map((i) => engine.get(i))).eql([
            1, 2, 1, 3, 3, 2, 7, 8,
        ]);

    });
});


function addChristmasTree(engine: EquationEngine) {
    // asdf
}
