import BackedDrawableObject from "../../../src/htmlcanvas/lib/backed-drawable-object";
import BaseBackedObject from "../../../src/htmlcanvas/lib/base-backed-object";
import * as TM from "transformation-matrix";
import { Matrix } from "transformation-matrix";
import { matrixScale } from "../../../src/htmlcanvas/utils";
import CenterDraggableObject from "../../../src/htmlcanvas/lib/object-traits/center-draggable-object";
import { Interaction, InteractionType } from "../../../src/htmlcanvas/lib/interaction";
import { DrawingContext } from "../../../src/htmlcanvas/lib/types";
import BigValveEntity, {
    BigValveType,
    SystemNodeEntity
} from "../../../../common/src/api/document/entities/big-valve/big-valve-entity";
import DrawableObjectFactory from "../../../src/htmlcanvas/lib/drawable-object-factory";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import { DrawableEntityConcrete } from "../../../../common/src/api/document/entities/concrete-entity";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import { SelectableObject } from "../../../src/htmlcanvas/lib/object-traits/selectable";
import { CenteredObject } from "../../../src/htmlcanvas/lib/object-traits/centered-object";
import {
    drawRpzdDouble,
    getRpzdHeadLoss,
    VALVE_HEIGHT_MM
} from "../../../src/htmlcanvas/lib/utils";
import { CalculationContext } from "../../../src/calculations/types";
import { FlowNode } from "../../../src/calculations/calculation-engine";
import { DrawingArgs } from "../../../src/htmlcanvas/lib/drawable-object";
import {
    Calculated,
    CalculatedObject,
    FIELD_HEIGHT
} from "../../../src/htmlcanvas/lib/object-traits/calculated-object";
import { CalculationData } from "../../../src/store/document/calculations/calculation-field";
import { DEFAULT_FONT_NAME } from "../../../src/config";
import { getValveK } from "../../lib/utils";
import SystemNode from "./big-valve/system-node";
import BigValveCalculation from "../../store/document/calculations/big-valve-calculation";
import Flatten from "@flatten-js/core";
import Cached from "../lib/cached";
import { ValveType } from "../../../../common/src/api/document/entities/directed-valves/valve-types";
import { StandardFlowSystemUids } from "../../store/catalog";
import PlantEntity from "../../../../common/src/api/document/entities/plant-entity";
import PlantCalculation from "../../store/document/calculations/plant-calculation";
import { EPS } from "../../calculations/pressure-drops";
import { assertUnreachable } from "../../../../common/src/api/config";
import { Coord, coordDist2 } from "../../../../common/src/api/document/drawing";
import { cloneSimple, interpolateTable, parseCatalogNumberExact } from "../../../../common/src/lib/utils";

export const BIG_VALVE_DEFAULT_PIPE_WIDTH_MM = 20;

@CalculatedObject
@SelectableObject
@CenterDraggableObject
@CenteredObject
export default class Plant extends BackedDrawableObject<PlantEntity> implements Calculated {
    static register(): void {
        DrawableObjectFactory.registerEntity(EntityType.PLANT, Plant);
    }

    drawInternal(context: DrawingContext, args: DrawingArgs): void {
        const { ctx, vp } = context;
        const {selected} = args;

        this.withWorldScale(context, {x: 0, y: 0}, () => {
            const l = -this.entity.widthMM / 2;
            const r = this.entity.widthMM / 2;
            const b = this.entity.heightMM / 2;
            const t = - this.entity.heightMM / 2;

            const boxl = l * 1.2;
            const boxw = (r - l) * 1.2;
            const boxt = t * 1.2;
            const boxh = (b - t) * 1.2;

            const scale = matrixScale(ctx.getTransform());
            ctx.lineWidth = Math.max(1 / scale, 10 * this.toWorldLength(1));
            ctx.strokeStyle = "#000";
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.fillRect(l, t, r - l, b - t);

            ctx.beginPath();
            ctx.rect(l, t, r - l, b - t);
            ctx.stroke();

            if (selected) {

                ctx.fillStyle = "rgba(100, 100, 255, 0.2)";
                ctx.fillRect(boxl, boxt, boxw, boxh);
            }

            const fontSize = Math.round( this.toWorldLength(this.entity.widthMM) / this.entity.name.length);
            ctx.font = fontSize + 'px ' + DEFAULT_FONT_NAME;
            const measure = ctx.measureText(this.entity.name.toUpperCase());

            ctx.fillStyle = '#000000';
            ctx.fillText(this.entity.name.toUpperCase(), - measure.width / 2, + fontSize / 3);
        });
    }


    get position(): Matrix {
        const scale = 1 / this.fromParentToWorldLength(1);
        return TM.transform(
            TM.translate(this.entity.center.x, this.entity.center.y),
            TM.rotateDEG(this.entity.rotation),
            TM.scale(scale, scale)
        );
    }

    locateCalculationBoxWorld(context: DrawingContext, data: CalculationData[], scale: number): TM.Matrix[] {
        const angle = (this.toWorldAngleDeg(0) / 180) * Math.PI;
        const height = data.length * FIELD_HEIGHT;
        const wc = this.toWorldCoord();

        const res = [
            0,
            Math.PI / 4,
            -Math.PI / 4,
            Math.PI / 2,
            -Math.PI / 2,
            (Math.PI * 3) / 4,
            (-Math.PI * 3) / 4,
            Math.PI
        ].map((delta) => {
            return TM.transform(
                TM.identity(),
                TM.translate(wc.x, wc.y),
                TM.rotate(angle + Math.PI + delta),
                TM.translate(0, -Math.max(this.entity.widthMM, this.entity.heightMM) * 2),
                TM.scale(scale),
                TM.translate(0, -height / 2),
                TM.rotate(-angle - Math.PI - delta)
            );
        });
        return res;
    }

    refreshObjectInternal(obj: BigValveEntity): void {
        //
    }

    inBounds(objectCoord: Coord) {
        if (Math.abs(objectCoord.x) <= this.entity.widthMM / 2) {
            if (objectCoord.y >= -this.entity.heightMM * 0.5) {
                if (objectCoord.y <= this.entity.heightMM * 0.5) {
                    return true;
                }
            }
        }
        return false;
    }

    prepareDelete(context: CanvasContext): BaseBackedObject[] {
        const list: BaseBackedObject[] = [];

        list.push(
            ...this.objectStore.get(this.entity.inletUid)!.prepareDelete(context),
            ...this.objectStore.get(this.entity.outletUid)!.prepareDelete(context),
            this
        );
        return list;
    }

    getInletsOutlets(): SystemNode[] {
        const result: string[] = [this.entity.inletUid, this.entity.outletUid];
        return result.map((uid) => this.objectStore.get(uid) as SystemNode);
    }

    offerJoiningInteraction(requestSystemUid: string, interaction: Interaction): DrawableEntityConcrete[] | null {
        const inouts = this.getInletsOutlets();
        inouts.sort((a, b) => {
            const awc = a.toWorldCoord();
            const bwc = b.toWorldCoord();
            return coordDist2(awc, interaction.worldCoord) - coordDist2(bwc, interaction.worldCoord);
        });
        for (const sys of inouts) {
            if (sys.entity.systemUid === requestSystemUid) {
                if (sys.offerInteraction(interaction)) {
                    return [sys.entity, this.entity];
                }
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

    getCalculationEntities(context: CalculationContext): [PlantEntity] {
        const e: PlantEntity = cloneSimple(this.entity);
        e.uid += ".calculation";

        e.outletUid = (this.objectStore.get(e.outletUid) as SystemNode).getCalculationNode(
            context,
            this.uid
        ).uid;
        e.inletUid = (this.objectStore.get(e.inletUid) as SystemNode).getCalculationNode(
            context,
            this.uid
        ).uid;

        return [e];
    }

    collectCalculations(context: CalculationContext): PlantCalculation {
        return context.globalStore.getOrCreateCalculation(this.getCalculationEntities(context)[0]);
    }

    getFrictionHeadLoss(
        context: CalculationContext,
        flowLS: number,
        from: FlowNode,
        to: FlowNode,
        signed: boolean
    ): number | null {
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

        const { drawing, catalog, globalStore } = context;

        if (from.connectable === this.entity.inletSystemUid) {
            if (to.connectable !== this.entity.outletSystemUid) {
                throw new Error('Misconfigured flow network');
            }
        }

        if (to.connectable === this.entity.inletSystemUid) {
            if (from.connectable !== this.entity.outletSystemUid) {
                throw new Error('Misconfigured flow network');
            }

            return sign * (1e10 + flowLS);
        }

        // https://neutrium.net/equipment/conversion-between-head-and-pressure/
        if (this.entity.pumpPressureKPA !== null) {
            return sign * - this.entity.pumpPressureKPA;
        }

        if (this.entity.pressureLossKPA) {
            return sign * this.entity.pressureLossKPA;
        }

        // TODO: allow user inputted K value or even fixed pressure losses.
        return 0;
    }

    rememberToRegister(): void {
        //
    }

    getNeighbours(): BaseBackedObject[] {
        const res: BaseBackedObject[] = [];
        for (const sn of this.getInletsOutlets()) {
            res.push(...sn.getNeighbours());
        }
        return res;
    }

    @Cached((kek) => new Set(kek.getParentChain().map((o) => o.uid)))
    shape(): Flatten.Segment | Flatten.Point | Flatten.Polygon | Flatten.Circle | null {
        return super.shape();
    }

    onUpdate() {
        super.onUpdate();

        const outlet = this.objectStore.get(this.entity.outletUid);
        const inlet = this.objectStore.get(this.entity.inletUid);

        if (outlet instanceof SystemNode) {
            if (outlet.entity.systemUid !== this.entity.outletSystemUid) {
                outlet.entity.systemUid = this.entity.outletSystemUid;
            }

            if (Math.abs(outlet.entity.center.x - this.entity.widthMM / 2) > EPS) {
                outlet.entity.center.x = this.entity.widthMM / 2;
            }
        }

        if (inlet instanceof SystemNode) {
            if (inlet.entity.systemUid !== this.entity.inletSystemUid) {
                inlet.entity.systemUid = this.entity.inletSystemUid;
            }

            if (Math.abs(inlet.entity.center.x + this.entity.widthMM / 2) > EPS) {
                inlet.entity.center.x = - this.entity.widthMM / 2;
            }
        }
    }
}
