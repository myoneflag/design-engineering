import BackedDrawableObject from "../../../src/htmlcanvas/lib/backed-drawable-object";
import BaseBackedObject from "../../../src/htmlcanvas/lib/base-backed-object";
import * as TM from "transformation-matrix";
import { Matrix } from "transformation-matrix";
import { decomposeMatrix, matrixScale } from "../../../src/htmlcanvas/utils";
import { MouseMoveResult, UNHANDLED } from "../../../src/htmlcanvas/types";
import Connectable from "../../../src/htmlcanvas/lib/object-traits/connectable";
import CenterDraggableObject from "../../../src/htmlcanvas/lib/object-traits/center-draggable-object";
import { Interaction, InteractionType } from "../../../src/htmlcanvas/lib/interaction";
import {CostBreakdown, DrawingContext} from "../../../src/htmlcanvas/lib/types";
import BigValveEntity from "../../../../common/src/api/document/entities/big-valve/big-valve-entity";
import DrawableObjectFactory from "../../../src/htmlcanvas/lib/drawable-object-factory";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import { DEFAULT_FONT_NAME } from "../../../src/config";
import { DrawableEntityConcrete } from "../../../../common/src/api/document/entities/concrete-entity";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import { SelectableObject } from "../../../src/htmlcanvas/lib/object-traits/selectable";
import Flatten from "@flatten-js/core";
import { CenteredObject } from "../../../src/htmlcanvas/lib/object-traits/centered-object";
import { CalculationContext } from "../../../src/calculations/types";
import { FlowNode } from "../../../src/calculations/calculation-engine";
import { DrawingArgs, EntityDrawingArgs } from "../../../src/htmlcanvas/lib/drawable-object";
import {
    Calculated,
    CalculatedObject,
    FIELD_HEIGHT
} from "../../../src/htmlcanvas/lib/object-traits/calculated-object";
import { CalculationData } from "../../../src/store/document/calculations/calculation-field";
import Cached from "../lib/cached";
import { Coord } from "../../../../common/src/api/document/drawing";
import { cloneSimple } from "../../../../common/src/lib/utils";
import SystemNode from "./big-valve/system-node";
import { SnappableObject } from "../lib/object-traits/snappable-object";
import { isGas, StandardFlowSystemUids } from "../../../../common/src/api/config";
import { rgb2style } from "../../lib/utils";
import { getHighlightColor } from "../lib/utils";
import GasApplianceEntity from "../../../../common/src/api/document/entities/gas-appliance";
import GasApplianceCalculation from "../../store/document/calculations/gas-appliance-calculation";
import store from "../../../src/store/store";
import { NoFlowAvailableReason } from "../../store/document/calculations/pipe-calculation";

@CalculatedObject
@SelectableObject
@CenterDraggableObject
@CenteredObject
@SnappableObject
export default class GasAppliance extends BackedDrawableObject<GasApplianceEntity> implements Calculated {
    static register(): void {
        DrawableObjectFactory.registerEntity(EntityType.GAS_APPLIANCE, GasAppliance);
    }

    locateCalculationBoxWorld(context: DrawingContext, data: CalculationData[], scale: number): TM.Matrix[] {
        const angle = (this.toWorldAngleDeg(0) / 180) * Math.PI;
        const height = data.length * FIELD_HEIGHT;
        const wc = this.toWorldCoord();

        return [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2, (Math.PI * 3) / 4, (-Math.PI * 3) / 4, Math.PI]
            .map((delta) => {
                return [
                    TM.transform(
                        TM.identity(),
                        TM.translate(wc.x, wc.y),
                        TM.rotate(angle + Math.PI + delta),
                        TM.translate(0, -this.entity.widthMM),
                        TM.scale(scale),
                        TM.translate(0, -height / 2),
                        TM.rotate(-angle - Math.PI - delta)
                    ),
                    TM.transform(
                        TM.identity(),
                        TM.translate(wc.x, wc.y),
                        TM.rotate(angle + Math.PI + delta),
                        TM.translate(0, -this.entity.widthMM),
                        TM.scale(scale),
                        TM.translate(0, -height / 2),
                        TM.rotate(-angle - Math.PI - delta)
                    )
                ];
            })
            .flat();
    }

    drawEntity(context: DrawingContext, { selected, overrideColorList }: EntityDrawingArgs): void {
        const scale = context.vp.currToSurfaceScale(context.ctx);
        const ww = Math.max(10 / this.toWorldLength(1), 1 / scale);

        const { ctx, vp } = context;
        ctx.lineWidth = ww;

        const xm1 = -this.entity.widthMM / 2 + (this.entity.widthMM * -0) / 8;
        const x3 = -this.entity.widthMM / 2 + (this.entity.widthMM * 3) / 8;
        const x4 = -this.entity.widthMM / 2 + (this.entity.widthMM * 4) / 8;
        const x5 = -this.entity.widthMM / 2 + (this.entity.widthMM * 5) / 8;
        const x9 = -this.entity.widthMM / 2 + (this.entity.widthMM * 8) / 8;

        const ym1 = 0 + (this.entity.heightMM * -1) / 8;
        const y0 = 0;
        const y1 = 0 + (this.entity.heightMM * 1) / 8;
        const y3 = 0 + (this.entity.heightMM * 3) / 8;
        const y7 = 0 + (this.entity.heightMM * 7) / 8;

        ctx.fillStyle = "rgba(255, 255, 230, 0.8)";
        ctx.strokeStyle = "#000";
        ctx.beginPath();
        ctx.fillRect(xm1, ym1, x9 - xm1, y7 - ym1);
        ctx.rect(xm1, ym1, x9 - xm1, y7 - ym1);
        ctx.stroke();

        if (selected || overrideColorList.length) {
            ctx.fillStyle = rgb2style(getHighlightColor(selected, overrideColorList, {hex: '#A0C8A0'}), 0.6);
            ctx.fillRect(xm1, ym1, x9 - xm1, y7 - ym1);
        }

        ctx.strokeStyle = "#888800";

        ctx.beginPath();
        // single
        ctx.moveTo(x4, y0);
        ctx.lineTo(x4, y3);
        ctx.moveTo(x3, y1);
        ctx.lineTo(x5, y1);

        ctx.stroke();

        this.withWorldAngle(context, { x: 0, y: this.entity.heightMM * 0.6 }, () => {
            ctx.font = this.entity.widthMM / 4 + "pt " + DEFAULT_FONT_NAME;
            const abbreviation = this.entity.abbreviation ? this.entity.abbreviation : "";
            const bounds = ctx.measureText(abbreviation);
            const left = -bounds.width / 2;
            ctx.fillStyle = "#000";
            ctx.fillText(abbreviation, left, this.entity.heightMM * 0.15);
        });
    }

    // @ts-ignore sadly, typescript lacks annotation type modification so we must put this function here manually to
    // complete the type.
    getRadials(exclude?: string | null): Array<[Coord, BaseBackedObject]> {
        /* */
    }

    get position(): Matrix {
        const scale = 1 / this.fromParentToWorldLength(1);
        return TM.transform(
            TM.translate(this.entity.center.x, this.entity.center.y),
            TM.rotateDEG(this.entity.rotation),
            TM.scale(scale, scale)
        );
    }

    refreshObjectInternal(obj: BigValveEntity): void {
        //
    }

    inBounds(objectCoord: Coord) {
        if (objectCoord.x >= -this.entity.widthMM / 2 && objectCoord.x <= this.entity.widthMM / 2) {
            if (objectCoord.y >= 0 && objectCoord.y <= this.entity.heightMM) {
                return true;
            }
        }
        return false;
    }

    @Cached((kek) => new Set(kek.getParentChain().map((o) => o.uid)))
    shape() {
        const p = new Flatten.Polygon();
        // tslint:disable-next-line:one-variable-per-declaration
        let l, t, r, b;
        l = (-this.entity.widthMM * 5) / 8;
        r = (this.entity.widthMM * 5) / 8;
        t = (-this.entity.heightMM * 1) / 8;
        b = (this.entity.heightMM * 8) / 8;


        const tl = this.toWorldCoord({ x: l, y: t });
        const tr = this.toWorldCoord({ x: r, y: t });
        const bl = this.toWorldCoord({ x: l, y: b });
        const br = this.toWorldCoord({ x: r, y: b });
        const tlp = Flatten.point(tl.x, tl.y);
        const trp = Flatten.point(tr.x, tr.y);
        const blp = Flatten.point(bl.x, bl.y);
        const brp = Flatten.point(br.x, br.y);

        p.addFace([
            Flatten.segment(tlp, trp),
            Flatten.segment(trp, brp),
            Flatten.segment(brp, blp),
            Flatten.segment(blp, tlp)
        ]);

        return p;
    }

    prepareDelete(context: CanvasContext): BaseBackedObject[] {
        const result: BaseBackedObject[] = [];
        result.push(...this.globalStore.get(this.entity.inletUid)!.prepareDelete(context));
        result.push(this);

        return result;
    }

    offerJoiningInteraction(systemUid: string, interaction: Interaction) {
        if (isGas(systemUid, store.getters['catalog/default']['fluids'], this.document.drawing.metadata.flowSystems)) {
            const obj = this.globalStore.get(this.entity.inletUid);
            if (obj && obj.offerInteraction(interaction)) {
                return [obj.entity, this.entity];
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
                }
                return null;
            case InteractionType.INSERT:
            case InteractionType.MOVE_ONTO_SEND:
            case InteractionType.EXTEND_NETWORK:
                return null;
        }
    }

    getFrictionHeadLoss(
        context: CalculationContext,
        flowLS: number,
        from: FlowNode,
        to: FlowNode,
        sign: boolean
    ): number {
        throw new Error("not implemented");
    }

    getCalculationEntities(context: CalculationContext): [GasApplianceEntity] {
        const e: GasApplianceEntity = cloneSimple(this.entity);
        e.uid += ".calculation";
        e.inletUid = this.globalStore.get(e.inletUid)!.getCalculationNode(context, this.uid).uid;
        return [e];
    }

    collectCalculations(context: CalculationContext): GasApplianceCalculation {
        return context.globalStore.getOrCreateCalculation(this.getCalculationEntities(context)[0]);
    }

    rememberToRegister(): void {
        //
    }

    getNeighbours(): BaseBackedObject[] {
        const res: BaseBackedObject[] = [];
        res.push(...this.globalStore.get(this.entity.inletUid)!.getNeighbours());
        return res;
    }

    getCopiedObjects(): BaseBackedObject[] {
        const res: BaseBackedObject[] = [this];

        res.push(this.globalStore.get(this.entity.inletUid)!);

        return res;
    }

    onUpdate() {
        super.onUpdate();
    }

    costBreakdown(context: CalculationContext): CostBreakdown | null {
        return {cost: 0, breakdown: []};
    }

    validateConnectionPoints(): boolean {
        const connections = this.getNeighbours();
        if (!connections.length) {
            return false;
        }
        for (const conn of connections) {
            const o = this.globalStore.get(conn.uid)!;
            if (o.entity.type === EntityType.PIPE) {
                const calc = this.globalStore.getCalculation(o.entity)!;
                if (calc?.noFlowAvailableReason === NoFlowAvailableReason.NO_SOURCE) {
                    return false;
                }
            }
        }
        return true;
    }
}
