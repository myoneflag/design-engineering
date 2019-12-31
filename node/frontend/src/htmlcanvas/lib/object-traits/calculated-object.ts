import {CalculatableEntityConcrete, CalculationConcrete} from '../../../../src/store/document/entities/concrete-entity';
import {DrawingContext} from '../../../../src/htmlcanvas/lib/types';
import {CalculationFilters} from '../../../../src/store/document/types';
import {CalculationData, CalculationDataType} from '../../../../src/store/document/calculations/calculation-field';
import Flatten from '@flatten-js/core';
import BackedDrawableObject from '../../../../src/htmlcanvas/lib/backed-drawable-object';
import {DEFAULT_FONT_NAME} from '../../../../src/config';
import {getPropertyByString, lighten} from '../../../../src/lib/utils';
import {getFields} from '../../../../src/calculations/utils';
import * as TM from 'transformation-matrix';
import {tm2flatten} from '../../../../src/htmlcanvas/lib/utils';
import {TEXT_MAX_SCALE} from '../../../../src/htmlcanvas/objects/pipe';
import {getWarningSignImg, matrixScale, warningSignImg, wrapText} from '../../../../src/htmlcanvas/utils';
import {CalculationContext} from "../../../calculations/types";
import {EntityType} from "../../../store/document/entities/types";

export interface Calculated {
    drawCalculationBox(
        context: DrawingContext,
        data: CalculationData[],
        dryRun: boolean,
        warnSingOnly: boolean,
    ): Flatten.Box;
    measureCalculationBox(context: DrawingContext, data: CalculationData[]): Array<[TM.Matrix, Flatten.Polygon]>;
    locateCalculationBoxWorld(context: DrawingContext, data: CalculationData[], scale: number): TM.Matrix[];
    getCalculationFields(context: DrawingContext, filters: CalculationFilters): CalculationData[];
    hasWarning(context: DrawingContext): boolean;
    collectCalculations(context: CalculationContext): CalculationConcrete;
}


export const FIELD_HEIGHT = 15;
export const WARNING_HINT_WIDTH = 200;
export const FIELD_FONT_SIZE = 15;
export const SCALE_GRADIENT_MIN = 0.05;

export const WARNING_WIDTH = 60;
export const WARNING_HEIGHT = 50;
export const MIN_SCALE = 0.7;

export function CalculatedObject<T extends new (...args: any[])
    => Calculated & BackedDrawableObject<CalculatableEntityConcrete>>(constructor: T) {

    // @ts-ignore abstract class expression limitation in the language. In practice this is fine.
    return (class extends constructor implements CalculatedObject {
        calculated: true = true;

        makeDatumText(datum: CalculationData): string {
            if (datum.type === CalculationDataType.VALUE) {
                const value = datum.value;
                if (value === undefined) {
                    throw new Error('undefined value: ' + JSON.stringify(datum) + ' '
                        + JSON.stringify(this.objectStore.get(datum.attachUid)!.entity));
                }

                const fractionDigits = datum.significantDigits === undefined ? 2 : datum.significantDigits;

                let numberText = (value === null ? '??' : value.toFixed(fractionDigits));
                if (datum.format) {
                    numberText = datum.format(value);
                }
                return numberText +
                    ' ' + (datum.hideUnits ? '' : datum.units + ' ') +
                    datum.short;
            } else {
                return datum.message;
            }
        }

        drawWarningSignOnly(context: DrawingContext, dryRun: boolean): Flatten.Box {
            this.withWorldAngle(context, {x: 0, y: 0}, () => {
                if (!dryRun) {
                    context.ctx.drawImage(
                        getWarningSignImg(),
                        - WARNING_WIDTH / 2,
                        - WARNING_HEIGHT / 2,
                        WARNING_WIDTH,
                        WARNING_HEIGHT,
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
        ): Flatten.Box {
            if (warnSignOnly) {
                return this.drawWarningSignOnly(context, dryRun);
            }

            const {ctx, vp} = context;

            // ctx.fillText(this.entity.calculation!.realNominalPipeDiameterMM!.toPrecision(2), 0, 0);


            let maxWidth = 0;
            for (let i = data.length - 1; i >= 0; i--) {
                const datum = data[i];
                if (datum.type === CalculationDataType.VALUE) {
                    ctx.font = (datum.bold ? 'bold ' : '') + FIELD_FONT_SIZE + 'px ' + DEFAULT_FONT_NAME;
                } else {
                    ctx.font = FIELD_FONT_SIZE + 'px ' + DEFAULT_FONT_NAME;
                }

                const metrics = ctx.measureText( this.makeDatumText(datum));
                maxWidth = Math.max(maxWidth, metrics.width);
            }
            if (this.hasWarning(context)) {
                maxWidth = Math.max(maxWidth, WARNING_HINT_WIDTH);
            }


            const calculation = context.globalStore.getCalculation(this.entity);

            let height = 0;
            data.forEach((d) => {
                if (d.type === CalculationDataType.VALUE) {
                    height += (d.fontMultiplier === undefined ? 1 : d.fontMultiplier) * FIELD_FONT_SIZE;
                } else {
                    height += FIELD_FONT_SIZE;
                }
            });

            let warnHeight = 0;
            if (this.hasWarning(context)) {
                ctx.font = 'bold ' + FIELD_FONT_SIZE + 'px ' + DEFAULT_FONT_NAME;
                warnHeight = wrapText(ctx, calculation!.warning!, 0, 0, maxWidth, FIELD_HEIGHT, true);
                height += warnHeight;
            }
            let y = height / 2;

            const box = new Flatten.Box(-maxWidth / 2, - height / 2, maxWidth / 2, height / 2);

            if (this.hasWarning(context)) {
                box.xmin -= WARNING_WIDTH;
            }

            if (!dryRun) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.strokeStyle = '#000';
                if (this.hasWarning(context)) {
                    ctx.fillStyle = 'rgba(255, 220, 150, 1)';
                }
                ctx.fillRect(-maxWidth / 2, -height / 2, maxWidth, height);

                ctx.font = FIELD_FONT_SIZE + 'px ' + DEFAULT_FONT_NAME;
                ctx.fillStyle = '#000';

                if (this.hasWarning(context)) {
                    ctx.fillStyle = '#000';
                    ctx.font = 'bold ' + FIELD_FONT_SIZE + 'px ' + DEFAULT_FONT_NAME;

                    y -= wrapText(
                        ctx,
                        calculation!.warning!,
                        -maxWidth / 2,
                        y - warnHeight + FIELD_HEIGHT,
                        maxWidth,
                        FIELD_HEIGHT,
                    );

                    ctx.drawImage(
                        getWarningSignImg(),
                        -maxWidth / 2 - WARNING_WIDTH,
                        - WARNING_HEIGHT / 2,
                        WARNING_WIDTH,
                        WARNING_HEIGHT,
                    );
                }

                for (let i = data.length - 1; i >= 0; i--) {
                    const datum = data[i];

                    let multiplier = 1;
                    if (datum.type === CalculationDataType.VALUE) {
                        multiplier = datum.fontMultiplier === undefined ? 1 : datum.fontMultiplier!;
                        ctx.font = (datum.bold ? 'bold ' : '') +
                            (multiplier * FIELD_FONT_SIZE).toFixed(0) + 'px ' + DEFAULT_FONT_NAME;
                    } else {
                        ctx.font = (multiplier * FIELD_FONT_SIZE).toFixed(0) + 'px ' + DEFAULT_FONT_NAME;
                    }

                    ctx.fillStyle = '#000';

                    if (datum.systemUid) {
                        const col = context.doc.drawing.metadata.flowSystems.find((s) => s.uid === data[i].systemUid)!.color;
                        ctx.fillStyle = lighten(col.hex, -20);
                    }

                    ctx.fillText(this.makeDatumText(data[i]), -maxWidth / 2, y);
                    y -= multiplier * FIELD_HEIGHT;
                }

                // line to
                const boxShape = new Flatten.Polygon();
                const worldMin = vp.toWorldCoord(
                    TM.applyToPoint(context.ctx.getTransform(), {x: box.xmin, y: box.ymin}),
                );
                const worldMax = vp.toWorldCoord(
                    TM.applyToPoint(context.ctx.getTransform(), {x: box.xmax, y: box.ymax}),
                );
                if (this.hasWarning(context)) {
                    worldMin.x -= WARNING_WIDTH;
                }
                const worldBox = new Flatten.Box(
                    Math.min(worldMin.x, worldMax.x),
                    Math.min(worldMin.y, worldMax.y),
                    Math.max(worldMin.x, worldMax.x),
                    Math.max(worldMin.y, worldMax.y),
                );



                boxShape.addFace(worldBox);
                const line = this.shape()!.distanceTo(boxShape);
                if (!boxShape.contains(line[1].start) || true) {
                    // line is now in world position. Transform line back to current position.
                    const world2curr = TM.transform(
                        TM.inverse(ctx.getTransform()),
                        vp.world2ScreenMatrix,
                    );

                    const currLine = line[1].transform(tm2flatten(world2curr));

                    ctx.strokeStyle = '#AAA';
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

        measureCalculationBox(context: DrawingContext, data: CalculationData[]): Array<[TM.Matrix, Flatten.Polygon]> {

            const s = matrixScale(context.ctx.getTransform());
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
            console.log(this.entity.type + ' locs: ' + JSON.stringify(locs));

            const box = this.drawCalculationBox(context, data, true);

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

            if (this.entity.type === EntityType.PIPE) {

                const pCalc = context.globalStore.getCalculation(this.entity);
                if (pCalc && pCalc.peakFlowRate === null) {
                    return [{
                        message: 'AMBIGUOUS',
                        attachUid: this.uid,
                        type: CalculationDataType.MESSAGE,
                        systemUid: this.entity.systemUid,
                    }];
                }
            }

            return getFields(this.entity, context.doc, context.catalog)
                .filter((f) => f.property in filter && filter[f.property].enabled)
                .map((f) => {
                    const ret: CalculationData = {
                        ...f,
                        type: CalculationDataType.VALUE,
                        value: getPropertyByString(calculation, f.property),
                        attachUid: f.attachUid || this.entity.uid,
                    };
                    return ret;
                });
        }

        hasWarning(context: DrawingContext): boolean {
            const calculation = context.globalStore.getCalculation(this.entity);
            if (calculation && calculation.warning === undefined) {
                throw new Error('undefined calculation: ' + JSON.stringify(this.entity));
            }
            return calculation !== undefined && calculation.warning !== null;
        }
    });
}
