import {EntityType} from '../../../../src/store/document/entities/types';
import {isConnectable} from '../../../../src/store/document';
import { expect } from 'chai';

describe('calculation-engine.ts', () => {
    it('can determine connectivity for every type', () => {
        Object.values(EntityType).forEach((item) => {
            if (item) {
                expect(() => isConnectable(item as EntityType)).to.not.throw();
            }
        });
    });
});
