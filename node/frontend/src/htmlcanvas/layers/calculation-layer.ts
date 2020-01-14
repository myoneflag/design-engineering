import { LayerImplementation } from "../../../src/htmlcanvas/layers/layer";
import { CalculationFilters, DocumentState } from "../../../src/store/document/types";
import { DrawingContext } from "../../../src/htmlcanvas/lib/types";
import BaseBackedObject from "../../../src/htmlcanvas/lib/base-backed-object";
import { MouseMoveResult, UNHANDLED } from "../../../src/htmlcanvas/types";
import CalculationEngine from "../../../src/calculations/calculation-engine";
import { DemandType } from "../../../src/calculations/types";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import Pipe from "../../../src/htmlcanvas/objects/pipe";
import { CalculationData } from "../../../src/store/document/calculations/calculation-field";
import Flatten from "@flatten-js/core";
import {
    cooperativeYield,
    matrixScale,
    polygonOverlapsShapeApprox,
    polygonsOverlap
} from "../../../src/htmlcanvas/utils";
import { isCalculated } from "../../../src/store/document/calculations";
import * as TM from "transformation-matrix";
import { tm2flatten } from "../../../src/htmlcanvas/lib/utils";
import { MIN_SCALE } from "../../../src/htmlcanvas/lib/object-traits/calculated-object";
import { isConnectableEntity } from "../../../../common/src/api/document/entities/concrete-entity";
import { assertUnreachable } from "../../../../common/src/api/config";

const MINIMUM_SIGNIFICANT_PIPE_LENGTH_MM = 500;
export const SIGNIFICANT_FLOW_THRESHOLD = 1e-5;

export default class CalculationLayer extends LayerImplementation {
    calculator: CalculationEngine = new CalculationEngine();
    async draw(
        context: DrawingContext,
        active: boolean,
        shouldContinueInternal: () => boolean,
        reactive: Set<string>,
        calculationFilters: CalculationFilters | null
    ) {
        const lvlUid = context.doc.uiState.levelUid;
        const shouldContinue = () => {
            if (lvlUid !== context.doc.uiState.levelUid) {
                return false;
            }
            return shouldContinueInternal();
        };
        // TODO: asyncify
        const { ctx, vp } = context;
        if (active && calculationFilters) {
            // 1. Load all calculation data and record them
            // 2. Load all message layout options for this data. Not explcitly needed as a separate step
            // 3. Order objects by importance
            // 4. Draw messages for objects, keeping track of what was drawn and avoid overlaps by drawing
            // in a new place.

            const obj2props = new Map<string, CalculationData[]>();

            this.objectStore.forEach((o) => {
                if (
                    isCalculated(o.entity) &&
                    o.type in calculationFilters &&
                    calculationFilters[o.type].enabled &&
                    context.globalStore.getCalculation(o.entity)
                ) {
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
                return -(this.messagePriority(context, a) - this.messagePriority(context, b));
            });

            const spentShapes: Flatten.Polygon[] = [];
            let po = 0;
            let pos = 0;
            let nb = 0;

            await cooperativeYield(shouldContinue);
            if (lvlUid !== context.doc.uiState.levelUid) {
                return;
            }

            const onScreenList: BaseBackedObject[] = objList.filter((o) => vp.someOnScreen(o.shape()!));
            const allOnScreen = Array.from(this.objectStore.values()).filter((o) => vp.someOnScreen(o.shape()!));

            await cooperativeYield(shouldContinue);
            if (lvlUid !== context.doc.uiState.levelUid) {
                return;
            }

            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < objList.length; i++) {
                const o = objList[i];

                if (!vp.someOnScreen(o.shape()!)) {
                    continue;
                }

                vp.prepareContext(context.ctx);
                const boxes = o.measureCalculationBox(context, obj2props.get(o.uid) || []);
                nb += boxes.length;
                let drawn = false;
                for (const [position, shape] of boxes) {
                    if (!vp.someOnScreen(shape)) {
                        continue;
                    }

                    let invalid = false;

                    for (const shapeCheck of spentShapes) {
                        po++;
                        if (polygonsOverlap(shapeCheck, shape)) {
                            invalid = true;
                            break;
                        }
                    }

                    if (!invalid) {
                        // don't cover connectables
                        for (const c of allOnScreen) {
                            if (
                                (isConnectableEntity(c.entity) ||
                                c.entity.type === EntityType.FIXTURE ||
                                c.entity.type === EntityType.BIG_VALVE)
                            ) {
                                pos++;

                                if (polygonOverlapsShapeApprox(shape, c.shape()!)) {
                                    invalid = true;
                                    break;
                                }

                                if (pos % 5000 === 4999) {
                                    await cooperativeYield(shouldContinue);
                                    if (lvlUid !== context.doc.uiState.levelUid) {
                                        return;
                                    }
                                }
                            }
                        }
                    }

                    if (!invalid) {
                        // Draw it!
                        // Remember to prepare the context.

                        vp.prepareContext(context.ctx, position);
                        const box = o.drawCalculationBox(context, obj2props.get(o.uid)!, false);
                        spentShapes.push(shape);
                        drawn = true;
                        break;
                    }
                }

                if (!drawn) {
                    // warnings must be drawn
                    if (o.calculated && o.hasWarning(context)) {
                        vp.prepareContext(context.ctx, ...o.world2object);
                        const s = matrixScale(context.ctx.getTransform());
                        context.ctx.scale(MIN_SCALE / s, MIN_SCALE / s);

                        const box = o.drawCalculationBox(context, [], false, true);
                        let p = new Flatten.Polygon();
                        p.addFace(box);
                        p = p.transform(tm2flatten(TM.transform(TM.inverse(context.ctx.getTransform()), vp.position)));
                        spentShapes.push(p);
                    }
                }
            }
        }
    }

    messagePriority(context: DrawingContext, object: BaseBackedObject): number {
        if (isCalculated(object.entity)) {
            const calc = context.globalStore.getCalculation(object.entity);
            if (calc && calc.warning !== null) {
                return 10000; // High priority to warnings.
            }
        }

        switch (object.entity.type) {
            case EntityType.FLOW_SOURCE:
                return 130;
            case EntityType.RISER:
                return 120;
            case EntityType.LOAD_NODE:
            case EntityType.FIXTURE:
                return 110;
            case EntityType.BIG_VALVE:
            case EntityType.PLANT:
            case EntityType.DIRECTED_VALVE:
                return 100;
            case EntityType.FITTING:
                return 90;
            case EntityType.SYSTEM_NODE:
                return 80;
            case EntityType.PIPE:
                return 70 + 10 - 10 / ((object as Pipe).computedLengthM + 1);
            case EntityType.BACKGROUND_IMAGE:
                throw new Error("shouldn't have calculations");
        }
        assertUnreachable(object.entity);
    }

    drawReactiveLayer(context: DrawingContext, interactive: string[]): any {
        //
    }

    resetDocument(doc: DocumentState): any {
        //
    }

    calculate(context: CanvasContext, demandType: DemandType, done: () => void) {

        context.document.uiState.isCalculating = true;
        this.calculator.calculate(context.globalStore, context.document, context.effectiveCatalog, demandType, (success) => {
            if (success) {
                context.document.uiState.lastCalculationId = context.document.nextId;
                context.document.uiState.lastCalculationUiSettings = {
                    demandType
                };

            }
            context.document.uiState.isCalculating = false;
            // this.resetDocument(context.document);

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
