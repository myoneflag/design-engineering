import {Draggable, DraggableObject} from '@/htmlcanvas/lib/object-traits/draggable-object';
import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import {ConnectableEntity, Coord, DrawableEntity} from '@/store/document/types';
import Connectable from '@/htmlcanvas/lib/object-traits/connectable';

export default function CenterDraggableObject<T extends new (...args: any[]) =>
    Connectable & BackedDrawableObject<ConnectableEntity>>(constructor: T) {

    return DraggableObject(

        // @ts-ignore abstract class expression limitation in the language. In practice this is fine.
        class extends constructor implements Draggable {

        onDrag(grabbedObjectCoord: Coord, eventObjectCoord: Coord, grabState: any): void {
            this.stateObject.center.x -= grabbedObjectCoord.x - eventObjectCoord.x;
            this.stateObject.center.y -= grabbedObjectCoord.y - eventObjectCoord.y;
            this.onChange();
        }

        onDragFinish(): void {
            this.onCommit();
        }

        onDragStart(objectCoord: Coord): any {
            return null;
        }
    });
}
