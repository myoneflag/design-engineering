import UnionFind from '../../../src/calculations/union-find';
import { expect } from 'chai';

describe('union-find.ts', () => {
    it('handles no nodes', () => {
       const uf = new UnionFind<string>();
       expect(uf.groups()).eql([]);
    });


    it('handles single edge and self group', () => {
        const uf = new UnionFind<string>();
        uf.join('a', 'b');
        uf.join('c', 'c');
        expect(uf.groups().sort()).eql([['a', 'b'], ['c']]);
    });

    it('can join a few groups together', () => {
        const uf = new UnionFind<string>();
        uf.join('cat', 'dog');
        uf.join('dog', 'dolphin');
        uf.join('carrot', 'tomato');
        uf.join('elephant', 'squirrel');
        uf.join('amd', 'intel');
        uf.join('carrot', 'carrot');
        uf.join('carrot', 'tomato');
        uf.join('nVidia', 'apple');
        uf.join('microsoft', 'google');
        uf.join('carrot', 'broccoli');
        uf.join('microsoft', 'nVidia');
        uf.join('nVidia', 'amd');
        uf.join('dog', 'elephant');
        uf.join('dog', 'squirrel');

        expect(uf.groups().sort().map((a) => a.sort())).eql([
            ['amd', 'apple', 'google', 'intel', 'microsoft', 'nVidia'],
            ['broccoli', 'carrot', 'tomato'],
            ['cat', 'dog', 'dolphin', 'elephant', 'squirrel'],
        ]);
    });
});
