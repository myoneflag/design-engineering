import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import FlowSourceEntity from '@/store/document/entities/flow-source-entity';
import {Matrix} from 'transformation-matrix';
import * as TM from 'transformation-matrix';
import {Coord, DocumentState, DrawableEntity, FlowSystemParameters, Rectangle} from '@/store/document/types';
import assert from 'assert';
import {matrixScale} from '@/htmlcanvas/utils';
import {lighten} from '@/lib/utils';
import {ViewPort} from '@/htmlcanvas/viewport';
import {MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';
import {Draggable, DraggableObject} from '@/htmlcanvas/lib/object-traits/draggable-object';
import Connectable, {ConnectableObject} from '@/htmlcanvas/lib/object-traits/connectable';
import CenterDraggableObject from '@/htmlcanvas/lib/object-traits/center-draggable-object';
import {Interaction, InteractionType} from '@/htmlcanvas/lib/interaction';
import {DrawingContext} from '@/htmlcanvas/lib/types';
import TmvEntity from '@/store/document/entities/tmv/tmv-entity';
import DrawableObjectFactory from '@/htmlcanvas/lib/drawable-object-factory';
import {EntityType} from '@/store/document/entities/types';

@CenterDraggableObject
export default class Tmv extends BackedDrawableObject<TmvEntity> implements Connectable {
    static register(): void {
        DrawableObjectFactory.registerEntity(EntityType.TMV, Tmv);
    }

    lastDrawnWorldRadius: number = 0; // for bounds detection

    drawInternal(context: DrawingContext, layerActive: boolean, selected: boolean): void {

        const {ctx, vp} = context;

        const l = -this.entity.pipeDistanceMM;
        const r = this.entity.pipeDistanceMM;
        const lm = l / 2;
        const rm = r / 2;
        const b = this.entity.valveLengthMM;
        const bm = b / 2;
        const t = 0;
        const m = 0;

        if (selected) {
            ctx.fillStyle = 'rgba(100, 100, 255, 0.2)';
            ctx.fillRect(l, t, r - l, b - t);
        }

        const sw = 1;
        const ww = vp.toWorldLength(sw);

        ctx.lineWidth = ww;
        ctx.strokeStyle = '#000';

        // Draw double hourglass
        // XX
        ctx.beginPath();
        ctx.moveTo(l, t);
        ctx.lineTo(r, t);
        ctx.lineTo(m, bm);
        ctx.lineTo(r, bm);
        ctx.lineTo(m, t);
        ctx.lineTo(l, bm);
        ctx.lineTo(m, bm);
        ctx.lineTo(l, t);

        // |V|V|
        ctx.stroke();
        ctx.moveTo(l, bm);
        ctx.lineTo(l, b);
        ctx.lineTo(r, b);
        ctx.lineTo(r, bm);
        ctx.lineTo(rm, b);
        ctx.lineTo(m, bm);
        ctx.lineTo(lm, b);
        ctx.lineTo(l, bm);

        ctx.stroke();
    }

    // @ts-ignore sadly, typescript lacks annotation type modification so we must put this function here manually to
    // complete the type.
    getRadials(exclude?: string | null): Array<[Coord, BaseBackedObject]> { /* */ }

    get position(): Matrix {
        const scale = 1 / this.fromParentToWorldLength(1);
        return TM.transform(
            TM.translate(this.entity.center.x, this.entity.center.y),
            TM.rotateDEG(this.entity.rotation),
            TM.scale(scale, scale),
        );
    }

    refreshObjectInternal(obj: TmvEntity): void {
        //
    }

    inBounds(objectCoord: Coord) {
        if (Math.abs(objectCoord.x) <= this.entity.pipeDistanceMM) {
            if (objectCoord.y > -this.entity.pipeDistanceMM * 0.3) {
                if (objectCoord.y < this.entity.valveLengthMM * 1.2) {
                    return true;
                }
            }
        }
        return false;
    }

    onMouseDown(event: MouseEvent, vp: ViewPort): boolean {
        const wc = vp.toWorldCoord({x: event.offsetX, y: event.offsetY});
        const oc = this.toObjectCoord(wc);

        // Check bounds
        if (this.inBounds(oc)) {
            this.onSelect();

            return true;
        }

        return false;
    }

    onMouseMove(event: MouseEvent, vp: ViewPort): MouseMoveResult {
        return UNHANDLED;
    }

    onMouseUp(event: MouseEvent, vp: ViewPort): boolean {
        const wc = vp.toWorldCoord({x: event.offsetX, y: event.offsetY});
        const oc = this.toObjectCoord(wc);
        // Check bounds
        return this.inBounds(oc);
    }

    prepareDelete(): BaseBackedObject[] {
        return [
            this,
            ...this.objectStore.get(this.entity.coldRoughInUid)!.prepareDelete(),
            ...this.objectStore.get(this.entity.hotRoughInUid)!.prepareDelete(),
            ...this.objectStore.get(this.entity.outputUid)!.prepareDelete(),
        ];
    }


    offerInteraction(interaction: Interaction): boolean {
        switch (interaction.type) {
            case InteractionType.INSERT:
            case InteractionType.CONTINUING_PIPE:
            case InteractionType.STARTING_PIPE:
            default:
                return false;
        }
    }

    rememberToRegister(): void {
        //
    }
}
