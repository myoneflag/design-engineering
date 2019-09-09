import {Coord, Rectangle, WithID} from '@/store/document/types';
import DrawableObject from '@/htmlcanvas/lib/drawable-object';
import {MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';
import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import {ViewPort} from '@/htmlcanvas/viewport';

export interface Movable {
    inBounds: (objectCoord: Coord) => boolean;
    onDragStart: (objectCoord: Coord) => any;
    onDrag: (grabbedObjectCoord: Coord, eventObjectCoord: Coord, grabState: any) => void;
    onDragFinish: () => void;

    onMouseDown: (event: MouseEvent, vp: ViewPort) => boolean;
    onMouseMove: (event: MouseEvent, vp: ViewPort) => MouseMoveResult;
    onMouseUp: (event: MouseEvent, vp: ViewPort) => boolean;
}

export default abstract class DraggableObject<T extends WithID> extends BackedDrawableObject<T> implements Movable {
    grabbedObjectCoord: Coord | null = null;
    grabbedState: any;
    hasMoved: boolean = false; // can be any value while not dragging

    abstract inBounds(objectCoord: Coord): boolean;
    abstract onDragStart(objectCoord: Coord): any;
    abstract onDrag(grabbedObjectCoord: Coord, eventObjectCoord: Coord, grabState: any): void;
    abstract onDragFinish(): void;

    onMouseDown(event: MouseEvent, vp: ViewPort) {
        const world = vp.toWorldCoord({x: event.offsetX, y: event.offsetY});
        const objectCoord = this.toObjectCoord(world);
        if (this.inBounds(objectCoord)) {
            this.grabbedObjectCoord = this.onDragStart(objectCoord);
            this.grabbedObjectCoord = objectCoord;
            this.hasMoved = false;
            return true;
        }
        return false;
    }

    onMouseMove(event: MouseEvent, vp: ViewPort) {
        const world = vp.toWorldCoord({x: event.offsetX, y: event.offsetY});
        const objectCoord = this.toObjectCoord(world);
        if (this.grabbedObjectCoord) {
            if (event.movementX === 0 && event.movementY === 0 && !this.hasMoved) {
                return UNHANDLED;
            }

            this.hasMoved = true;

            // tslint:disable-next-line:no-bitwise
            if (event.buttons & 1) {
                this.onDrag(this.grabbedObjectCoord, objectCoord, this.grabbedState);
            } else {
                this.grabbedObjectCoord = null;
                this.onDragFinish();
            }
            return {handled: true, cursor: 'move'};
        } else {
            return UNHANDLED;
        }
    }

    onMouseUp(event: MouseEvent, vp: ViewPort): boolean {
        if (this.grabbedObjectCoord) {
            this.grabbedObjectCoord = null;
            this.onDragFinish();
            return this.hasMoved;
        } else {
            return false;
        }
    }


}

