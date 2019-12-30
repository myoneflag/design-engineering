import {Coord} from '../../../../src/store/document/types';
import BackedDrawableObject from '../../../../src/htmlcanvas/lib/backed-drawable-object';
import BaseBackedObject from '../../../../src/htmlcanvas/lib/base-backed-object';
import Pipe from '../../../../src/htmlcanvas/objects/pipe';
import assert from 'assert';
import {EntityType} from '../../../../src/store/document/entities/types';
import * as _ from 'lodash';
import BackedConnectable from '../../../../src/htmlcanvas/lib/BackedConnectable';
import {CenteredEntityConcrete, ConnectableEntityConcrete} from '../../../../src/store/document/entities/concrete-entity';
import CanvasContext from '../../../../src/htmlcanvas/lib/canvas-context';
import {getInsertCoordsAt} from '../../../../src/htmlcanvas/lib/utils';
import {DrawingContext} from '../../../../src/htmlcanvas/lib/types';
import Flatten from '@flatten-js/core';
import {PIPE_HEIGHT_GRAPHIC_EPS_MM} from '../../../../src/config';
import {Matrix} from "transformation-matrix";
import * as TM from "transformation-matrix";

export default interface Centered {
    debase(): void;
    rebase(context: CanvasContext): void;
}

export function CenteredObject<T extends new (...args: any[])
    => Centered & BackedDrawableObject<CenteredEntityConcrete>>(constructor: T) {

    // @ts-ignore abstract class expression limitation in the language. In practice this is fine.
    return class extends constructor implements Connectable {
        centered: true = true;

        debase(): void {
            const wc = this.toWorldCoord({x: 0, y: 0});
            this.entity.parentUid = null;
            this.entity.center.x = wc.x;
            this.entity.center.y = wc.y;
        }

        rebase(context: CanvasContext) {
            assert(this.entity.parentUid === null);
            const [par, oc] = getInsertCoordsAt(context, this.entity.center);
            this.entity.parentUid = par;
            this.entity.center = oc;
        }
    };
}

export function CenteredObjectNoParent<T extends new (...args: any[])
    => Centered & BackedDrawableObject<CenteredEntityConcrete>>(constructor: T) {

    // @ts-ignore abstract class expression limitation in the language. In practice this is fine.
    return class extends constructor implements Connectable {
        centered: true = true;

        debase(): void {
        }

        rebase(context: CanvasContext) {
        }
    };
}
