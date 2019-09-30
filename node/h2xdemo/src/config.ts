// http://www.metrication.com/drafting/paper.html
import {Choice} from '@/lib/types';

export interface PaperSize {
    name: string;
    heightMM: number;
    widthMM: number;
}

export const PAPER_SIZES: PaperSize[] = [
    { name: 'A0', heightMM: 841, widthMM: 1189 },
    { name: 'A1', heightMM: 594, widthMM: 841 },
    { name: 'A2', heightMM: 420, widthMM: 594 },
    { name: 'A3', heightMM: 297, widthMM: 420 },
    { name: 'A4', heightMM: 210, widthMM: 297 },
    { name: 'A5', heightMM: 149, widthMM: 210 },
    { name: 'RA0', heightMM: 860, widthMM: 1220 },
    { name: 'RA1', heightMM: 610, widthMM: 860 },
    { name: 'RA2', heightMM: 430, widthMM: 610 },
    { name: 'RA3', heightMM: 305, widthMM: 430 },
    { name: 'RA4', heightMM: 215, widthMM: 305 },
    { name: 'RA5', heightMM: 153, widthMM: 215 },
    { name: 'B0', heightMM: 1000, widthMM: 1414 },
    { name: 'B1', heightMM: 707, widthMM: 1000 },
    { name: 'B2', heightMM: 500, widthMM: 707 },
    { name: 'B3', heightMM: 354, widthMM: 500 },
    { name: 'B4', heightMM: 250, widthMM: 354 },
    { name: 'B5', heightMM: 177, widthMM: 250 },
    { name: 'ANSI A', heightMM: 215.9, widthMM: 279.4 },
    { name: 'ANSI B', heightMM: 279.4, widthMM: 431.8 },
    { name: 'ANSI C', heightMM: 431.8, widthMM: 558.8 },
    { name: 'ANSI D', heightMM: 558.8, widthMM: 863.6 },
    { name: 'ANSI E', heightMM: 863.6, widthMM: 1117.6 },
    { name: 'ARCH A', heightMM: 228.6, widthMM: 304.8 },
    { name: 'ARCH B', heightMM: 304.8, widthMM: 457.2 },
    { name: 'ARCH C', heightMM: 457.2, widthMM: 609.6 },
    { name: 'ARCH D', heightMM: 609.6, widthMM: 914.4 },
    { name: 'ARCH E', heightMM: 914.4, widthMM: 1219.2 },
];

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

// These are some temporary configs while we don't have a database yet.
//
export const PSD_METHODS: Choice[] = [
    {name: 'AS3500 2018 Loading Units', key: 'as35002018LoadingUnits'},
    {name: 'AS3500 2018 Dwellings', disabled: true, key: 'as3500D2018Dwellings'},
    {name: 'Barrie\'s Book Loading Units', disabled: true, key: 'barriesBookLoadingUnits'},
    {name: 'Barrie\'s Book Dwellings', disabled: true, key: 'barriesBookDwellings'},
    {name: 'DIN 1988-300 - Residential', disabled: true, key: 'din1988300Residential'},
    {name: 'DIN 1988-300 - Hospital', disabled: true, key: 'din1988300Hospital'},
    {name: 'DIN 1988-300 - Hotel', disabled: true, key: 'din1988300Hotel'},
    {name: 'DIN 1988-300 - School', disabled: true, key: 'din1988300School'},
    {name: 'DIN 1988-300 - Office', disabled: true, key: 'din1988300Office'},
    {name: 'DIN 1988-300 - Assisted Living', disabled: true, key: 'din1988300AssistedLiving'},
    {name: 'DIN 1988-300 - Nursing Home', disabled: true, key: 'din1988300NursingHome'},
    {name: 'BS 806', disabled: true, key: 'BS806'},
    {name: 'CIBSE Guide G', disabled: true, key: 'CIBSEGuideG'},
    {name: 'Uniform Plumbing Code 2018', disabled: true, key: 'UnifromPlumbingCode2018'},
    {name: 'International Plumbing Code 2018', disabled: true, key: 'InternationalPlumbingCode2018'},
];

export const RING_MAIN_CALCULATION_METHODS: Choice[] = [
    {name: 'Flow rate assigned to each fixture as %', disabled: true, key: 'fixturePCT'},
    {name: 'Flow rate assigned to fixtures evenly', disabled: true, key: 'fixtureEven'},
    {name: 'Flow rate assigned to most disadvantaged fixtures', disabled: true, key: 'fixtureDisadvantaged'},
    {name: '99th percentile computer simulated PSD', disabled: true, key: 'monteCarlo'},
];

export const PIPE_SIZING_METHODS: Choice[] = [
    {name: 'Keep maximum velocity within bounds', key: 'velocity'},
    {name: 'Keep maximum pressure drop within bounds', key: 'pressure', disabled: true},
];
