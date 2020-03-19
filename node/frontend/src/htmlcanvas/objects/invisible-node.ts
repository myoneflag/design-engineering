import BackedDrawableObject from "../../../src/htmlcanvas/lib/backed-drawable-object";
import BaseBackedObject from "../../../src/htmlcanvas/lib/base-backed-object";
import InvisibleNodeEntity from "../../../../common/src/api/document/entities/Invisible-node-entity";
import * as TM from "transformation-matrix";
import { DrawingContext } from "../../../src/htmlcanvas/lib/types";
import { ViewPort } from "../../../src/htmlcanvas/viewport";
import { MouseMoveResult, UNHANDLED } from "../../../src/htmlcanvas/types";
import { Interaction } from "../../../src/htmlcanvas/lib/interaction";
import { ConnectableObject } from "../lib/object-traits/connectable";
import BackedConnectable from "../../../src/htmlcanvas/lib/BackedConnectable";
import { InvisibleNodeEntityConcrete } from "../../../../common/src/api/document/entities/concrete-entity";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import { DrawingArgs } from "../../../src/htmlcanvas/lib/drawable-object";
import { Coord, DrawableEntity } from "../../../../common/src/api/document/drawing";

export abstract class InvisibleNode<T extends InvisibleNodeEntityConcrete> extends BackedConnectable<T> {
    get position() {
        return TM.translate(this.entity.center.x, this.entity.center.y);
    }

    drawInternal(context: DrawingContext, args: DrawingArgs): void {
        // TA-DA!
    }

    prepareDelete(context: CanvasContext): BaseBackedObject[] {
        return [];
    }

    rememberToRegister(): void {
        //
    }

    protected refreshObjectInternal(obj: InvisibleNodeEntity, old?: InvisibleNodeEntity): void {
        //
    }
}
