import BackedDrawableObject, {BaseBackedObject} from '@/htmlcanvas/lib/backed-drawable-object';
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
import FixtureEntity from '@/store/document/entities/fixtures/fixture-entity';

@CenterDraggableObject
export default class Fixture extends BackedDrawableObject<FixtureEntity> implements Connectable {
    static register(): void {
        DrawableObjectFactory.registerEntity(EntityType.FIXTURE, Fixture);
    }

    drawInternal(context: DrawingContext, layerActive: boolean, selected: boolean): void {

        const {ctx, vp} = context;

        const x0 = -this.entity.pipeDistanceMM;
        const x1 = -this.entity.pipeDistanceMM + this.entity.pipeDistanceMM * 1 / 4;
        const x2 = -this.entity.pipeDistanceMM + this.entity.pipeDistanceMM * 2 / 4;
        const x3 = -this.entity.pipeDistanceMM + this.entity.pipeDistanceMM * 3 / 4;
        const x4 = -this.entity.pipeDistanceMM + this.entity.pipeDistanceMM * 4 / 4;
        const x5 = -this.entity.pipeDistanceMM + this.entity.pipeDistanceMM * 5 / 4;
        const x6 = -this.entity.pipeDistanceMM + this.entity.pipeDistanceMM * 6 / 4;
        const x7 = -this.entity.pipeDistanceMM + this.entity.pipeDistanceMM * 7 / 4;
        const x8 = -this.entity.pipeDistanceMM + this.entity.pipeDistanceMM * 8 / 4;


        const y0 = 0;
        const y1 = 0 + this.entity.pipeDistanceMM * 1 / 4;
        const y2 = 0 + this.entity.pipeDistanceMM * 2 / 4;
        const y3 = 0 + this.entity.pipeDistanceMM * 3 / 4;
        const y4 = 0 + this.entity.pipeDistanceMM * 4 / 4;
        const y5 = 0 + this.entity.pipeDistanceMM * 5 / 4;
        const y6 = 0 + this.entity.pipeDistanceMM * 6 / 4;
        const y7 = 0 + this.entity.pipeDistanceMM * 7 / 4;
        const y8 = 0 + this.entity.pipeDistanceMM * 8 / 4;

        if (selected) {
            ctx.fillStyle = 'rgba(100, 100, 255, 0.2)';
            ctx.fillRect(x0, y0, x8 - x0, y8 - y0);
        }

        const sw = 1;
        const ww = vp.toWorldLength(sw);

        ctx.lineWidth = ww;
        ctx.strokeStyle = '#228800';

        if (this.entity.warmRoughInUid) {
            // double (cross)
            ctx.beginPath();
            ctx.moveTo(x0, y1);
            ctx.lineTo(x8, y1);
            ctx.moveTo(x2, y0);
            ctx.lineTo(x2, y3);
            ctx.moveTo(x6, y0);
            ctx.lineTo(x6, y3);


            ctx.moveTo(x1, y2);
            ctx.lineTo(x3, y2);
            ctx.moveTo(x5, y2);
            ctx.lineTo(x7, y2);

            ctx.moveTo(x4, y1);
            ctx.lineTo(x4, y6);
        } else {
            // single
            ctx.beginPath();
            ctx.moveTo(x4, y0);
            ctx.lineTo(x4, y3);
            ctx.moveTo(x3, y2);
            ctx.lineTo(x5, y2);
        }

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
        if (this.entity.warmRoughInUid) {
            // double
            if (objectCoord.x >= -this.entity.pipeDistanceMM && objectCoord.x <= this.entity.pipeDistanceMM) {
                if (objectCoord.y >= 0 && objectCoord.y <= this.entity.pipeDistanceMM) {
                    return true;
                }
            }
            return false;
        } else {
            // single
            if (objectCoord.x >= -this.entity.pipeDistanceMM / 2 && objectCoord.x <= this.entity.pipeDistanceMM / 2) {
                if (objectCoord.y >= 0 && objectCoord.y <= this.entity.pipeDistanceMM) {
                    return true;
                }
            }
            return false;
        }
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
        if (this.entity.warmRoughInUid) {
            return [
                this,
                ...this.objectStore.get(this.entity.coldRoughInUid)!.prepareDelete(),
                ...this.objectStore.get(this.entity.warmRoughInUid)!.prepareDelete(),
            ];
        } else {
            return [
                this,
                ...this.objectStore.get(this.entity.coldRoughInUid)!.prepareDelete(),
            ];
        }
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
