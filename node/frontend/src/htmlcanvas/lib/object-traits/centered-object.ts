import BackedDrawableObject from "../../../../src/htmlcanvas/lib/backed-drawable-object";
import BaseBackedObject from "../../../../src/htmlcanvas/lib/base-backed-object";
import Pipe from "../../../../src/htmlcanvas/objects/pipe";
import assert from "assert";
import { EntityType } from "../../../../../common/src/api/document/entities/types";
import * as _ from "lodash";
import BackedConnectable from "../../../../src/htmlcanvas/lib/BackedConnectable";
import {
    CenteredEntityConcrete,
    ConnectableEntityConcrete
} from "../../../../../common/src/api/document/entities/concrete-entity";
import CanvasContext from "../../../../src/htmlcanvas/lib/canvas-context";
import { getInsertCoordsAt } from "../../../../src/htmlcanvas/lib/utils";
import { DrawingContext } from "../../../../src/htmlcanvas/lib/types";
import Flatten from "@flatten-js/core";
import { PIPE_HEIGHT_GRAPHIC_EPS_MM } from "../../../../src/config";
import { Matrix } from "transformation-matrix";
import * as TM from "transformation-matrix";
import { Coord } from "../../../../../common/src/api/document/drawing";

export default interface Centered {
    debase(context: CanvasContext): void;
    rebase(context: CanvasContext): void;
}

export function CenteredObject<
    T extends new (...args: any[]) => Centered & BackedDrawableObject<CenteredEntityConcrete>
>(constructor: T) {
    // @ts-ignore abstract class expression limitation in the language. In practice this is fine.
    return class extends constructor implements Connectable {
        centered: true = true;

        debase(context: CanvasContext): void {
            if (context.document.uiState.levelUid !== context.globalStore.levelOfEntity.get(this.uid)) {
                return;
            }
            const wc = this.toWorldCoord({ x: 0, y: 0 });
            this.entity.parentUid = null;
            this.entity.center.x = wc.x;
            this.entity.center.y = wc.y;
        }

        rebase(context: CanvasContext) {
            if (context.document.uiState.levelUid !== context.globalStore.levelOfEntity.get(this.uid)) {
                return;
            }
            if (this.entity.parentUid !== null) {
                throw new Error('Entity must be orphan before reparenting');
            }
            const [par, oc] = getInsertCoordsAt(context, this.entity.center);
            this.entity.parentUid = par;
            this.entity.center = oc;
        }
    };
}

export function CenteredObjectNoParent<
    T extends new (...args: any[]) => Centered & BackedDrawableObject<CenteredEntityConcrete>
>(constructor: T) {
    // @ts-ignore abstract class expression limitation in the language. In practice this is fine.
    // tslint:disable-next-line:max-classes-per-file
    return class extends constructor implements Connectable {
        centered: true = true;

        debase(): void {
            //
        }

        rebase(context: CanvasContext) {
            //
        }
    };
}
