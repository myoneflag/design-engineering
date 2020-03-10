export type Polynomial = number[]; // constant first, highest order last.

export function evaluatePolynomial(p: Polynomial, value: number): number {
    let res = 0;
    for (let i = 0; i < p.length; i++) {
        res += p[i] * Math.pow(value, i);
    }
    return res;
}
