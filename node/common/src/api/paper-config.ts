export interface PaperSize {
    name: string;
    heightMM: number;
    widthMM: number;
}

export const PAPER_SIZES = {
    'A0': {name: 'A0', heightMM: 841, widthMM: 1189},
    'A1': {name: 'A1', heightMM: 594, widthMM: 841},
    'A2': {name: 'A2', heightMM: 420, widthMM: 594},
    'A3': {name: 'A3', heightMM: 297, widthMM: 420},
    'A4': {name: 'A4', heightMM: 210, widthMM: 297},
    'A5': {name: 'A5', heightMM: 149, widthMM: 210},
    'RA0': {name: 'RA0', heightMM: 860, widthMM: 1220},
    'RA1': {name: 'RA1', heightMM: 610, widthMM: 860},
    'RA2': {name: 'RA2', heightMM: 430, widthMM: 610},
    'RA3': {name: 'RA3', heightMM: 305, widthMM: 430},
    'RA4': {name: 'RA4', heightMM: 215, widthMM: 305},
    'RA5': {name: 'RA5', heightMM: 153, widthMM: 215},
    'B0': {name: 'B0', heightMM: 1000, widthMM: 1414},
    'B1': {name: 'B1', heightMM: 707, widthMM: 1000},
    'B2': {name: 'B2', heightMM: 500, widthMM: 707},
    'B3': {name: 'B3', heightMM: 354, widthMM: 500},
    'B4': {name: 'B4', heightMM: 250, widthMM: 354},
    'B5': {name: 'B5', heightMM: 177, widthMM: 250},
    'ANSI A': {name: 'ANSI A', heightMM: 215.9, widthMM: 279.4},
    'ANSI B': {name: 'ANSI B', heightMM: 279.4, widthMM: 431.8},
    'ANSI C': {name: 'ANSI C', heightMM: 431.8, widthMM: 558.8},
    'ANSI D': {name: 'ANSI D', heightMM: 558.8, widthMM: 863.6},
    'ANSI E': {name: 'ANSI E', heightMM: 863.6, widthMM: 1117.6},
    'ARCH A': {name: 'ARCH A', heightMM: 228.6, widthMM: 304.8},
    'ARCH B': {name: 'ARCH B', heightMM: 304.8, widthMM: 457.2},
    'ARCH C': {name: 'ARCH C', heightMM: 457.2, widthMM: 609.6},
    'ARCH D': {name: 'ARCH D', heightMM: 609.6, widthMM: 914.4},

};
export const SENSIBLE_SCALES = [
    [1, 2000],
    [1, 1500],
    [1, 1000],
    [1, 750],
    [1, 500],
    [1, 250],
    [1, 200],
    [1, 150],
    [1, 100],
    [1, 75],
    [1, 50],
    [1, 25],
    [1, 10],
];
