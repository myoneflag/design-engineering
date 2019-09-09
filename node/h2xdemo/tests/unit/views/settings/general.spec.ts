import { expect } from 'chai';
import {shallowMount} from '@vue/test-utils';
import General from '@/views/settings/General.vue';
import * as _ from 'lodash';
import {initialValue} from '@/store/document/types';
import store from '@/store/store';

describe('General.vue', () => {

    it('can edit all general properties', () => {
         const wrapper = shallowMount(General, { store });
         const fieldIds: string[] = (wrapper.vm as any).fields.map((v: [string, string]) => v[0]);
         const expectedFields = _.keys(initialValue.drawing.generalInfo);

         expect(fieldIds.sort()).eql(expectedFields.sort());
    });
});
