import {DrawableEntity} from '../../../../src/store/document/types';

export function isCalculated(e: DrawableEntity): boolean {
    return 'calculation' in e;
}
