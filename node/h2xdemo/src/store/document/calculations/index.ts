import {DrawableEntity} from '@/store/document/types';

export function isCalculated(e: DrawableEntity): boolean {
    return 'calculation' in e;
}
