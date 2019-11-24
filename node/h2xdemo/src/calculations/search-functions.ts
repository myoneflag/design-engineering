import assert from 'assert';
import {EPS} from '@/calculations/pressure-drops';

// Works on concave functions
export function ternarySearchForGlobalMin(fn: (num: number) => number): number {
    let low = -10;
    let high = 10;
    // careful search phase 1. Expand horizon.

    let iters = 0;
    let lowEscaped = false;
    let highEscaped = false;

    while (true) {
        const mid1 = (low * 2 + high) / 3;
        const mid2 = (low + high * 2) / 3;


        const mv1 = fn(mid1);
        const mv2 = fn(mid2);
        const mv0 = fn(low);
        const mv3 = fn(high);

        if (mv0 <= mv1 && mv1 <= mv2 && mv2 <= mv3) {
            low = low - (high - low);
        } else {
            break;
        }

        iters++;
        if (iters > 50) {
            lowEscaped = true;
            break;
        }
    }

    iters = 0;
    while (true) {
        const mid1 = (low * 2 + high) / 3;
        const mid2 = (low + high * 2) / 3;


        const mv1 = fn(mid1);
        const mv2 = fn(mid2);
        const mv0 = fn(low);
        const mv3 = fn(high);

        if (mv0 >= mv1 && mv1 >= mv2 && mv2 >= mv3) {
            high = high + (high - low);
        } else {
            break;
        }

        iters++;
        if (iters > 50) {
            highEscaped = true;
            break;
        }
    }

    if (lowEscaped && highEscaped) {
        return 0;
    }

    // Phase 2. Center horizon

    for (let i = 0; i < 50; i++) {
        const mid1 = (low * 2 + high) / 3;
        const mid2 = (low + high * 2) / 3;

        const mv1 = fn(mid1);
        const mv2 = fn(mid2);
        const mv0 = fn(low);
        const mv3 = fn(high);

        if (mv1 > mv0) {
            throw new Error('mv0 ' + mv0 + ' is less than mv1 ' + mv1 + ' low: ' + low + ' mid1: ' + mid1);
        }
        if (mv2 > mv3) {
            throw new Error('mv2 ' + mv2 + ' is less than mv3 ' + mv3 + ' mid2: ' + mid2 + ' high: ' + high);
        }

        if (mv1 < mv2) {
            high = mid2;
        } else {
            low = mid1;
        }
    }

    return low;
}
