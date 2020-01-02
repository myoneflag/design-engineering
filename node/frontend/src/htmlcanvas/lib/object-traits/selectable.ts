import { Coord } from "../../../../src/store/document/types";
import DrawableObject from "../../../../src/htmlcanvas/lib/drawable-object";
import { MouseMoveResult, UNHANDLED } from "../../../../src/htmlcanvas/types";
import { ViewPort } from "../../../../src/htmlcanvas/viewport";
import CanvasContext from "../../../../src/htmlcanvas/lib/canvas-context";
import BackedDrawableObject from "../../../../src/htmlcanvas/lib/backed-drawable-object";
import BaseBackedObject from "../../../../src/htmlcanvas/lib/base-backed-object";

export interface Selectable {
    inBounds(objectCoord: Coord, objectRadius?: number): boolean;
}

export function SelectableObject<T extends new (...args: any[]) => Selectable & BaseBackedObject>(constructor: T) {
    // @ts-ignore abstract class expression limitation in the language. In practice this is fine.
    return class extends constructor {
        selectable: true = true;

        onMouseDown(event: MouseEvent, context: CanvasContext): boolean {
            const wc = context.viewPort.toWorldCoord({ x: event.offsetX, y: event.offsetY });
            const oc = this.toObjectCoord(wc);

            // Check bounds
            let result = false;
            // Shift key for remove select mode
            if (this.layer.isSelected(this.uid) === event.shiftKey) {
                if (this.inBounds(oc)) {
                    this.onSelect(event);

                    result = true;
                }
            }

            return super.onMouseDown(event, context) || result;
        }

        onMouseMove(event: MouseEvent, context: CanvasContext): MouseMoveResult {
            const result2: MouseMoveResult = super.onMouseMove(event, context);
            if (result2.handled) {
                return result2;
            }

            return UNHANDLED;
        }

        onMouseUp(event: MouseEvent, context: CanvasContext): boolean {
            const wc = context.viewPort.toWorldCoord({ x: event.offsetX, y: event.offsetY });
            if (this.entity) {
                const oc = this.toObjectCoord(wc);
                // Check bounds
                let result = false;
                if (this.inBounds(oc)) {
                    result = true;
                }

                return super.onMouseUp(event, context) || result;
            } else {
                // we were deleted during this operation, probably drag
                return super.onMouseUp(event, context);
            }
        }
    };
}
