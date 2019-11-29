import {CalculatableEntityConcrete, ConnectableEntityConcrete} from '@/store/document/entities/concrete-entity';
import {DrawingContext} from '@/htmlcanvas/lib/types';
import {CalculationFilter, CalculationFilters, Coord} from '@/store/document/types';
import {CalculationData, CalculationField} from '@/store/document/calculations/calculation-field';
import Flatten from '@flatten-js/core';
import Connectable from '@/htmlcanvas/lib/object-traits/connectable';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import PopupEntity from '@/store/document/entities/calculations/popup-entity';
import {DEFAULT_FONT_NAME} from '@/config';
import {getPropertyByString} from '@/lib/utils';
import {getFields} from '@/calculations/utils';
import * as TM from 'transformation-matrix';
import {tm2flatten} from '@/htmlcanvas/lib/utils';
import {TEXT_MAX_SCALE} from '@/htmlcanvas/objects/pipe';
import {matrixScale} from '@/htmlcanvas/utils';
import {applyToPoint} from 'transformation-matrix/applyToPoint';

export interface Calculated {
    drawCalculationBox(context: DrawingContext, data: CalculationData[]): Flatten.Box;
    measureCalculationBox(context: DrawingContext, data: CalculationData[]): Array<[TM.Matrix, Flatten.Polygon]>;
    locateCalculationBoxWorld(context: DrawingContext, data: CalculationData[], scale: number): TM.Matrix[];
    getCalculationFields(context: DrawingContext, filters: CalculationFilters): CalculationData[];
}


export const FIELD_HEIGHT = 15;
export const FIELD_FONT_SIZE = 15;
export const SCALE_GRADIENT_MIN = 0.05;

export function CalculatedObject<T extends new (...args: any[])
    => Calculated & BackedDrawableObject<CalculatableEntityConcrete>>(constructor: T) {

    // @ts-ignore abstract class expression limitation in the language. In practice this is fine.
    return (class extends constructor implements CalculatedObject {
        calculated: true = true;

        drawCalculationBox(context: DrawingContext, data: CalculationData[], dryRun: boolean = false): Flatten.Box {
            const {ctx, vp} = context;

            // ctx.fillText(this.entity.calculation!.realNominalPipeDiameterMM!.toPrecision(2), 0, 0);

            const height = data.length * FIELD_HEIGHT;
            let y = height / 2;

            let maxWidth = 0;
            for (let i = data.length - 1; i >= 0; i--) {
                const datum = data[i];
                const value = datum.value;
                if (value === undefined) {
                    throw new Error('undefined value: ' + JSON.stringify(datum) + ' ' + JSON.stringify(this.objectStore.get(datum.attachUid)!.entity));
                }
                const numberText = (value === null ? 0 : value.toFixed(2));
                ctx.font = FIELD_FONT_SIZE + 'px ' + DEFAULT_FONT_NAME;
                ctx.fillStyle = '#000';
                const metrics = ctx.measureText( numberText + ' ' + datum.units + ' ' + datum.short);

                maxWidth = Math.max(maxWidth, metrics.width);
            }

            const box = new Flatten.Box(-maxWidth / 2, - height / 2, maxWidth / 2, height / 2);

            if (!dryRun) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.strokeStyle = '#000';
                ctx.fillRect(-maxWidth / 2, -height / 2, maxWidth, height);

                ctx.font = FIELD_FONT_SIZE + 'px ' + DEFAULT_FONT_NAME;
                ctx.fillStyle = '#000';

                for (let i = data.length - 1; i >= 0; i--) {
                    const datum = data[i];
                    const value = datum.value;
                    const numberText = (value === null ? 0 : value.toFixed(2));
                    ctx.fillText(  numberText + ' ' + datum.units + ' ' + datum.short, -maxWidth / 2, y);

                    y -= FIELD_HEIGHT;
                }

                // line to
                const boxShape = new Flatten.Polygon();
                const worldMin = vp.toWorldCoord(
                    TM.applyToPoint(context.ctx.getTransform(), {x: box.xmin, y: box.ymin}),
                );
                const worldMax = vp.toWorldCoord(
                    TM.applyToPoint(context.ctx.getTransform(), {x: box.xmax, y: box.ymax}),
                );

                const worldBox = new Flatten.Box(
                    Math.min(worldMin.x, worldMax.x),
                    Math.min(worldMin.y, worldMax.y),
                    Math.max(worldMin.x, worldMax.x),
                    Math.max(worldMin.y, worldMax.y),
                );

                boxShape.addFace(worldBox);
                const line = this.shape()!.distanceTo(boxShape);
                if (!boxShape.contains(line[1].start) || true) {
                    console.log(JSON.stringify(line));
                    // line is now in world position. Transform line back to current position.
                    const world2curr = TM.transform(
                        TM.inverse(ctx.getTransform()),
                        vp.world2ScreenMatrix,
                    );

                    const currLine = line[1].transform(tm2flatten(world2curr));
                    console.log(JSON.stringify(currLine));

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
                newScale = (1 * (s - SCALE_GRADIENT_MIN) + 0.7 * (TEXT_MAX_SCALE - s)) / (TEXT_MAX_SCALE - SCALE_GRADIENT_MIN) / s;
            } else {
                newScale = 0.7 / s;
            }

            const locs: TM.Matrix[] = this.locateCalculationBoxWorld(context, data, newScale);

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
            return getFields(this.entity, context.doc)
                .filter((f) => f.property in filter && filter[f.property].value)
                .map((f) => {
                    const ret: CalculationData = f as CalculationData;
                    if (f.attachUid === undefined) {
                        ret.attachUid = this.entity.uid;
                    }
                    ret.value = getPropertyByString(this.entity.calculation, f.property);
                    return ret;
                });
        }
    });
}
