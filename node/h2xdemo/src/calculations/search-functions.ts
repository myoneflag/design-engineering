import assert from 'assert';

// Works on concave functions
export function ternarySearchForGlobalMin(fn: (num: number) => number): number {
    let low = -10;
    let high = 10;
    // careful search phase 1. Expand horizon.

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
    }

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
    }

    // Phase 2. Center horizon

    for (let i = 0; i < 50; i++) {
        const mid1 = (low * 2 + high) / 3;
        const mid2 = (low + high * 2) / 3;

        const mv1 = fn(mid1);
        const mv2 = fn(mid2);
        const mv0 = fn(low);
        const mv3 = fn(high);

        if (mv1 > mv0 || mv2 > mv3) {
            console.log(mv0 + ' ' + mv1 + ' ' + mv2 + ' ' + mv3);
            console.log(low + ' ' + mid1 + ' ' + mid2 + ' ' + high);
        }
        assert(mv1 <= mv0);
        assert(mv2 <= mv3);
        if (mv1 === mv2) {
            assert(mv2 !== mv3);
            assert(mv1 !== mv0);
        }

        if (mv1 < mv2) {
            high = mid2;
        } else {
            low = mid1;
        }
    }
    return low;
}
