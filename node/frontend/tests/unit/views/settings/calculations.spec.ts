import { expect } from 'chai';
import {shallowMount} from '@vue/test-utils';
import * as _ from 'lodash';
import {initialDocumentState} from '../../../../src/store/document/types';
import store from '../../../../src/store/store';
import Calculations from '../../../../src/views/settings/Calculations.vue';

describe('Calculations.vue', () => {

    it('can edit all general properties', () => {
        const wrapper = shallowMount(Calculations, { store });
        const fieldIds: string[] = (wrapper.vm as any).fields.map((v: [string, string]) => v[0]);
        const expectedFields = _.keys(initialDocumentState.drawing.metadata.calculationParams);

        expect(fieldIds.sort()).eql(expectedFields.sort());
    });
});
