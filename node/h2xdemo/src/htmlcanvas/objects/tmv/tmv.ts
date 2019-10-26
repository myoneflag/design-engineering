import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import * as TM from 'transformation-matrix';
import {Matrix} from 'transformation-matrix';
import {Coord} from '@/store/document/types';
import {matrixScale} from '@/htmlcanvas/utils';
import {MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';
import Connectable from '@/htmlcanvas/lib/object-traits/connectable';
import CenterDraggableObject from '@/htmlcanvas/lib/object-traits/center-draggable-object';
import {Interaction, InteractionType} from '@/htmlcanvas/lib/interaction';
import {DrawingContext} from '@/htmlcanvas/lib/types';
import TmvEntity from '@/store/document/entities/tmv/tmv-entity';
import DrawableObjectFactory from '@/htmlcanvas/lib/drawable-object-factory';
import {EntityType} from '@/store/document/entities/types';
import {StandardFlowSystemUids} from '@/store/catalog';
import {DrawableEntityConcrete} from '@/store/document/entities/concrete-entity';
import CanvasContext from '@/htmlcanvas/lib/canvas-context';
import {SelectableObject} from '@/htmlcanvas/lib/object-traits/selectable';
import {assertUnreachable} from '@/lib/utils';

@SelectableObject
@CenterDraggableObject
export default class Tmv extends BackedDrawableObject<TmvEntity> {
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

        const boxl = l * 1.2;
        const boxw = (r - l) * 1.2;
        const boxt = 0 - b * 0.1;
        const boxh = b * 1.2;

        const sw = 1;

        const scale = matrixScale(ctx.getTransform());
        ctx.lineWidth = Math.max(1 / scale, 10 * this.toWorldLength(1));
        ctx.strokeStyle = '#000';
        ctx.lineCap = 'round';

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(boxl, boxt, boxw, boxh);
        ctx.beginPath();
        ctx.strokeStyle = '#000';
        ctx.rect(boxl, boxt, boxw, boxh);
        ctx.stroke();

        if (selected) {
            ctx.fillStyle = 'rgba(100, 100, 255, 0.2)';
            ctx.fillRect(boxl, boxt, boxw, boxh);
        }



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

        ctx.beginPath();

        ctx.moveTo(l, bm);
        ctx.lineTo(l, b);
        ctx.lineTo(r, b);
        ctx.lineTo(r, bm);
        ctx.lineTo(rm, b);
        ctx.lineTo(m, bm);
        ctx.lineTo(lm, b);
        ctx.lineTo(l, bm);
        ctx.moveTo(m, bm);
        ctx.lineTo(m, b);

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

    prepareDelete(context: CanvasContext): BaseBackedObject[] {
        const list = [
            this,
            ...this.objectStore.get(this.entity.coldRoughInUid)!.prepareDelete(context),
            ...this.objectStore.get(this.entity.hotRoughInUid)!.prepareDelete(context),
            ...this.objectStore.get(this.entity.warmOutputUid)!.prepareDelete(context),
        ];
        if (this.entity.coldOutputUid) {
            list.push(...this.objectStore.get(this.entity.coldOutputUid)!.prepareDelete(context));
        }
        return list;
    }

    offerJoiningInteraction(requestSystemUid: string, interaction: Interaction): DrawableEntityConcrete[] | null {
        if (requestSystemUid === StandardFlowSystemUids.ColdWater) {
            const {y} = this.toObjectCoord(interaction.worldCoord);
            let preference: string[] = [this.entity.coldRoughInUid];
            if (this.entity.coldOutputUid) {
                if (y < this.entity.valveLengthMM / 2) {
                    preference = [this.entity.coldRoughInUid, this.entity.coldOutputUid];
                } else {
                    preference = [this.entity.coldOutputUid, this.entity.coldRoughInUid];
                }
            }

            for (const uid of preference) {
                const coldObj = this.objectStore.get(uid);
                if (coldObj && coldObj.offerInteraction(interaction)) {
                    return [coldObj.entity, this.entity];
                }
            }
        } else if (requestSystemUid === StandardFlowSystemUids.WarmWater && this.entity.warmOutputUid) {
            const warmObj = this.objectStore.get(this.entity.warmOutputUid);
            if (warmObj && warmObj.offerInteraction(interaction)) {
                return [warmObj.entity, this.entity];
            }
        } else if (requestSystemUid === StandardFlowSystemUids.HotWater && this.entity.hotRoughInUid) {
            const hotObj = this.objectStore.get(this.entity.hotRoughInUid);
            if (hotObj && hotObj.offerInteraction(interaction)) {
                return [hotObj.entity, this.entity];
            }
        }
        return null;
    }

    offerInteraction(interaction: Interaction): DrawableEntityConcrete[] | null {
        switch (interaction.type) {
            case InteractionType.CONTINUING_PIPE:
            case InteractionType.STARTING_PIPE:
                return this.offerJoiningInteraction(interaction.system.uid, interaction);
            case InteractionType.MOVE_ONTO_RECEIVE:
                if (interaction.src.type === EntityType.VALVE) {
                    return this.offerJoiningInteraction(interaction.src.systemUid, interaction);
                } else {
                    return null;
                }
            case InteractionType.INSERT:
            case InteractionType.MOVE_ONTO_SEND:
            case InteractionType.EXTEND_NETWORK:
                return null;
        }
    }

    rememberToRegister(): void {
        //
    }
}
