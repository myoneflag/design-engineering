import {DEFAULT_FONT_NAME, isGermanStandard} from '@/config';
import * as TM from 'transformation-matrix';
import {DrawingContext} from '@/htmlcanvas/lib/types';
import {Catalog} from '@/store/catalog/types';
import {lookupFlowRate, PsdUnitsByFlowSystem} from '@/calculations/utils';
import {StandardFlowSystemUids} from '@/store/catalog';

const SENSIBLE_UNITS_MM: number[] = [
    1, 2, 4, 5, 8,
    10, 20, 40, 50, 80,
    100, 200, 400, 500, 800,
    1000, 2000, 4000, 5000, 8000, // 1m to 8m
    10000, 20000, 40000, 50000, 80000,
    100000, 200000, 400000, 500000, 800000,
    1000000, 2000000, 4000000, 5000000, 8000000, // 1km to 8km
];

export const getFriendlyDistanceUnit = (mm: number): [string, number] => {
    if (mm < 10) {
        return  ['mm', 1];
    }
    mm /= 10;
    if (mm < 100) {
        return ['cm', 10];
    }
    mm /= 100;
    if (mm < 1000) {
        return ['m', 10 * 100];
    }
    return ['km', 10 * 100 * 1000];
};

export const drawPaperScale = (ctx: CanvasRenderingContext2D, pxPerMm: number) => {
    ctx.setTransform(TM.identity());
    ctx.lineWidth = 1;
    // draw on bottom left
    const height = ctx.canvas.height;

    // Draw ruler
    const minSmallWidth = 4;
    let smallestUnit: number = 0;
    for (const units of SENSIBLE_UNITS_MM) {
        if (units * pxPerMm >= minSmallWidth) {
            smallestUnit = units;
            break;
        }
    }

    const smallW = smallestUnit * pxPerMm;
    const medW = smallW * 5;
    const largeW = smallW * 10;
    const scaleHeight = 10;
    const scaleBottomOffset = 30;


    const scaleLeftEdge = ctx.canvas.width - minSmallWidth * 2 * 50 - 10;

    let left: number = scaleLeftEdge;


    for (let i = 0; i < 10; i++) {
        if (i % 2 === 0) {
            ctx.fillStyle = '#000000';
        } else {
            ctx.fillStyle = '#FFFFFF';
        }
        ctx.fillRect(left, height - scaleBottomOffset, smallW, scaleHeight);
        left += smallW;
    }
    for (let i = 0; i < 4; i++) {
        if (i % 2 === 0) {
            ctx.fillStyle = '#000000';
        } else {
            ctx.fillStyle = '#FFFFFF';
        }
        ctx.fillRect(left, height - scaleBottomOffset, medW, scaleHeight);
        left += medW;
    }
    for (let i = 0; i < 2; i++) {
        if (i % 2 === 0) {
            ctx.fillStyle = '#000000';
        } else {
            ctx.fillStyle = '#FFFFFF';
        }
        ctx.fillRect(left, height - scaleBottomOffset, largeW, scaleHeight);
        left += largeW;
    }

    // draw ruler text
    const [uname, unit] = getFriendlyDistanceUnit(smallestUnit * 10);
    left = scaleLeftEdge;
    ctx.beginPath();
    ctx.font = '9px ' + DEFAULT_FONT_NAME;
    for (let i = 0; i < 6; i++) {
        if (i % 2 === 0) {
            ctx.fillStyle = '#000000';
        } else {
            ctx.fillStyle = '#FFFFFF';
        }
        ctx.strokeStyle = '#000000';
        ctx.moveTo(left, height - 32);
        ctx.lineTo(left, height - scaleBottomOffset + scaleHeight + 2);
        ctx.fillStyle = '#000000';

        ctx.fillText((smallestUnit * 10 / unit * i) + uname, left, height - scaleBottomOffset - 5);
        left += largeW;
    }

    ctx.rect(     scaleLeftEdge, height - scaleBottomOffset, smallW * 50, scaleHeight);
    ctx.stroke();
};

export function drawLoadingUnits(
    context: DrawingContext,
    catalog: Catalog,
    units: PsdUnitsByFlowSystem | null,
    selection: boolean = false,
) {
    if (units == null) {
        units = {};
        units[StandardFlowSystemUids.ColdWater] = {units: 0, continuousFlowLS: 0};
        units[StandardFlowSystemUids.HotWater] = {units: 0, continuousFlowLS: 0};
    }
    const ctx = context.ctx;


    const height = ctx.canvas.height;

    const psduSuffix = 'PSD';

    let y = height - 100;

    ctx.font = '12px ' + DEFAULT_FONT_NAME;
    ctx.fillStyle = '#000000';

    if (selection) {
        ctx.fillText('(In Selection)', 20, y - 20);
    } else {
        ctx.fillText('Total PSD: w/Space Capacity (w/o)', 20, y - 20);
    }

    const coldFR = lookupFlowRate(units[StandardFlowSystemUids.ColdWater].units, context.doc, catalog)!;
    const hotFR = lookupFlowRate(units[StandardFlowSystemUids.HotWater].units, context.doc, catalog)!;
    const coldFRSpare = coldFR * (1 + 0.01 * context.doc.drawing.flowSystems.find((s) => s.uid === StandardFlowSystemUids.ColdWater)!.spareCapacity);
    const hotFRSpare = hotFR * (1 + 0.01 * context.doc.drawing.flowSystems.find((s) => s.uid === StandardFlowSystemUids.WarmWater)!.spareCapacity);

    ctx.fillText('Cold: ', 20, y);
    ctx.fillText((coldFR ? coldFRSpare.toPrecision(3) : 0) + ' L/s ', 80, y);
    ctx.fillText('(' + (coldFR.toPrecision(3)) + ')', 180, y);


    ctx.fillText('Hot: ', 20, y + 20);
    ctx.fillText((hotFR ? hotFRSpare.toPrecision(3) : 0) + ' L/s ', 80, y + 20);
    ctx.fillText('(' + (hotFR.toPrecision(3)) + ')', 180, y + 20);

    ctx.fillText(catalog.psdStandards[context.doc.drawing.calculationParams.psdMethod].name, 20, y + 40);
}
