import {LayerImplementation} from '@/htmlcanvas/layers/layer';
import {CalculationFilters, DocumentState, DrawableEntity} from '@/store/document/types';
import {DrawingContext} from '@/htmlcanvas/lib/types';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import {MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';
import CalculationEngine from '@/calculations/calculation-engine';
import {DemandType} from '@/calculations/types';
import {EntityType} from '@/store/document/entities/types';
import {CalculatableEntityConcrete} from '@/store/document/entities/concrete-entity';
import CanvasContext from '@/htmlcanvas/lib/canvas-context';
import Pipe from '@/htmlcanvas/objects/pipe';
import {CalculationData} from '@/store/document/calculations/calculation-field';
import Flatten from '@flatten-js/core';
import {polygonOverlapsShape, polygonsOverlap} from '@/htmlcanvas/utils';
import {isConnectable} from '@/store/document';

const MINIMUM_SIGNIFICANT_PIPE_LENGTH_MM = 500;
export const SIGNIFICANT_FLOW_THRESHOLD = 1e-5;

export default class CalculationLayer extends LayerImplementation {

    calculator: CalculationEngine = new CalculationEngine();
    draw(context: DrawingContext, active: boolean, calculationFilters: CalculationFilters | null): any {
        const {ctx, vp} = context;
        if (active && calculationFilters) {
            // 1. Load all calculation data and record them
            // 2. Load all message layout options for this data. Not explcitly needed as a separate step
            // 3. Order objects by importance
            // 4. Draw messages for objects, keeping track of what was drawn and avoid overlaps by drawing
                    // in a new place.

            const obj2props = new Map<string, CalculationData[]>();

            this.objectStore.forEach((o) => {
                if (o.calculated && o.type in calculationFilters &&
                    (o.entity as CalculatableEntityConcrete).calculation) {
                    const fields = o.getCalculationFields(context, calculationFilters);
                    fields.forEach((f) => {
                        if (!obj2props.has(f.attachUid)) {
                            obj2props.set(f.attachUid, []);
                        }
                        obj2props.get(f.attachUid)!.push(f);
                    });
                }
            });

            const objList = Array.from(this.objectStore.values()).filter((o) => o.calculated && obj2props.has(o.uid));
            objList.sort((a, b) => {
                return -(this.messagePriority(a) - this.messagePriority(b));
            });

            const spentShapes: Flatten.Polygon[] = [];

            objList.forEach((o) => {
                vp.prepareContext(context.ctx);
                const boxes = o.measureCalculationBox(context, obj2props.get(o.uid) || []);
                let drawn = false;
                boxes.forEach(([position, shape]) => {
                    if (drawn) {
                        return;
                    }

                    if (!vp.someOnScreen(shape)) {
                        return;
                    }

                    let invalid = false;

                    for (let i = 0; i < spentShapes.length; i++) {
                        if (polygonsOverlap(spentShapes[i], shape)) {
                            invalid = true;
                            break;
                        }
                    }

                    if (!invalid) {
                        // don't cover connectables
                        this.objectStore.forEach((o) => {
                            if (!invalid) {
                                if (isConnectable(o.entity.type) || o.entity.type === EntityType.FIXTURE ||
                                    o.entity.type === EntityType.TMV) {
                                    if (polygonOverlapsShape(shape, o.shape()!)) {
                                        invalid = true;
                                    }
                                }
                            }
                        });
                    }

                    if (!invalid) {
                        // Draw it!
                        // Remember to prepare the context.

                        vp.prepareContext(context.ctx, position);
                        const box = o.drawCalculationBox(context, obj2props.get(o.uid)!, false);
                        spentShapes.push(shape);
                        drawn = true;
                    }
                });
            });
        }
    }

    messagePriority(object: BaseBackedObject): number {
        switch (object.entity.type) {
            case EntityType.FLOW_SOURCE:
                return 120;
            case EntityType.FIXTURE:
                return 110;
            case EntityType.TMV:
            case EntityType.DIRECTED_VALVE:
                return 100;
            case EntityType.FITTING:
                return 90;
            case EntityType.SYSTEM_NODE:
                return 80;
            case EntityType.PIPE:
                return 70 + 10 - 10 / ((object as Pipe).computedLengthM + 1);
            case EntityType.RESULTS_MESSAGE:
            case EntityType.BACKGROUND_IMAGE:
                throw new Error('shouldn\'t have calculations');
        }
    }

    drawSelectionLayer(context: DrawingContext, interactive: DrawableEntity[] | null): any {
        //
    }

    update(doc: DocumentState): any {

    }


    calculate(context: CanvasContext, demandType: DemandType, done: () => void) {

        context.document.uiState.isCalculating = true;

        this.calculator.calculate(
            this.objectStore,
            context.document,
            context.effectiveCatalog,
            demandType,
            (warnings) => {

            context.document.uiState.lastCalculationId = context.document.nextId;
            context.document.uiState.lastCalculationUiSettings = {
                demandType,
            };
            context.document.uiState.isCalculating = false;

            this.update(context.document);

            // Create new messages

            done();
        });
    }

    onMouseDown(event: MouseEvent, context: CanvasContext) {
        return false;
    }

    onMouseMove(event: MouseEvent, context: CanvasContext): MouseMoveResult {
        return UNHANDLED;
    }


    onMouseUp(event: MouseEvent, context: CanvasContext) {
        return false;
    }
}
