import { expect } from 'chai';
import {shallowMount} from '@vue/test-utils';
import * as _ from 'lodash';
import {initialDocumentState} from '../../../../src/store/document/types';
import store from '../../../../src/store/store';
import FlowSystems from '../../../../src/views/settings/FlowSystems.vue';

describe('FlowSystems.vue', () => {

    it('can edit all general properties', () => {
        const wrapper = shallowMount(FlowSystems, { store });
        const fieldIds: string[] = (wrapper.vm as any).fields.map((v: [string, string]) => v[0]);

        fieldIds.push('uid');

        const expectedFields = _.keys(initialDocumentState.drawing.metadata.flowSystems[0]);

        expect(fieldIds.sort()).eql(expectedFields.sort());
    });
});
