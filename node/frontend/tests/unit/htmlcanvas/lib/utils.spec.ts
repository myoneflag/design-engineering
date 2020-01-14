import { expect } from 'chai';
import { interpolateTable } from "../../../../../common/src/lib/utils";

describe('utils.ts', () => {
    it('should interpolate table correctly', () => {
        const table = {
         '015': '50',
         '7': '100',
         '130': '200',
         '210': '180',
        };

        expect(interpolateTable(table, 7)).eq(100);
        expect(interpolateTable(table, 15)).eq(50);
        expect(interpolateTable(table, 130)).eq(200);
        expect(interpolateTable(table, 210)).eq(180);


        expect(interpolateTable(table, -10)).eq(100);
        expect(interpolateTable(table, 10000)).eq(180);

        expect(interpolateTable(table, 9)).eq(87.5);
        expect(interpolateTable(table, 107)).eq(170);
        expect(interpolateTable(table, 170)).eq(190);
    });
});
