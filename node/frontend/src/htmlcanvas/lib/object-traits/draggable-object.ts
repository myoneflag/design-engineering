import DrawableObject from "../../../../src/htmlcanvas/lib/drawable-object";
import { MouseMoveResult, UNHANDLED } from "../../../../src/htmlcanvas/types";
import CanvasContext from "../../../../src/htmlcanvas/lib/canvas-context";
import BaseBackedObject from "../../../../src/htmlcanvas/lib/base-backed-object";
import { Coord } from "../../../../../common/src/api/document/drawing";

export interface Draggable {
    inBounds(objectCoord: Coord, objectRadius?: number): boolean;
    onDragStart(event: MouseEvent, objectCoord: Coord, context: CanvasContext, isMultiDrag: boolean): any;
    onDrag(
        event: MouseEvent,
        grabbedObjectCoord: Coord,
        eventObjectCoord: Coord,
        grabState: any,
        context: CanvasContext,
        isMultiDrag: boolean
    ): void;
    onDragFinish(event: MouseEvent, context: CanvasContext, isMultiDrag: boolean): void;
}

export function DraggableObject<T extends new (...args: any[]) => Draggable & DrawableObject>(constructor: T) {
    // @ts-ignore abstract class expression limitation in the language. In practice this is fine.
    return class extends constructor {
        grabbedObjectCoord: Coord | null = null;
        grabbedState: any;
        hasMoved: boolean = false; // can be any value while not dragging

        draggable: true = true;

        onMouseDown(event: MouseEvent, context: CanvasContext) {
            let result = false;
            const world = context.viewPort.toWorldCoord({ x: event.offsetX, y: event.offsetY });
            const objectCoord = this.toObjectCoord(world);
            if (this.inBounds(objectCoord)) {
                this.grabbedState = this.onDragStartPre(event, world, objectCoord, context);
                this.grabbedObjectCoord = objectCoord;
                this.hasMoved = false;
                result = true;
            }

            return super.onMouseDown(event, context) || result;
        }

        onMouseMove(event: MouseEvent, context: CanvasContext) {
            let result = UNHANDLED;
            const world = context.viewPort.toWorldCoord({ x: event.offsetX, y: event.offsetY });
            const objectCoord = this.toObjectCoord(world);
            if (this.grabbedObjectCoord) {
                if (event.movementX !== 0 || event.movementY !== 0 || this.hasMoved) {
                    this.hasMoved = true;

                    // tslint:disable-next-line:no-bitwise
                    if (event.buttons & 1) {
                        this.onDragPre(event, world, this.grabbedObjectCoord, objectCoord, this.grabbedState, context);
                    } else {
                        this.grabbedObjectCoord = null;
                        this.onDragFinishPre(event, world, context);
                    }
                    result = { handled: true, cursor: "move" };
                }
            }

            const result2: MouseMoveResult = super.onMouseMove(event, context);
            if (result2.handled) {
                return result2;
            } else {
                return result;
            }
        }

        onMouseUp(event: MouseEvent, context: CanvasContext): boolean {
            let result = false;
            if (this.grabbedObjectCoord) {
                this.grabbedObjectCoord = null;
                this.onDragFinishPre(event, this.grabbedState, context);
                result = this.hasMoved;
            }

            return super.onMouseUp(event, context) || result;
        }

        isMultiSelected(context: CanvasContext) {
            if (this instanceof BaseBackedObject) {
                return context.document.uiState.selectedUids.length > 1 && context.isSelected(this.uid);
            }
            return false;
        }

        onDragStartPre(event: MouseEvent, world: Coord, objectCoord: Coord, context: CanvasContext): any {
            context.isLayerDragging = true;
            if (this.isMultiSelected(context)) {
                return context.activeLayer.onMultiSelectDragStart(event, world, context);
            } else {
                return this.onDragStart(event, objectCoord, context, false);
            }
        }

        onDragPre(
            event: MouseEvent,
            world: Coord,
            grabbedObjectCoord: Coord,
            eventObjectCoord: Coord,
            grabState: any,
            context: CanvasContext
        ): void {
            if (this.isMultiSelected(context)) {
                return context.activeLayer.onMultiSelectDrag(event, world, grabState, context);
            } else {
                return this.onDrag(event, grabbedObjectCoord, eventObjectCoord, grabState, context, false);
            }
        }

        onDragFinishPre(event: MouseEvent, grabState: any, context: CanvasContext): void {
            context.isLayerDragging = false;
            if (this.isMultiSelected(context)) {
                return context.activeLayer.onMultiSelectDragFinish(event, grabState, context);
            } else {
                return this.onDragFinish(event, context, false);
            }
        }
    };
}
