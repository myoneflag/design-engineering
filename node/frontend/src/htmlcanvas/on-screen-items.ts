import { DEFAULT_FONT_NAME } from "../../src/config";
import * as TM from "transformation-matrix";
import { DrawingContext } from "../../src/htmlcanvas/lib/types";
import {
    addFinalPsdCounts,
    lookupFlowRate,
    PsdUnitsByFlowSystem,
    zeroFinalPsdCounts
} from "../../src/calculations/utils";
import { GridLineMode } from "../store/document/types";
import { Catalog } from "../../../common/src/api/catalog/types";
import { NetworkType } from "../../../common/src/api/document/drawing";
import { convertMeasurementSystem, in2MM, MeasurementSystem, Units } from "../../../common/src/lib/measurements";
import { assertUnreachable, StandardFlowSystemUids } from "../../../common/src/api/config";

const SENSIBLE_UNITS_MM: number[] = [
    1,
    2,
    4,
    5,
    8,
    10,
    20,
    40,
    50,
    80,
    100,
    200,
    400,
    500,
    800,
    1000,
    2000,
    4000,
    5000,
    8000, // 1m to 8m
    10000,
    20000,
    40000,
    50000,
    80000,
    100000,
    200000,
    400000,
    500000,
    800000,
    1000000,
    2000000,
    4000000,
    5000000,
    8000000 // 1km to 8km
];

const SENSIBLE_UNITS_INCH: number[] = [
    1 / 8,
    1 / 4,
    1 / 2,
    1,
    2,
    4,
    6,
    12, // 1 ft
    24,
    36, // 1 yard
    36 * 2,
    36 * 4,
    36 * 8,
    36 * 10,
    36 * 16,
    36 * 20,
    36 * 40,
    36 * 80,
    36 * 160,
    36 * 220,
    36 * 440,
    36 * 880,
    36 * 1760, // 1 mile.
];

const MINOR_GRID_MIN_PX = 20;

export const getFriendlyDistanceUnit = (mm: number): [string, number] => {
    if (mm < 1000) {
        return ["mm", 1];
    }
    mm /= 1000;
    if (mm < 1000) {
        return ["m", 10 * 100];
    }
    return ["km", 10 * 100 * 1000];
};

export const getFriendlyDistanceUnitImperial = (inches: number): [string, number] => {
    if (inches === 1 / 8) {
        return ["/8 in", 1 / 8];
    } else if (inches === 1 / 4) {
        return ["/4 in", 1 / 4];
    } else if (inches === 1 / 2) {
        return ["/2 in", 1 / 2];
    } else if (inches < 36 * 30) {
        return ["in", 1];
    } else if (inches < 36 * 1760) {
        return ["ft", 12];
    } else {
        return ["mi", 36 * 1760];
    }
}

export const drawPaperScale = (
    ctx: CanvasRenderingContext2D,
    measurement: MeasurementSystem,
    pxPerMm: number,
    maxWidthPx: number = 4 * 2 * 50,
    x?: number,
    y?: number
) => {
    const pxPerIn = in2MM(pxPerMm);
    ctx.setTransform(TM.identity());
    ctx.lineWidth = 1;
    // draw on bottom left
    const height = y === undefined ? ctx.canvas.height : y + 50;

    // Draw ruler
    let smallestUnit: number = 0;
    let segments: number = 0;
    let smallestUnitPx: number = 0;
    switch (measurement) {
        case MeasurementSystem.IMPERIAL:
            for (const units of SENSIBLE_UNITS_INCH) {
                if (units * pxPerIn * 30 <= maxWidthPx) {
                    smallestUnit = units;
                    segments = 4;
                }
                if (units * pxPerIn * 50 <= maxWidthPx) {
                    smallestUnit = units;
                    segments = 6;
                }
            }
            smallestUnitPx = smallestUnit * pxPerIn;
            break;
        case MeasurementSystem.METRIC:

            for (const units of SENSIBLE_UNITS_MM) {
                if (units * pxPerMm * 30 <= maxWidthPx) {
                    smallestUnit = units;
                    segments = 4;
                }
                if (units * pxPerMm * 50 <= maxWidthPx) {
                    smallestUnit = units;
                    segments = 6;
                }
            }
            smallestUnitPx = smallestUnit * pxPerMm;

            break;
        default:
            assertUnreachable(measurement);
    }
    const smallW = smallestUnitPx;
    const medW = smallW * 5;
    const largeW = smallW * 10;
    const scaleHeight = 10;
    const scaleBottomOffset = 30;

    const scaleLeftEdge = x === undefined ? ctx.canvas.width - maxWidthPx - 10 : x;

    let left: number = scaleLeftEdge;

    for (let i = 0; i < 10; i++) {
        if (i % 2 === 0) {
            ctx.fillStyle = "#000000";
        } else {
            ctx.fillStyle = "#FFFFFF";
        }
        ctx.fillRect(left, height - scaleBottomOffset, smallW, scaleHeight);
        left += smallW;
    }
    for (let i = 0; i < 4; i++) {
        if (i % 2 === 0) {
            ctx.fillStyle = "#000000";
        } else {
            ctx.fillStyle = "#FFFFFF";
        }
        ctx.fillRect(left, height - scaleBottomOffset, medW, scaleHeight);
        left += medW;
    }
    for (let i = 0; i < segments - 4; i++) {
        if (i % 2 === 0) {
            ctx.fillStyle = "#000000";
        } else {
            ctx.fillStyle = "#FFFFFF";
        }
        ctx.fillRect(left, height - scaleBottomOffset, largeW, scaleHeight);
        left += largeW;
    }

    // draw ruler text
    let result = getFriendlyDistanceUnit(smallestUnit * 10);
    switch (measurement) {
        case MeasurementSystem.METRIC:
            break;
        case MeasurementSystem.IMPERIAL:
            result = getFriendlyDistanceUnitImperial(smallestUnit * 10);
            break;
        default:
            assertUnreachable(measurement);
    }
    const [uname, unit] = result;

    left = scaleLeftEdge;
    ctx.beginPath();
    ctx.font = "9px " + DEFAULT_FONT_NAME;
    for (let i = 0; i < segments; i++) {
        if (i % 2 === 0) {
            ctx.fillStyle = "#000000";
        } else {
            ctx.fillStyle = "#FFFFFF";
        }
        ctx.strokeStyle = "#000000";
        ctx.moveTo(left, height - 32);
        ctx.lineTo(left, height - scaleBottomOffset + scaleHeight + 2);
        ctx.fillStyle = "#000000";

        const digits = ("" + ((smallestUnit * 10) / unit * i)).length;

        if (i === segments - 1 || segments === 4 || (segments === 5 && digits < 3 || (segments === 6 && digits < 2))) {
            ctx.fillText(((smallestUnit * 10) / unit) * i + ' ' + uname, left, height - scaleBottomOffset - 5);
        } else {
            ctx.fillText("" + ((smallestUnit * 10) / unit) * i, left, height - scaleBottomOffset - 5);
        }
        left += largeW;
    }

    ctx.rect(scaleLeftEdge, height - scaleBottomOffset, smallW * 10 * (segments - 1), scaleHeight);
    ctx.stroke();
};

export function drawGridLines(context: DrawingContext) {
    const scalesMM = [1, 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000];
    const { ctx, vp } = context;

    if (context.doc.uiState.gridLines === GridLineMode.FULL) {
        // Minor grid lines
        let minorI = 0;
        for (let i = 0; i < scalesMM.length; i++) {
            if (vp.toScreenLength(scalesMM[i]) > MINOR_GRID_MIN_PX) {
                minorI = i;
                break;
            }
        }
        if (minorI === scalesMM.length - 1) {
            return;
        }
        const majorI = minorI + 1;

        const tl = vp.toWorldCoord({ x: 0, y: 0 });
        const br = vp.toWorldCoord({ x: context.vp.width, y: context.vp.height });
        const minorGap = vp.toScreenLength(scalesMM[minorI]);
        const majorGap = vp.toScreenLength(scalesMM[majorI]);
        const left = tl.x - (tl.x % scalesMM[minorI]);
        const top = tl.y - (tl.y % scalesMM[minorI]);

        const leftMajor = tl.x - (tl.x % scalesMM[majorI]);
        const topMajor = tl.y - (tl.y % scalesMM[majorI]);

        const tlS = vp.toScreenCoord({ x: left, y: top });
        const tlMS = vp.toScreenCoord({ x: leftMajor, y: topMajor });

        ctx.setTransform(TM.identity());

        ctx.strokeStyle = "rgba(100, 100, 200, 0.5)";
        ctx.lineWidth = 1;

        let grids = 0;

        if (minorGap > 50) {
            for (let x = tlS.x; x <= vp.width; x += minorGap) {
                grids++;
                ctx.beginPath();
                ctx.moveTo(Math.round(x), 0);
                ctx.lineTo(Math.round(x), vp.height);
                ctx.stroke();
            }

            for (let y = tlS.y; y <= vp.height; y += minorGap) {
                grids++;
                ctx.beginPath();
                ctx.moveTo(0, Math.round(y));
                ctx.lineTo(vp.width, Math.round(y));
                ctx.stroke();
            }
        }

        ctx.strokeStyle = "rgba(0, 0, 150, 0.5)";
        ctx.setLineDash([]);
        ctx.lineWidth = 1;

        for (let x = tlMS.x; x <= vp.width; x += majorGap) {
            grids++;
            ctx.beginPath();
            ctx.moveTo(Math.round(x), 0);
            ctx.lineTo(Math.round(x), vp.height);
            ctx.stroke();
        }

        for (let y = tlMS.y; y <= vp.height; y += majorGap) {
            grids++;
            ctx.beginPath();
            ctx.moveTo(0, Math.round(y));
            ctx.lineTo(vp.width, Math.round(y));
            ctx.stroke();
        }

        ctx.setLineDash([]);
    } else if (context.doc.uiState.gridLines === GridLineMode.ORIGIN) {
        const origin = vp.toScreenCoord({ x: 0, y: 0 });

        ctx.strokeStyle = "rgba(0, 0, 150, 0.5)";
        ctx.setLineDash([]);
        ctx.lineWidth = 1;
        ctx.setTransform(TM.identity());
        if (origin.x > 0 && origin.x <= vp.width) {
            ctx.beginPath();
            ctx.moveTo(origin.x, 0);
            ctx.lineTo(origin.x, vp.height);
            ctx.stroke();
        }

        if (origin.y > 0 && origin.y <= vp.height) {
            ctx.beginPath();
            ctx.moveTo(0, origin.y);
            ctx.lineTo(vp.width, origin.y);
            ctx.stroke();
        }
    }
}

export function drawLoadingUnits(
    context: DrawingContext,
    catalog: Catalog,
    focusedUnits: PsdUnitsByFlowSystem | null,
    projectUnits: PsdUnitsByFlowSystem | null,
    selection: boolean = false
) {
    if (focusedUnits == null) {
        focusedUnits = {
            /**/
        };
    }
    if (projectUnits == null) {
        projectUnits = {

        };
    }

    for (const sys of [
        StandardFlowSystemUids.ColdWater,
        StandardFlowSystemUids.WarmWater,
        StandardFlowSystemUids.HotWater
    ]) {
        for (const units of [focusedUnits, projectUnits]) {
            if (!units.hasOwnProperty(sys)) {
                units[sys] = zeroFinalPsdCounts();
            }
        }
    }
    const ctx = context.ctx;

    const height = ctx.canvas.height;

    const psduSuffix = "PSD";

    const y = height - 120;

    ctx.font = "12px " + DEFAULT_FONT_NAME;
    ctx.fillStyle = "#000000";

    // Fill for selection
    if (selection) {
        ctx.fillText("PSD:    Selection            Project", 40, y - 20);
    } else {
        ctx.fillText("PSD:    Level                  Project", 40, y - 20);
    }

    let x = 80;
    for (const units of [focusedUnits, projectUnits]) {
        let coldFR: number | null | undefined;
        let hotFR: number | null | undefined;
        try {
            const res = lookupFlowRate(
                units[StandardFlowSystemUids.ColdWater],
                context.doc,
                catalog,
                StandardFlowSystemUids.ColdWater,
                true
            );
            coldFR = res ? res.flowRateLS : null;
        } catch (e) {
            // Exception here
        }
        try {
            const res = lookupFlowRate(
                addFinalPsdCounts(units[StandardFlowSystemUids.HotWater], units[StandardFlowSystemUids.WarmWater]),
                context.doc,
                catalog,
                StandardFlowSystemUids.HotWater,
                true
            );
            hotFR = res ? res.flowRateLS : null;
        } catch (e) {
            /**/
        }

        let coldSpareText: string = "error";
        let hotSpareText: string = "error";
        let coldText: string = "error";
        let hotText: string = "error";
        let coldUnits: Units | string = '';
        let hotUnits: Units | string = '';
        if (coldFR != null) {
            let coldFRSpare: number | string | null =
                coldFR *
                (1 +
                    0.01 *
                    context.doc.drawing.metadata.flowSystems.find((s) => s.uid === StandardFlowSystemUids.ColdWater)!
                        .networks[NetworkType.RETICULATIONS].spareCapacityPCT);

            [coldUnits, coldFRSpare] =
                convertMeasurementSystem(context.doc.drawing.metadata.units, Units.LitersPerSecond, coldFRSpare);
            coldSpareText = Number(coldFRSpare).toPrecision(3);
            coldText = coldFR.toPrecision(3);
        }
        if (hotFR != null) {
            let hotFRSpare: number | string | null =
                hotFR *
                (1 +
                    0.01 *
                    context.doc.drawing.metadata.flowSystems.find((s) => s.uid === StandardFlowSystemUids.WarmWater)!
                        .networks[NetworkType.RETICULATIONS].spareCapacityPCT);
            [hotUnits, hotFRSpare] =
                convertMeasurementSystem(context.doc.drawing.metadata.units, Units.LitersPerSecond, hotFRSpare);
            hotSpareText = Number(hotFRSpare).toPrecision(3);
            hotText = hotFR.toPrecision(3);
        }
        ctx.fillText(coldSpareText + " " + coldUnits + " ", x, y);

        ctx.fillText(hotSpareText + " " + hotUnits + " ", x, y + 20);

        x += 90;
    }

    ctx.fillText("Cold: ", 20, y);
    ctx.fillText("Hot: ", 20, y + 20);
    ctx.font = "10px " + DEFAULT_FONT_NAME;
    let psdMethodName = catalog.psdStandards[context.doc.drawing.metadata.calculationParams.psdMethod].name;
    if (context.doc.drawing.metadata.calculationParams.dwellingMethod) {
        psdMethodName = catalog.dwellingStandards[context.doc.drawing.metadata.calculationParams.dwellingMethod].name;
    }
    ctx.fillText(psdMethodName, 20, y + 40);
    ctx.fillText("Inc. Continuous Flow", 20, y + 50);
    ctx.fillText("Inc. Reticulation Spare Capacity", 20, y + 60);
}

const MAX_WORLD_PX_DEVIATION = 1;

export function isSameWorldPX(a: number, b: number): boolean {
    return Math.abs(a - b) < MAX_WORLD_PX_DEVIATION;
}
