import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import InvisibleNodeEntity from '@/store/document/entities/Invisible-node-entity';
import * as TM from 'transformation-matrix';
import {DrawingContext} from '@/htmlcanvas/lib/types';
import {Coord, DrawableEntity} from '@/store/document/types';
import {ViewPort} from '@/htmlcanvas/viewport';
import {MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';
import {Interaction} from '@/htmlcanvas/lib/interaction';
import {ConnectableObject} from '../lib/object-traits/connectable';
import BackedConnectable from '@/htmlcanvas/lib/BackedConnectable';
import {InvisibleNodeEntityConcrete} from '@/store/document/entities/concrete-entity';
import CanvasContext from '@/htmlcanvas/lib/canvas-context';

export abstract class InvisibleNode<T extends InvisibleNodeEntityConcrete> extends BackedConnectable<T> {
    get position() {
        return TM.translate(this.entity.center.x, this.entity.center.y);
    }

    drawInternal(context: DrawingContext, ...args: any[]): void {
        // TA-DA!
    }

    prepareDelete(): BaseBackedObject[] {
        return [];
    }

    rememberToRegister(): void {
        //
    }

    protected refreshObjectInternal(obj: InvisibleNodeEntity, old?: InvisibleNodeEntity): void {
        //
    }
}
