import {EntityType} from '@/store/document/entities/types';
import {isConnectable} from '@/store/document';
import { expect } from 'chai';

describe('index.ts', () => {
    it('can determine connectivity for every type', () => {
        Object.values(EntityType).forEach((item) => {
            if (item) {
                expect(() => isConnectable(item as EntityType)).to.not.throw();
            }
        });
    });
});
