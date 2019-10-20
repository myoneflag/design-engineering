import {Draggable, DraggableObject} from '@/htmlcanvas/lib/object-traits/draggable-object';
import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import {CenteredEntity, ConnectableEntity, Coord, DrawableEntity} from '@/store/document/types';
import Connectable from '@/htmlcanvas/lib/object-traits/connectable';
import * as TM from 'transformation-matrix';
import {CenteredEntityConcrete} from '@/store/document/entities/concrete-entity';
import {InteractionType} from '@/htmlcanvas/lib/interaction';
import CanvasContext from '@/htmlcanvas/lib/canvas-context';
import {moveOnto} from '@/htmlcanvas/lib/interactions/move-onto';
import BackedConnectable from '@/htmlcanvas/lib/BackedConnectable';
import assert from 'assert';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import {isConnectable} from '@/store/document';
import Pipe from '@/htmlcanvas/objects/pipe';

export default function CenterDraggableObject<T extends new (...args: any[]) =>
    BackedDrawableObject<CenteredEntityConcrete>>(constructor: T) {

    return DraggableObject(

        // @ts-ignore abstract class expression limitation in the language. In practice this is fine.
        class extends constructor implements Draggable {

            toDelete: BaseBackedObject | null = null;

            onDrag(grabbedObjectCoord: Coord, eventObjectCoord: Coord, grabState: any, context: CanvasContext): void {
                this.toDelete = null;

                const inv = TM.inverse(this.position);
                const before = TM.applyToPoint(this.position, grabbedObjectCoord);
                const after = TM.applyToPoint(this.position, eventObjectCoord);

                this.entity.center.x += after.x - before.x;
                this.entity.center.y += after.y - before.y;

                if (this instanceof BackedConnectable) {
                    // try moving the entity to a destination
                    const draggedOn = context.offerInteraction(
                        {
                            type: InteractionType.MOVE_ONTO_RECEIVE,
                            src: this.entity,
                            worldCoord: after,
                            worldRadius: 50,
                        },
                        (obj) => {
                            const result = this.offerInteraction({
                                type: InteractionType.MOVE_ONTO_SEND,
                                dest: obj[0],
                                worldCoord: after,
                                worldRadius: 10,
                            });
                            return result !== null && result[0].uid !== obj[0].uid;
                        },
                        (objs) => {
                            if (isConnectable(objs[0].type)) {
                                return 10;
                            } else {
                                return 0;
                            }
                        },
                    );

                    if (draggedOn && draggedOn.length > 0) {
                        const dest = this.objectStore.get(draggedOn[0].uid);
                        if (dest instanceof BackedConnectable || dest instanceof Pipe) {
                            moveOnto(this, dest, context);
                            context.processDocument(false);
                        } else {
                            throw new Error('Somehow trying to move onto an incompatible entity');
                        }
                    }

                    console.log('move processed, dragged on ' + JSON.stringify(draggedOn));
                }

                this.onChange();
            }

            onDragFinish(): void {
                this.layer.releaseDrag();
                this.onCommit();
            }

            onDragStart(objectCoord: Coord): any {
                this.layer.dragObjects([this]);
                return null;
            }
        },
    );
}
