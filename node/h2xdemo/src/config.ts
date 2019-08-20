// http://www.metrication.com/drafting/paper.html

export interface PaperSize {
    name: string;
    height: number;
    width: number;
}

export const PAPER_SIZES: PaperSize[] = [
    { name: 'A0', height: 841, width: 1189 },
    { name: 'A1', height: 594, width: 841 },
    { name: 'A2', height: 420, width: 594 },
    { name: 'A3', height: 297, width: 420 },
    { name: 'A4', height: 210, width: 297 },
    { name: 'A5', height: 149, width: 210 },
    { name: 'RA0', height: 860, width: 1220 },
    { name: 'RA1', height: 610, width: 860 },
    { name: 'RA2', height: 430, width: 610 },
    { name: 'RA3', height: 305, width: 430 },
    { name: 'RA4', height: 215, width: 305 },
    { name: 'RA5', height: 153, width: 215 },
    { name: 'B0', height: 1000, width: 1414 },
    { name: 'B1', height: 707, width: 1000 },
    { name: 'B2', height: 500, width: 707 },
    { name: 'B3', height: 354, width: 500 },
    { name: 'B4', height: 250, width: 354 },
    { name: 'B5', height: 177, width: 250 },
    { name: 'ANSI A', height: 215.9, width: 279.4 },
    { name: 'ANSI B', height: 279.4, width: 431.8 },
    { name: 'ANSI C', height: 431.8, width: 558.8 },
    { name: 'ANSI D', height: 558.8, width: 863.6 },
    { name: 'ANSI E', height: 863.6, width: 1117.6 },
    { name: 'ARCH A', height: 228.6, width: 304.8 },
    { name: 'ARCH B', height: 304.8, width: 457.2 },
    { name: 'ARCH C', height: 457.2, width: 609.6 },
    { name: 'ARCH D', height: 609.6, width: 914.4 },
    { name: 'ARCH E', height: 914.4, width: 1219.2 },
];

export const DEFAULT_PAPER_SIZE: PaperSize = { name: 'A1', height: 594, width: 841 };

export const DEFAULT_FONT_NAME: string = 'Helvetica';

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
