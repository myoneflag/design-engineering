import { EPS } from "../../../common/src/lib/utils";

export function canonizeAngleRad(a: number) {
    return ((((a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
}

export function angleDiffRad(a: number, b: number) {
    return canonizeAngleRad(a - b);
}

export function angleDiffDeg(a: number, b: number) {
    return ((a - b + (180 % 360) + 360) % 360) - 180;
}

export function isRightAngleRad(a: number, tolerance: number = EPS) {
    return (
        Math.abs(angleDiffRad(canonizeAngleRad(a), Math.PI / 2)) <= tolerance ||
        Math.abs(angleDiffRad(canonizeAngleRad(a), -Math.PI / 2)) <= tolerance
    );
}

export function is45AngleRad(a: number, tolerance: number = EPS) {
    return (
        Math.abs(angleDiffRad(angleDiffRad(a, Math.PI), Math.PI / 4)) <= tolerance ||
        Math.abs(angleDiffRad(angleDiffRad(a, Math.PI), -Math.PI / 4)) <= tolerance        
    );
}

export function isStraightRad(a: number, tolerance: number = EPS) {
    return angleDiffRad(Math.PI, canonizeAngleRad(a)) <= tolerance;
}
