import {EntityType} from '../../../../../common/src/api/document/entities/types';
import { expect } from 'chai';
import { isConnectableEntity } from "../../../../../common/src/api/document/entities/concrete-entity";

describe('calculation-engine.ts', () => {
    it('can determine connectivity for every type', () => {
        Object.values(EntityType).forEach((item) => {
            if (item) {
                expect(() => isConnectable(item as EntityType)).to.not.throw();
            }
        });
    });
});
