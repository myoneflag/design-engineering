//http://www.metrication.com/drafting/paper.html
/*

A0	 841 mm x 1189 mm
A1	 594 mm x  841 mm
A2	 420 mm x  594 mm
A3	 297 mm x  420 mm
A4	 210 mm x  297 mm
A5	 149 mm x  210 mm

RA0	 860 mm x 1220 mm
RA1	 610 mm x  860 mm
RA2	 430 mm x  610 mm
RA3	 305 mm x  430 mm
RA4	 215 mm x  305 mm
RA5	 153 mm x  215 mm

B0	1000 mm x 1414 mm
B1	 707 mm x 1000 mm
B2	 500 mm x  707 mm
B3	 354 mm x  500 mm
B4	 250 mm x  354 mm
B5	 177 mm x  250 mm

ANSI A	 215.9 mm x  279.4 mm	8.5" x 11"
ANSI B	 279.4 mm x  431.8 mm	11" x 17"
ANSI C	 431.8 mm x  558.8 mm	17" x 22"
ANSI D	 558.8 mm x  863.6 mm	22" x 34"
ANSI E	 863.6 mm x 1117.6 mm	34" x 44"

ARCH A	 228.6 mm x  304.8 mm	 9" X 12"
ARCH B	 304.8 mm x  457.2 mm	12" X 18"
ARCH C	 457.2 mm x  609.6 mm	18" X 24"
ARCH D	 609.6 mm x  914.4 mm	24" X 36"
ARCH E	 914.4 mm x 1219.2 mm	36" X 48"

 */

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
