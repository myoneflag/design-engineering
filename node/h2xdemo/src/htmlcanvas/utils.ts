import {ViewPort} from '@/htmlcanvas/viewport';
import {Matrix} from 'transformation-matrix';

export interface Transformation {
    tx: number;
    ty: number;
    sx: number;
    sy: number;
    a: number;
}

export const parseScale = (repr: string) => {
    console.log("Parsing scale of " + repr);
    const match = repr.match('^([0-9]+):([0-9]+)$');
    if (match) {
        let [_, l, r] = match;
        return parseInt(l) / parseInt(r);
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
}

/*
export const rescaleAnchor = (
    obj: {centerX: number, centerY: number, scale: number},
    newScale: number,
    anchorX: number,
    anchorY: number,
) => {
    // where will the anchor be after the resize?
    const dx = anchorX - obj.centerX;
    const dy = anchorY - obj.centerY;
    const nx = obj.centerX + dx * newScale / obj.scale;
    const ny = obj.centerY + dy * newScale / obj.scale;
    obj.centerX -= anchorX - nx;
    obj.centerY -= anchorY - ny;
    obj.scale = newScale;
};*/
