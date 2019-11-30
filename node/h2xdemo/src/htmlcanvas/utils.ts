import {Matrix} from 'transformation-matrix';
import Flatten from '@flatten-js/core';

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

export enum KeyCode {
    DOM_VK_CANCEL = 3,
    HELP = 6,
    BACK_SPACE = 8,
    TAB = 9,
    CLEAR = 12,
    RETURN = 13,
    ENTER = 14,
    SHIFT = 16,
    CONTROL = 17,
    ALT = 18,
    PAUSE = 19,
    CAPS_LOCK = 20,
    ESCAPE = 27,
    SPACE = 32,
    PAGE_UP = 33,
    PAGE_DOWN = 34,
    END = 35,
    HOME = 36,
    LEFT = 37,
    UP = 38,
    RIGHT = 39,
    DOWN = 40,
    PRINTSCREEN = 44,
    INSERT = 45,
    DELETE = 46,
    NUM_0 = 48,
    NUM_1 = 49,
    NUM_2 = 50,
    NUM_3 = 51,
    NUM_4 = 52,
    NUM_5 = 53,
    NUM_6 = 54,
    NUM_7 = 55,
    NUM_8 = 56,
    NUM_9 = 57,
    SEMICOLON = 59,
    EQUALS = 61,
    A = 65,
    B = 66,
    C = 67,
    D = 68,
    E = 69,
    F = 70,
    G = 71,
    H = 72,
    I = 73,
    J = 74,
    K = 75,
    L = 76,
    M = 77,
    N = 78,
    O = 79,
    P = 80,
    Q = 81,
    R = 82,
    S = 83,
    T = 84,
    U = 85,
    V = 86,
    W = 87,
    X = 88,
    Y = 89,
    Z = 90,
    CONTEXT_MENU = 93,
    NUMPAD0 = 96,
    NUMPAD1 = 97,
    NUMPAD2 = 98,
    NUMPAD3 = 99,
    NUMPAD4 = 100,
    NUMPAD5 = 101,
    NUMPAD6 = 102,
    NUMPAD7 = 103,
    NUMPAD8 = 104,
    NUMPAD9 = 105,
    MULTIPLY = 106,
    ADD = 107,
    SEPARATOR = 108,
    SUBTRACT = 109,
    DECIMAL = 110,
    DIVIDE = 111,
    F1 = 112,
    F2 = 113,
    F3 = 114,
    F4 = 115,
    F5 = 116,
    F6 = 117,
    F7 = 118,
    F8 = 119,
    F9 = 120,
    F10 = 121,
    F11 = 122,
    F12 = 123,
    F13 = 124,
    F14 = 125,
    F15 = 126,
    F16 = 127,
    F17 = 128,
    F18 = 129,
    F19 = 130,
    F20 = 131,
    F21 = 132,
    F22 = 133,
    F23 = 134,
    F24 = 135,
    NUM_LOCK = 144,
    SCROLL_LOCK = 145,
    COMMA = 188,
    PERIOD = 190,
    SLASH = 191,
    BACK_QUOTE = 192,
    OPEN_BRACKET = 219,
    BACK_SLASH = 220,
    CLOSE_BRACKET = 221,
    QUOTE = 222,
    META = 224,
}

export function keycodeToImgName(keyCode: KeyCode): string {
    switch (keyCode) {
        case KeyCode.DOM_VK_CANCEL:
        case KeyCode.HELP:
        case KeyCode.CLEAR:
        case KeyCode.MULTIPLY:
        case KeyCode.ADD:
        case KeyCode.SEPARATOR:
        case KeyCode.SUBTRACT:
        case KeyCode.DECIMAL:
        case KeyCode.DIVIDE:
        case KeyCode.F13:
        case KeyCode.F14:
        case KeyCode.F15:
        case KeyCode.F16:
        case KeyCode.F17:
        case KeyCode.F18:
        case KeyCode.F19:
        case KeyCode.F20:
        case KeyCode.F21:
        case KeyCode.F22:
        case KeyCode.F23:
        case KeyCode.F24:
        case KeyCode.META:
            throw new Error('wtf');
        case KeyCode.BACK_SPACE:
            return 'backspace';
        case KeyCode.TAB:
            return 'tab';
        case KeyCode.ENTER:
        case KeyCode.RETURN:
            return 'enter';
        case KeyCode.SHIFT:
            return 'shift';
        case KeyCode.CONTROL:
            return 'ctrl';
        case KeyCode.ALT:
            return 'alt';
        case KeyCode.PAUSE:
            return 'pause';
        case KeyCode.CAPS_LOCK:
            return 'capslock';
        case KeyCode.ESCAPE:
            return 'esc';
        case KeyCode.SPACE:
            return 'spacebar';
        case KeyCode.PAGE_UP:
            return 'page-up';
        case KeyCode.PAGE_DOWN:
            return 'page-down';
        case KeyCode.END:
            return 'end';
        case KeyCode.HOME:
            return 'home';
        case KeyCode.LEFT:
            return 'cursor-left';
        case KeyCode.UP:
            return 'cursor-up';
        case KeyCode.RIGHT:
            return 'cursor-right';
        case KeyCode.DOWN:
            return 'cursor-down';
        case KeyCode.PRINTSCREEN:
            return 'print';
        case KeyCode.INSERT:
            return 'insert';
        case KeyCode.DELETE:
            return 'delete';
        case KeyCode.NUM_0:
        case KeyCode.NUM_1:
        case KeyCode.NUM_2:
        case KeyCode.NUM_3:
        case KeyCode.NUM_4:
        case KeyCode.NUM_5:
        case KeyCode.NUM_6:
        case KeyCode.NUM_7:
        case KeyCode.NUM_8:
        case KeyCode.NUM_9:
            return (keyCode - KeyCode.NUM_0).toString();
        case KeyCode.SEMICOLON:
            return 'semicolon-dble';
        case KeyCode.EQUALS:
            return 'equals-plus';
        case KeyCode.A:
        case KeyCode.B:
        case KeyCode.C:
        case KeyCode.D:
        case KeyCode.E:
        case KeyCode.F:
        case KeyCode.G:
        case KeyCode.H:
        case KeyCode.I:
        case KeyCode.J:
        case KeyCode.K:
        case KeyCode.L:
        case KeyCode.M:
        case KeyCode.N:
        case KeyCode.O:
        case KeyCode.P:
        case KeyCode.Q:
        case KeyCode.R:
        case KeyCode.S:
        case KeyCode.T:
        case KeyCode.U:
        case KeyCode.V:
        case KeyCode.W:
        case KeyCode.X:
        case KeyCode.Y:
        case KeyCode.Z:
            return String.fromCharCode(keyCode - KeyCode.A + 'a'.charCodeAt(0));
        case KeyCode.CONTEXT_MENU:
            return 'context-menu';
        case KeyCode.NUMPAD0:
        case KeyCode.NUMPAD1:
        case KeyCode.NUMPAD2:
        case KeyCode.NUMPAD3:
        case KeyCode.NUMPAD4:
        case KeyCode.NUMPAD5:
        case KeyCode.NUMPAD6:
        case KeyCode.NUMPAD7:
        case KeyCode.NUMPAD8:
        case KeyCode.NUMPAD9:
            return 'keypad-' + (keyCode - KeyCode.NUMPAD0);
        case KeyCode.F1:
        case KeyCode.F2:
        case KeyCode.F3:
        case KeyCode.F4:
        case KeyCode.F5:
        case KeyCode.F6:
        case KeyCode.F7:
        case KeyCode.F8:
        case KeyCode.F9:
        case KeyCode.F10:
        case KeyCode.F11:
        case KeyCode.F12:
            return 'f' + (keyCode + 1 - KeyCode.F1);
        case KeyCode.NUM_LOCK:
            return 'num-lock';
        case KeyCode.SCROLL_LOCK:
            return 'scroll-lock';
        case KeyCode.COMMA:
            return 'comma';
        case KeyCode.PERIOD:
            return 'period-gt';
        case KeyCode.SLASH:
            return 'slash-questionmark';
        case KeyCode.BACK_QUOTE:
            return 'apostroph';
        case KeyCode.OPEN_BRACKET:
            return 'bracket-open';
        case KeyCode.BACK_SLASH:
            return 'backslash';
        case KeyCode.CLOSE_BRACKET:
            return 'closebracket';
        case KeyCode.QUOTE:
            return 'comma';
    }
}

const imgStore: Map<string, HTMLImageElement> = new Map<string, HTMLImageElement>();

export function keyCode2Image(keyCode: KeyCode): HTMLImageElement {
    const name = keycodeToImgName(keyCode);
    if (!imgStore.has(name)) {
        const img = new Image();
        img.src = require('../assets/keyboard-keys/' + name + '.png');
        imgStore.set(name, img);
    }
    return imgStore.get(name)!;
}

export function polygonsOverlap(a: Flatten.Polygon, b: Flatten.Polygon) {
    let found = false;
    a.edges.forEach((s: Flatten.Segment) => {
        if (!found && b.contains((s.start))) {
            found = true;
        }
    });

    b.edges.forEach((s: Flatten.Segment) => {
        if (!found && a.contains(s.start)) {
            found = true;
        }
    });

    return found;
}
export function polygonOverlapsShape(a: Flatten.Polygon, shape: Flatten.Shape) {
    if (shape instanceof Flatten.Polygon) {
        return polygonsOverlap(a, shape);
    } else if (shape instanceof Flatten.Segment) {
        return a.contains(shape.start) || a.contains(shape.end) || a.intersect(shape);
    } else if (shape instanceof Flatten.Circle) {
        // (un)fortunately, flatten reports distance of point to polygon's edge, not face which
        // means that there is a >0 distance even if the point is inside the face. Which is
        // what we need here.
        return a.contains(shape.center) || a.distanceTo(shape)[0] <= shape.r;
    } else if (shape instanceof Flatten.Point) {
        return a.contains(shape);
    } else {
        throw new Error('Unknown shape type');
    }
}
