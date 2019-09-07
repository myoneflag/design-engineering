import {Matrix} from 'transformation-matrix';

export interface Transformation {
    tx: number;
    ty: number;
    sx: number;
    sy: number;
    a: number;
}

export const parseScale = (repr: string) => {
    const match = repr.match('^([0-9]+):([0-9]+)$');
    if (match) {
        const [, l, r] = match;
        return parseInt(l, 10) / parseInt(r, 10);
    }
    return 1 / 100;
};

/**
 * Decomposes a transformation matrix to the 2d transformation components.
 * Why doesn't this exist in transformation-matrix?
 * @param mat
 */
export const decomposeMatrix = (mat: Matrix): Transformation => {
    return {
        tx: mat.e,
        ty: mat.f,
        sx: (mat.a >= 0 ? 1 : -1) * Math.sqrt(mat.a * mat.a + mat.c * mat.c),
        sy: (mat.d >= 0 ? 1 : -1) * Math.sqrt(mat.b * mat.b + mat.d * mat.d),
        a: Math.atan2(mat.b, mat.d),
    };
};

export const matrixScale = (mat: Matrix): number => {
    const sx = (mat.a >= 0 ? 1 : -1) * Math.sqrt(mat.a * mat.a + mat.c * mat.c);
    return Math.abs(sx);
};
