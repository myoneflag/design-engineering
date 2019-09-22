import BackedDrawableObject, {BaseBackedObject} from '@/htmlcanvas/lib/backed-drawable-object';
import InvisibleNodeEntity from '@/store/document/entities/Invisible-node-entity';
import * as TM from 'transformation-matrix';
import {DrawingContext} from '@/htmlcanvas/lib/types';
import {Coord, DrawableEntity} from '@/store/document/types';
import {ViewPort} from '@/htmlcanvas/viewport';
import {MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';
import {Interaction} from '@/htmlcanvas/lib/interaction';
import {ConnectableObject} from '../lib/object-traits/connectable';
import BackedConnectable from '@/htmlcanvas/lib/BackedConnectable';

export abstract class InvisibleNode<T extends InvisibleNodeEntity> extends BackedConnectable<T> {
    get position() {
        return TM.translate(this.entity.center.x, this.entity.center.y);
    }

    drawInternal(context: DrawingContext, ...args: any[]): void {
        // TA-DA!
    }

    offerInteraction(interaction: Interaction): boolean {
        return false;
    }

    onMouseDown(event: MouseEvent, vp: ViewPort): boolean {
        return false;
    }

    onMouseMove(event: MouseEvent, vp: ViewPort): MouseMoveResult {
        return UNHANDLED;
    }

    onMouseUp(event: MouseEvent, vp: ViewPort): boolean {
        return false;
    }

    prepareDelete(): BaseBackedObject[] {
        return [];
    }

    protected refreshObjectInternal(obj: InvisibleNodeEntity, old?: InvisibleNodeEntity): void {
        //
    }

    rememberToRegister(): void {
        //
    }
}
