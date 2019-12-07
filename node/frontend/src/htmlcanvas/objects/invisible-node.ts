import BackedDrawableObject from '../../../src/htmlcanvas/lib/backed-drawable-object';
import BaseBackedObject from '../../../src/htmlcanvas/lib/base-backed-object';
import InvisibleNodeEntity from '../../../src/store/document/entities/Invisible-node-entity';
import * as TM from 'transformation-matrix';
import {DrawingContext} from '../../../src/htmlcanvas/lib/types';
import {Coord, DrawableEntity} from '../../../src/store/document/types';
import {ViewPort} from '../../../src/htmlcanvas/viewport';
import {MouseMoveResult, UNHANDLED} from '../../../src/htmlcanvas/types';
import {Interaction} from '../../../src/htmlcanvas/lib/interaction';
import {ConnectableObject} from '../lib/object-traits/connectable';
import BackedConnectable from '../../../src/htmlcanvas/lib/BackedConnectable';
import {InvisibleNodeEntityConcrete} from '../../../src/store/document/entities/concrete-entity';
import CanvasContext from '../../../src/htmlcanvas/lib/canvas-context';
import {DrawingArgs} from '../../../src/htmlcanvas/lib/drawable-object';

export abstract class InvisibleNode<T extends InvisibleNodeEntityConcrete> extends BackedConnectable<T> {
    get position() {
        return TM.translate(this.entity.center.x, this.entity.center.y);
    }

    drawInternal(context: DrawingContext, args: DrawingArgs): void {
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
