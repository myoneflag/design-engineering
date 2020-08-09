import { CalculatableEntityConcrete } from "../../../../../common/src/api/document/entities/concrete-entity";
import { DrawingContext } from "../../../../src/htmlcanvas/lib/types";
import { CalculationFilters } from "../../../../src/store/document/types";
import {
    CalculationData,
    CalculationDataType,
    CalculationField
} from "../../../../src/store/document/calculations/calculation-field";
import Flatten from "@flatten-js/core";
import BackedDrawableObject from "../../../../src/htmlcanvas/lib/backed-drawable-object";
import { DEFAULT_FONT_NAME } from "../../../../src/config";
import { getPropertyByString, lighten } from "../../../../src/lib/utils";
import { getFields } from "../../../../src/calculations/utils";
import * as TM from "transformation-matrix";
import { tm2flatten } from "../../../../src/htmlcanvas/lib/utils";
import { TEXT_MAX_SCALE } from "../../../../src/htmlcanvas/objects/pipe";
import { getWarningSignImg, matrixScale, warningSignImg, wrapText } from "../../../../src/htmlcanvas/utils";
import { CalculationContext } from "../../../calculations/types";
import { EntityType } from "../../../../../common/src/api/document/entities/types";
import { CalculationConcrete } from "../../../store/document/calculations/calculation-concrete";
import { NoFlowAvailableReason } from "../../../store/document/calculations/pipe-calculation";
import { assertUnreachable } from "../../../../../common/src/api/config";
import { convertMeasurementSystem } from "../../../../../common/src/lib/measurements";

export interface Calculated {
    drawCalculationBox(
        context: DrawingContext,
        data: CalculationData[],
        dryRun: boolean,
        warnSingOnly: boolean
    ): Flatten.Box;
    measureCalculationBox(context: DrawingContext, data: CalculationData[], forExport: boolean): Array<[TM.Matrix, Flatten.Polygon]>;
    locateCalculationBoxWorld(context: DrawingContext, data: CalculationData[], scale: number): TM.Matrix[];
    getCalculationFields(context: DrawingContext, filters: CalculationFilters): CalculationData[];
    hasWarning(context: DrawingContext): boolean;
    collectCalculations(context: CalculationContext): CalculationConcrete;
}

export const FIELD_HEIGHT = 15;
export const WARNING_HINT_WIDTH = 200;
export const FIELD_FONT_SIZE = 15;
export const SCALE_GRADIENT_MIN = 0.05;

export const WARNING_WIDTH = 45;
export const WARNING_HEIGHT = 35;
export const MIN_SCALE = 0.7;

export function CalculatedObject<
    T extends new (...args: any[]) => Calculated & BackedDrawableObject<CalculatableEntityConcrete>
>(constructor: T) {
    // @ts-ignore abstract class expression limitation in the language. In practice this is fine.
    return class extends constructor implements CalculatedObject {
        calculated: true = true;

        makeDatumText(context: DrawingContext, datum: CalculationData): string | Array<string> {
            if (datum.type === CalculationDataType.VALUE) {
                const convFun = datum.convert || convertMeasurementSystem;
                const [units, value] = convFun(context.doc.drawing.metadata.units, datum.units, datum.value);

                if (value === undefined) {
                    throw new Error(
                        "undefined value: " +
                            JSON.stringify(datum) +
                            " " +
                            JSON.stringify(this.globalStore.get(datum.attachUid)!.entity)
                    );
                }

                let numberText: string;
                if (datum.format) {
                    numberText = datum.format(value);
                } else {
                    const fractionDigits = datum.significantDigits === undefined ? 3 : datum.significantDigits;

                    if (typeof value === 'string') {
                        numberText = value;
                    } else {
                        numberText = value === null ? "??" : value.toFixed(fractionDigits);
                    }
                }
                
                const calc = context.globalStore.getCalculation(this.entity);
                const text = numberText + " " + (datum.hideUnits ? "" : units + " ") + datum.short;

                const manufacturer = calc && 'manufacturer' in calc && calc.manufacturer && `${calc.manufacturer}` || ''; 
                if (datum.property === "circulationPressureLoss" && manufacturer) {
                    return [
                        manufacturer,
                        text,
                    ];
                }

                return text;
            } else {
                return datum.message;
            }
        }

        drawWarningSignOnly(context: DrawingContext, dryRun: boolean): Flatten.Box {
            this.withWorldAngle(context, { x: 0, y: 0 }, () => {
                if (!dryRun) {
                    context.ctx.drawImage(
                        getWarningSignImg(),
                        -WARNING_WIDTH / 2,
                        -WARNING_HEIGHT / 2,
                        WARNING_WIDTH,
                        WARNING_HEIGHT
                    );
                }
            });

            return new Flatten.Box(-WARNING_WIDTH / 2, -WARNING_HEIGHT / 2, WARNING_WIDTH, WARNING_HEIGHT);
        }

        drawCalculationBox(
            context: DrawingContext,
            data: CalculationData[],
            dryRun: boolean = false,
            warnSignOnly: boolean = false,
            forExport: boolean = false
        ): Flatten.Box {
            if (warnSignOnly ) {
                return this.drawWarningSignOnly(context, dryRun);
            }

            const { ctx, vp } = context;

            // ctx.fillText(this.entity.calculation!.realNominalPipeDiameterMM!.toPrecision(2), 0, 0);
            
            let height = 0;
            let maxWidth = 0;
            for (let i = data.length - 1; i >= 0; i--) {
                const datum = data[i];

                if (datum.type === CalculationDataType.VALUE) {
                    ctx.font = (datum.bold ? "bold " : "") + FIELD_FONT_SIZE + "px " + DEFAULT_FONT_NAME;
                    height += (datum.fontMultiplier === undefined ? 1 : datum.fontMultiplier) * FIELD_FONT_SIZE;
                } else {
                    ctx.font = FIELD_FONT_SIZE + "px " + DEFAULT_FONT_NAME;
                    height += FIELD_FONT_SIZE;
                }

                const text = this.makeDatumText(context, datum);
                if (Array.isArray(text)) {
                    for (let i2 = 0; i2 < text.length; i2++) {
                        const metrics = ctx.measureText(text[i2]);
                        maxWidth = Math.max(maxWidth, metrics.width);
                    }

                    height += (FIELD_FONT_SIZE * (text.length - 1));
                } else {
                    const metrics = ctx.measureText(text);
                    maxWidth = Math.max(maxWidth, metrics.width);
                }
            }

            const calculation = context.globalStore.getCalculation(this.entity);
            if (this.hasWarning(context) && !forExport) {
                const warnWidth = ctx.measureText(calculation!.warning!);
                maxWidth = Math.max(maxWidth, Math.min(WARNING_HINT_WIDTH, warnWidth.width));
            }

            let warnHeight = 0;
            if (this.hasWarning(context) && !forExport) {
                ctx.font = "bold " + FIELD_FONT_SIZE + "px " + DEFAULT_FONT_NAME;
                warnHeight = wrapText(ctx, calculation!.warning!, 0, 0, maxWidth, FIELD_HEIGHT, true);
                height += warnHeight;
            }
            let y = height / 2;

            const box = new Flatten.Box(-maxWidth / 2, -height / 2, maxWidth / 2, height / 2);

            if (this.hasWarning(context) && !forExport) {
                box.xmin -= WARNING_WIDTH;
            }

            if (!dryRun) {
                ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
                ctx.strokeStyle = "#000";
                if (this.hasWarning(context) && !forExport) {
                    ctx.fillStyle = "rgba(255,215,0, 0.8)";
                }
                ctx.fillRect(-maxWidth / 2, -height / 2, maxWidth, height);

                ctx.font = FIELD_FONT_SIZE + "px " + DEFAULT_FONT_NAME;
                ctx.fillStyle = "#000";

                if (this.hasWarning(context) && !forExport) {
                    ctx.fillStyle = "#000";
                    ctx.font = "bold " + FIELD_FONT_SIZE + "px " + DEFAULT_FONT_NAME;

                    y -= wrapText(
                        ctx,
                        calculation!.warning!,
                        -maxWidth / 2,
                        y - warnHeight + FIELD_HEIGHT,
                        maxWidth,
                        FIELD_HEIGHT
                    );

                    ctx.drawImage(
                        getWarningSignImg(),
                        -maxWidth / 2 - WARNING_WIDTH,
                        -WARNING_HEIGHT / 2,
                        WARNING_WIDTH,
                        WARNING_HEIGHT
                    );
                }

                for (let i = data.length - 1; i >= 0; i--) {
                    const datum = data[i];

                    let multiplier = 1;
                    if (datum.type === CalculationDataType.VALUE) {
                        multiplier = datum.fontMultiplier === undefined ? 1 : datum.fontMultiplier!;
                        ctx.font =
                            (datum.bold ? "bold " : "") +
                            (multiplier * FIELD_FONT_SIZE).toFixed(0) +
                            "px " +
                            DEFAULT_FONT_NAME;
                    } else {
                        ctx.font = (multiplier * FIELD_FONT_SIZE).toFixed(0) + "px " + DEFAULT_FONT_NAME;
                    }

                    ctx.fillStyle = "#000";

                    if (datum.systemUid) {
                        const col = context.doc.drawing.metadata.flowSystems.find((s) => s.uid === data[i].systemUid)!
                            .color;
                        ctx.fillStyle = lighten(col.hex, -20);
                    }

                    const text = this.makeDatumText(context, data[i]);
                    if (Array.isArray(text)) {
                        for (let i2 = 0; i2 < text.length; i2++) {
                            ctx.fillText(text[i2], -maxWidth / 2, y);
                            y -= multiplier * FIELD_HEIGHT;
                        }
                    } else {
                        ctx.fillText(text, -maxWidth / 2, y);
                        y -= multiplier * FIELD_HEIGHT;
                    }
                }

                // line to
                const boxShape = new Flatten.Polygon();
                const worldMin = vp.toWorldCoord(
                    TM.applyToPoint(context.vp.currToScreenTransform(ctx), { x: box.xmin, y: box.ymin })
                );
                const worldMax = vp.toWorldCoord(
                    TM.applyToPoint(context.vp.currToScreenTransform(ctx), { x: box.xmax, y: box.ymax })
                );
                if (this.hasWarning(context) && !forExport) {
                    worldMin.x -= WARNING_WIDTH;
                }
                const worldBox = new Flatten.Box(
                    Math.min(worldMin.x, worldMax.x),
                    Math.min(worldMin.y, worldMax.y),
                    Math.max(worldMin.x, worldMax.x),
                    Math.max(worldMin.y, worldMax.y)
                );

                boxShape.addFace(worldBox);
                const line = this.shape()!.distanceTo(boxShape);
                if (!boxShape.contains(line[1].start) || true) {
                    // line is now in world position. Transform line back to current position.
                    const world2curr = TM.transform(
                        TM.inverse(context.vp.currToScreenTransform(ctx)),
                        vp.world2ScreenMatrix
                    );

                    const currLine = line[1].transform(tm2flatten(world2curr));

                    ctx.strokeStyle = "#AAA";
                    ctx.setLineDash([5, 5]);
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(currLine.start.x, currLine.start.y);
                    ctx.lineTo(currLine.end.x, currLine.end.y);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            }

            return box;
        }

        measureCalculationBox(context: DrawingContext, data: CalculationData[], forExport: boolean): Array<[TM.Matrix, Flatten.Polygon]> {
            const s = context.vp.currToSurfaceScale(context.ctx);
            let newScale: number;

            if (s > TEXT_MAX_SCALE) {
                newScale = 1 / TEXT_MAX_SCALE;
            } else if (s > SCALE_GRADIENT_MIN) {
                newScale =
                    (1 * (s - SCALE_GRADIENT_MIN) + 0.7 * (TEXT_MAX_SCALE - s)) /
                    (TEXT_MAX_SCALE - SCALE_GRADIENT_MIN) /
                    s;
            } else {
                newScale = MIN_SCALE / s;
            }

            const locs: TM.Matrix[] = this.locateCalculationBoxWorld(context, data, newScale);
            const box = this.drawCalculationBox(context, data, true, false, forExport);

            return locs.map((loc) => {
                let p = new Flatten.Polygon();
                p.addFace(box);
                p = p.transform(tm2flatten(loc));
                return [loc, p];
            });
        }

        getCalculationFields(context: DrawingContext, filters: CalculationFilters): CalculationData[] {
            const filter = filters[this.entity.type].filters;
            const calculation = context.globalStore.getCalculation(this.entity);

            const res: CalculationData[] = [];

            if (this.entity.type === EntityType.PIPE) {
                const pCalc = context.globalStore.getCalculation(this.entity);
                if (pCalc && !pCalc.totalPeakFlowRateLS && pCalc.realNominalPipeDiameterMM === null) {
                    let ambiguousMessage = "NOT CALCULATED";
                    if (pCalc.noFlowAvailableReason) {
                        switch (pCalc.noFlowAvailableReason) {
                            case NoFlowAvailableReason.NO_SOURCE:
                                ambiguousMessage = "NO FLOW SOURCE";
                                break;
                            case NoFlowAvailableReason.NO_LOADS_CONNECTED:
                                ambiguousMessage = "NO FIXTURES CONNECTED";
                                break;
                            case NoFlowAvailableReason.TOO_MANY_FLOW_SOURCES:
                                ambiguousMessage = "MULTIPLE FLOW SOURCES";
                                break;
                            case NoFlowAvailableReason.UNUSUAL_CONFIGURATION:
                                ambiguousMessage = "UNUSUAL CONFIGURATION";
                                break;
                            case NoFlowAvailableReason.NO_ISOLATION_VALVES_ON_MAIN:
                                ambiguousMessage = "NO ISOLATION VALVES ON MAIN";
                                break;
                            case NoFlowAvailableReason.LOADING_UNITS_OUT_OF_BOUNDS:
                                ambiguousMessage = "LOADING UNITS OUT OF BOUNDS";
                                break;
                            case NoFlowAvailableReason.NO_SUITABLE_PIPE_SIZE:
                                ambiguousMessage = "NO SUITABLE PIPE SIZE";
                                break;
                            case NoFlowAvailableReason.INVALID_RETURN_NETWORK:
                                ambiguousMessage = 'INVALID RETURN NETWORK';
                                break;
                            case NoFlowAvailableReason.GAS_SUPPLY_PRESSURE_TOO_LOW:
                                ambiguousMessage = 'GAS SUPPLY PRESSURE TOO LOW';
                                break;
                            default:
                                assertUnreachable(pCalc.noFlowAvailableReason);
                        }
                    }
                    res.push(
                        {
                            message: ambiguousMessage,
                            attachUid: this.uid,
                            type: CalculationDataType.MESSAGE,
                            systemUid: this.entity.systemUid
                        }
                    );

                    // There was a problem with the calculation or it is misconfigured and needs adjustment
                    // before the calculations are useful
                    if (pCalc.totalPeakFlowRateLS === null) {
                        return res;
                    }
                }
            }

            res.push(...getFields(this.entity, context.doc, context.globalStore, context.catalog)
                .filter(
                    (f) =>
                        f.title in filter &&
                        filter[f.title].enabled &&
                        getPropertyByString(calculation, f.property, true) !== undefined &&
                        (!f.hideIfNull || getPropertyByString(calculation, f.property, true) !== null)
                )
                .map((f) => {
                    const ret: CalculationData = {
                        ...f,
                        type: CalculationDataType.VALUE,
                        value: getPropertyByString(calculation, f.property, true),
                        attachUid: f.attachUid || this.entity.uid
                    };
                    return ret;
                }));
            return res;
        }

        hasWarning(context: DrawingContext): boolean {
            const calculation = context.globalStore.getCalculation(this.entity);
            if (calculation && calculation.warning === undefined) {
                throw new Error("undefined calculation: " + JSON.stringify(this.entity));
            }
            return calculation !== undefined && calculation.warning !== null;
        }
    };
}
