import {Coord} from '@/store/document/types';
import DrawableObject from '@/htmlcanvas/lib/drawable-object';
import {MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';
import {ViewPort} from '@/htmlcanvas/viewport';

export interface Draggable {
    inBounds(objectCoord: Coord): boolean;
    onDragStart(objectCoord: Coord): any;
    onDrag(grabbedObjectCoord: Coord, eventObjectCoord: Coord, grabState: any): void;
    onDragFinish(): void;
}

export function DraggableObject<T extends new (...args: any[]) => Draggable & DrawableObject>(constructor: T) {

    // @ts-ignore abstract class expression limitation in the language. In practice this is fine.
    return class extends constructor {
        grabbedObjectCoord: Coord | null = null;
        grabbedState: any;
        hasMoved: boolean = false; // can be any value while not dragging

        onMouseDown(event: MouseEvent, vp: ViewPort) {
            let result = false;
            const world = vp.toWorldCoord({x: event.offsetX, y: event.offsetY});
            const objectCoord = this.toObjectCoord(world);
            if (this.inBounds(objectCoord)) {
                this.grabbedObjectCoord = this.onDragStart(objectCoord);
                this.grabbedObjectCoord = objectCoord;
                this.hasMoved = false;
                result = true;
            }

            // @ts-ignore abstract class expression limitation in the language. In practice this is fine.
            return super.onMouseDown(event, vp) || result;
        }

        onMouseMove(event: MouseEvent, vp: ViewPort) {
            let result = UNHANDLED;
            const world = vp.toWorldCoord({x: event.offsetX, y: event.offsetY});
            const objectCoord = this.toObjectCoord(world);
            if (this.grabbedObjectCoord) {
                if (event.movementX !== 0 || event.movementY !== 0 || this.hasMoved) {
                    this.hasMoved = true;

                    // tslint:disable-next-line:no-bitwise
                    if (event.buttons & 1) {
                        this.onDrag(this.grabbedObjectCoord, objectCoord, this.grabbedState);
                    } else {
                        this.grabbedObjectCoord = null;
                        this.onDragFinish();
                    }
                    result = {handled: true, cursor: 'move'};
                }
            }

            // @ts-ignore abstract class expression limitation in the language. In practice this is fine.
            const result2: MouseMoveResult = super.onMouseMove(event, vp);
            if (result2.handled) {
                return result2;
            } else {
                return result;
            }
        }

        onMouseUp(event: MouseEvent, vp: ViewPort): boolean {
            let result = false;
            if (this.grabbedObjectCoord) {
                this.grabbedObjectCoord = null;
                this.onDragFinish();
                result = this.hasMoved;
            }

            // @ts-ignore abstract class expression limitation in the language. In practice this is fine.
            return super.onMouseUp(event, vp) || result;
        }
    };
}
