import { Draggable, DraggableObject } from "../../../../src/htmlcanvas/lib/object-traits/draggable-object";
import BackedDrawableObject from "../../../../src/htmlcanvas/lib/backed-drawable-object";
import { CenteredEntity, ConnectableEntity, Coord, DrawableEntity } from "../../../../src/store/document/types";
import Connectable from "../../../../src/htmlcanvas/lib/object-traits/connectable";
import * as TM from "transformation-matrix";
import { CenteredEntityConcrete } from "../../../../src/store/document/entities/concrete-entity";
import { InteractionType } from "../../../../src/htmlcanvas/lib/interaction";
import CanvasContext from "../../../../src/htmlcanvas/lib/canvas-context";
import { moveOnto } from "../../../../src/htmlcanvas/lib/black-magic/move-onto";
import BackedConnectable from "../../../../src/htmlcanvas/lib/BackedConnectable";
import assert from "assert";
import BaseBackedObject from "../../../../src/htmlcanvas/lib/base-backed-object";
import { isConnectable } from "../../../../src/store/document";
import Pipe from "../../../../src/htmlcanvas/objects/pipe";

export default function CenterDraggableObject<
    T extends new (...args: any[]) => BackedDrawableObject<CenteredEntityConcrete>
>(constructor: T) {
    return DraggableObject(
        // @ts-ignore abstract class expression limitation in the language. In practice this is fine.
        class extends constructor implements Draggable {
            toDelete: BaseBackedObject | null = null;

            onDrag(
                event: MouseEvent,
                grabbedObjectCoord: Coord,
                eventObjectCoord: Coord,
                grabState: any,
                context: CanvasContext,
                isMulti: boolean
            ): void {
                this.toDelete = null;

                const inv = TM.inverse(this.position);
                const before = TM.applyToPoint(this.position, grabbedObjectCoord);
                const after = TM.applyToPoint(this.position, eventObjectCoord);

                this.entity.center.x += after.x - before.x;
                this.entity.center.y += after.y - before.y;

                if (this instanceof BackedConnectable && !isMulti) {
                    const worldCoord = this.toWorldCoord();

                    // try moving the entity to a destination
                    const draggedOn = context.offerInteraction(
                        {
                            type: InteractionType.MOVE_ONTO_RECEIVE,
                            src: this.entity,
                            worldCoord,
                            worldRadius: 50
                        },
                        (obj) => {
                            const result = this.offerInteraction({
                                type: InteractionType.MOVE_ONTO_SEND,
                                dest: obj[0],
                                worldCoord,
                                worldRadius: 10
                            });
                            return result !== null && result[0].uid !== obj[0].uid;
                        },
                        (objs) => {
                            if (isConnectable(objs[0].type)) {
                                return 10;
                            } else {
                                return 0;
                            }
                        }
                    );

                    if (draggedOn && draggedOn.length > 0) {
                        const dest = this.objectStore.get(draggedOn[0].uid);
                        if (dest instanceof BackedConnectable || dest instanceof Pipe) {
                            moveOnto(this, dest, context);
                        } else {
                            throw new Error("Somehow trying to move onto an incompatible entity");
                        }
                    }
                }

                if (!isMulti) {
                    this.onChange();
                }
            }

            onDragFinish(event: MouseEvent, context: CanvasContext): void {
                this.layer.releaseDrag(context);
                this.onCommit(event);
            }

            onDragStart(event: MouseEvent, objectCoord: Coord, context: CanvasContext): any {
                this.layer.dragObjects([this], context);
                return null;
            }
        }
    );
}
