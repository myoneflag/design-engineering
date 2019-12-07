import { expect } from 'chai';
import {findOptimalSwaps, longestIncreasingSubsequence} from '../../../../../src/store/document/operation-transforms/uid-lis';

describe('uid-lcm', () => {
    it('calculates the LIS correctly', () => {
        const values4 = ['a'];
        const order4 = ['a'];
        const result4 = longestIncreasingSubsequence(values4, order4);
        expect(result4).eql([['a', true]]);

        const sorted = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
        const order3 = ['i', 'h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];
        const result3 = longestIncreasingSubsequence(sorted, order3);
        expect(result3.filter((v) => v[1]).length).eq(1);
        expect(result3.map((v) => v[0])).eql(sorted);

        const values = ['c', 'a', 'b', 'd', 'e', 'f', 'h', 'i', 'g'];
        const order = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
        const result = longestIncreasingSubsequence(values, order);
        expect(result.map((v) => v[1])).eql([false, true, true, true, true, true, true, true, false]);
        expect(result.map((v) => v[0])).eql(values);

        const values2 = ['a', 'd', 'e', 'b', 'h', 'c', 'i', 'g', 'f'];
        const result2 = longestIncreasingSubsequence(values2, order);
        expect(result2.map((v) => v[1])).eql([true, true, true, false, true, false, true, false, false]);
        expect(result2.map((v) => v[0])).eql(values2);


    });

    it ('finds optimal swaps', () => {
        let before = ['c', 'a', 'b', 'd', 'e', 'f', 'h', 'i', 'g'];
        let after = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
        let result = findOptimalSwaps(before, after);
        expect(result.length).eq(2);
        // do it
        result.forEach(([v, i]) => {
           const item = before.splice(before.indexOf(v), 1);
           before.splice(i, 0, item[0]);
        });
        expect(before).eql(after);


        before = ['a', 'd', 'e', 'b', 'h', 'c', 'g', 'f', 'i'];
        after = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
        result = findOptimalSwaps(before, after);
        expect(result.length).eq(4);
        // do it
        result.forEach(([v, i]) => {
            const item = before.splice(before.indexOf(v), 1);
            before.splice(i, 0, item[0]);
        });
        expect(before).eql(after);

        before = ['a'];
        after = ['a'];
        result = findOptimalSwaps(before, after);
        expect(result.length).eq(0);
        // do it
        result.forEach(([v, i]) => {
            const item = before.splice(before.indexOf(v), 1);
            before.splice(i, 0, item[0]);
        });
        expect(before).eql(after);
    });
});
