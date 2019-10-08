export function terniarySearch(low: number, high: number, fn: (num: number) => number): number {
    for (let i = 0; i < 50; i++) {
        const mid1 = (low * 2 + high) / 3;
        const mid2 = (low + high * 2) / 3;

        const mv1 = fn(mid1);
        const mv2 = fn(mid2);
        if (mv1 < mv2) {
            high = mid2;
        } else {
            low = mid1;
        }
    }
    return low;
}
