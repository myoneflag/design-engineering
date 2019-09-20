import {Draggable, DraggableObject} from '@/htmlcanvas/lib/object-traits/draggable-object';
import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import {CenteredEntity, ConnectableEntity, Coord, DrawableEntity} from '@/store/document/types';
import Connectable from '@/htmlcanvas/lib/object-traits/connectable';
import * as TM from 'transformation-matrix';

export default function CenterDraggableObject<T extends new (...args: any[]) =>
    BackedDrawableObject<CenteredEntity>>(constructor: T) {

    return DraggableObject(

        // @ts-ignore abstract class expression limitation in the language. In practice this is fine.
        class extends constructor implements Draggable {

        onDrag(grabbedObjectCoord: Coord, eventObjectCoord: Coord, grabState: any): void {

            const inv = TM.inverse(this.position);
            const before = TM.applyToPoint(this.position, grabbedObjectCoord);
            const after = TM.applyToPoint(this.position, eventObjectCoord);

            this.entity.center.x += after.x - before.x;
            this.entity.center.y += after.y - before.y;
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
