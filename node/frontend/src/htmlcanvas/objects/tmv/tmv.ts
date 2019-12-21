import BackedDrawableObject from '../../../../src/htmlcanvas/lib/backed-drawable-object';
import BaseBackedObject from '../../../../src/htmlcanvas/lib/base-backed-object';
import * as TM from 'transformation-matrix';
import {Matrix} from 'transformation-matrix';
import {Coord} from '../../../../src/store/document/types';
import {matrixScale} from '../../../../src/htmlcanvas/utils';
import {MouseMoveResult, UNHANDLED} from '../../../../src/htmlcanvas/types';
import Connectable from '../../../../src/htmlcanvas/lib/object-traits/connectable';
import CenterDraggableObject from '../../../../src/htmlcanvas/lib/object-traits/center-draggable-object';
import {Interaction, InteractionType} from '../../../../src/htmlcanvas/lib/interaction';
import {DrawingContext} from '../../../../src/htmlcanvas/lib/types';
import TmvEntity, {SystemNodeEntity} from '../../../../src/store/document/entities/tmv/tmv-entity';
import DrawableObjectFactory from '../../../../src/htmlcanvas/lib/drawable-object-factory';
import {EntityType} from '../../../../src/store/document/entities/types';
import {StandardFlowSystemUids} from '../../../../src/store/catalog';
import {DrawableEntityConcrete} from '../../../../src/store/document/entities/concrete-entity';
import CanvasContext from '../../../../src/htmlcanvas/lib/canvas-context';
import {SelectableObject} from '../../../../src/htmlcanvas/lib/object-traits/selectable';
import Centered, {CenteredObject} from '../../../../src/htmlcanvas/lib/object-traits/centered-object';
import {interpolateTable, parseCatalogNumberExact} from '../../../../src/htmlcanvas/lib/utils';
import {CalculationContext} from '../../../../src/calculations/types';
import {FlowNode} from '../../../../src/calculations/calculation-engine';
import {DrawingArgs} from '../../../../src/htmlcanvas/lib/drawable-object';
import {Calculated, CalculatedObject, FIELD_HEIGHT} from '../../../../src/htmlcanvas/lib/object-traits/calculated-object';
import {CalculationData} from '../../../../src/store/document/calculations/calculation-field';
import {assertUnreachable} from "../../../../src/config";
import FixtureEntity from "../../../store/document/entities/fixtures/fixture-entity";
import {cloneSimple} from "../../../lib/utils";
import SystemNode from "./system-node";
import FixtureCalculation from "../../../store/document/calculations/fixture-calculation";
import TmvCalculation from "../../../store/document/calculations/tmv-calculation";

@CalculatedObject
@SelectableObject
@CenterDraggableObject
@CenteredObject
export default class Tmv extends BackedDrawableObject<TmvEntity> implements Calculated {
    static register(): void {
        DrawableObjectFactory.registerEntity(EntityType.TMV, Tmv);
    }

    lastDrawnWorldRadius: number = 0; // for bounds detection

    drawInternal(context: DrawingContext, {active, selected}: DrawingArgs): void {

        const {ctx, vp} = context;

        const l = -this.entity.pipeDistanceMM;
        const r = this.entity.pipeDistanceMM;
        const lm = l / 2;
        const rm = r / 2;
        const b = this.entity.valveLengthMM * 4;
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
        ctx.fillRect(l, t, r - l, bm);
        ctx.strokeStyle = '#000';

        if (selected) {
            ctx.fillStyle = 'rgba(100, 100, 255, 0.2)';
            ctx.fillRect(boxl, boxt, boxw, boxh);
        }



        // Box and open
        ctx.beginPath();
        ctx.moveTo(l, bm);
        ctx.lineTo(l, t);
        ctx.lineTo(r, t);
        ctx.lineTo(r, bm);
        ctx.lineTo(l, bm);

        ctx.moveTo(l, bm);
        ctx.lineTo(r * 0.80, b * 0.80);

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

    locateCalculationBoxWorld(context: DrawingContext, data: CalculationData[], scale: number): TM.Matrix[] {
        const angle = this.toWorldAngleDeg(0) / 180 * Math.PI;
        const height = data.length * FIELD_HEIGHT;
        const wc = this.toWorldCoord();

        return [0, Math.PI / 4, - Math.PI / 4, Math.PI / 2, - Math.PI / 2,
            Math.PI * 3 / 4, - Math.PI * 3 / 4, Math.PI].map((delta) => {
            return TM.transform(
                TM.identity(),
                TM.translate(wc.x, wc.y),
                TM.rotate(angle + Math.PI + delta),
                TM.translate(0, - this.entity.pipeDistanceMM * 2),
                TM.scale(scale),
                TM.translate(0, - height / 2),
                TM.rotate(-angle - Math.PI - delta),
            );
        });
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
                if (interaction.src.type === EntityType.FITTING) {
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

    getCalculationEntities(context: CalculationContext): [TmvEntity] {
        const e: TmvEntity = cloneSimple(this.entity);
        e.uid += '.calculation';

        e.hotRoughInUid = (this.objectStore.get(e.hotRoughInUid) as SystemNode)
            .getCalculationNode(context, this.uid).uid;
        e.warmOutputUid = (this.objectStore.get(e.warmOutputUid) as SystemNode)
            .getCalculationNode(context, this.uid).uid;
        e.coldRoughInUid = (this.objectStore.get(e.coldRoughInUid) as SystemNode)
            .getCalculationNode(context, this.uid).uid;
        if (e.coldOutputUid) {
            e.coldOutputUid = (this.objectStore.get(e.coldOutputUid) as SystemNode)
                .getCalculationNode(context, this.uid).uid;
        }

        return [e];
    }


    collectCalculations(context: CalculationContext): TmvCalculation {
        return context.globalStore.getOrCreateCalculation(this.getCalculationEntities(context)[0])
    }

    getFrictionHeadLoss(context: CalculationContext,
                        flowLS: number,
                        from: FlowNode,
                        to: FlowNode,
                        signed: boolean,
    ): number {

        const ga = context.drawing.metadata.calculationParams.gravitationalAcceleration;
        let sign = 1;
        if (flowLS < 0) {
            const oldFrom = from;
            from = to;
            to = oldFrom;
            flowLS = -flowLS;
            if (signed) {
                sign = -1;
            }
        }

        const {drawing, catalog, globalStore} = context;
        const entity = this.entity;
        // it is directional
        let valid = false;
        if (from.connectable === entity.hotRoughInUid && to.connectable === entity.warmOutputUid) {
            valid = true;
        }
        if (from.connectable === entity.coldRoughInUid && to.connectable === entity.coldOutputUid) {
            valid = true;
        }
        if (!valid) {
            // Water not flowing the correct direction
            return sign * (1e10 + flowLS);
        }
        const pdKPAfield = interpolateTable(catalog.mixingValves.tmv.pressureLossKPAbyFlowRateLS, flowLS);
        const pdKPA = parseCatalogNumberExact(pdKPAfield);
        if (pdKPA === null) {
            throw new Error('pressure drop for TMV not available');
        }

        // We need the fluid density because TMV pressure stats are in KPA, not head loss
        // which is what the rest of the calculations are base off of.

        const systemUid = (globalStore.get(entity.warmOutputUid)!.entity as SystemNodeEntity).systemUid;
        const fluid = drawing.metadata.flowSystems.find((s) => s.uid === systemUid)!.fluid;
        const density = parseCatalogNumberExact(catalog.fluids[fluid].densityKGM3)!;

        // https://neutrium.net/equipment/conversion-between-head-and-pressure/
        return sign * (pdKPA * 1000 / (density * ga));
    }

    rememberToRegister(): void {
        //
    }

    getNeighbours(): BaseBackedObject[] {
        const res: BaseBackedObject[] = [];
        res.push(...this.objectStore.get(this.entity.coldRoughInUid)!.getNeighbours());
        res.push(...this.objectStore.get(this.entity.hotRoughInUid)!.getNeighbours());
        res.push(...this.objectStore.get(this.entity.warmOutputUid)!.getNeighbours());
        if (this.entity.coldOutputUid) {
            res.push(...this.objectStore.get(this.entity.coldOutputUid)!.getNeighbours());
        }
        return res;
    }
}
