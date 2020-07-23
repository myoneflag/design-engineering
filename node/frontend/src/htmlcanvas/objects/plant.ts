import BackedDrawableObject from "../../../src/htmlcanvas/lib/backed-drawable-object";
import BaseBackedObject from "../../../src/htmlcanvas/lib/base-backed-object";
import * as TM from "transformation-matrix";
import { Matrix } from "transformation-matrix";
import CenterDraggableObject from "../../../src/htmlcanvas/lib/object-traits/center-draggable-object";
import { Interaction, InteractionType } from "../../../src/htmlcanvas/lib/interaction";
import {CostBreakdown, DrawingContext} from "../../../src/htmlcanvas/lib/types";
import BigValveEntity from "../../../../common/src/api/document/entities/big-valve/big-valve-entity";
import DrawableObjectFactory from "../../../src/htmlcanvas/lib/drawable-object-factory";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import { DrawableEntityConcrete } from "../../../../common/src/api/document/entities/concrete-entity";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import { SelectableObject } from "../../../src/htmlcanvas/lib/object-traits/selectable";
import { CenteredObject } from "../../../src/htmlcanvas/lib/object-traits/centered-object";
import { getHighlightColor, getPlantPressureLossKPA } from "../../../src/htmlcanvas/lib/utils";
import { CalculationContext } from "../../../src/calculations/types";
import { FlowNode } from "../../../src/calculations/calculation-engine";
import { DrawingArgs, EntityDrawingArgs } from "../../../src/htmlcanvas/lib/drawable-object";
import {
    Calculated,
    CalculatedObject,
    FIELD_HEIGHT
} from "../../../src/htmlcanvas/lib/object-traits/calculated-object";
import { CalculationData } from "../../../src/store/document/calculations/calculation-field";
import { DEFAULT_FONT_NAME } from "../../../src/config";
import SystemNode from "./big-valve/system-node";
import Flatten from "@flatten-js/core";
import Cached from "../lib/cached";
import PlantEntity from "../../../../common/src/api/document/entities/plants/plant-entity";
import PlantCalculation from "../../store/document/calculations/plant-calculation";
import { getFluidDensityOfSystem, kpa2head } from "../../calculations/pressure-drops";
import { Coord, coordDist2 } from "../../../../common/src/api/document/drawing";
import { cloneSimple, EPS } from "../../../../common/src/lib/utils";
import { PlantType } from "../../../../common/src/api/document/entities/plants/plant-types";
import {assertUnreachable, StandardFlowSystemUids} from "../../../../common/src/api/config";
import { SnappableObject } from "../lib/object-traits/snappable-object";
import { rgb2style } from "../../lib/utils";

export const BIG_VALVE_DEFAULT_PIPE_WIDTH_MM = 20;

@CalculatedObject
@SelectableObject
@CenterDraggableObject
@CenteredObject
@SnappableObject
export default class Plant extends BackedDrawableObject<PlantEntity> implements Calculated {
    static register(): void {
        DrawableObjectFactory.registerEntity(EntityType.PLANT, Plant);
    }

    drawEntity(context: DrawingContext, args: EntityDrawingArgs): void {
        const { ctx, vp } = context;
        const { selected } = args;

        this.withWorldScale(context, { x: 0, y: 0 }, () => {
            const l = -this.entity.widthMM / 2;
            const r = this.entity.widthMM / 2;
            const b = this.entity.heightMM / 2;
            const t = -this.entity.heightMM / 2;

            const boxl = l * 1.2;
            const boxw = (r - l) * 1.2;
            const boxt = t * 1.2;
            const boxh = (b - t) * 1.2;

            const scale = context.vp.currToSurfaceScale(ctx);
            ctx.lineWidth = Math.max(1 / scale, 10 * this.toWorldLength(1));
            ctx.strokeStyle = "#000";
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.fillRect(l, t, r - l, b - t);

            ctx.beginPath();
            ctx.rect(l, t, r - l, b - t);
            ctx.stroke();

            ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
            const ts = Math.min(this.entity.widthMM, this.entity.heightMM) * 0.7;
            ctx.beginPath();
            ctx.moveTo((-ts / 2) * (this.entity.rightToLeft ? -1 : 1), -ts / 2);
            ctx.lineTo((+ts / 2) * (this.entity.rightToLeft ? -1 : 1), 0);
            ctx.lineTo((-ts / 2) * (this.entity.rightToLeft ? -1 : 1), +ts / 2);
            ctx.closePath();
            ctx.fill();

            if (selected || args.overrideColorList.length ) {
                ctx.fillStyle = rgb2style(getHighlightColor(selected, args.overrideColorList), 0.4);
                ctx.fillRect(boxl, boxt, boxw, boxh);
            }

            const fontSize = Math.round(this.toWorldLength(this.entity.widthMM) / this.entity.name.length);
            ctx.font = fontSize + "px " + DEFAULT_FONT_NAME;
            const measure = ctx.measureText(this.entity.name.toUpperCase());

            ctx.fillStyle = "#000000";
            ctx.fillText(this.entity.name.toUpperCase(), -measure.width / 2, +fontSize / 3);
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
            return [height, Math.max(this.entity.widthMM, this.entity.heightMM)].map((offset) => TM.transform(
                TM.identity(),
                TM.translate(wc.x, wc.y),
                TM.rotate(angle + Math.PI + delta),
                TM.translate(0, -Math.max(this.entity.widthMM, this.entity.heightMM) + offset),
                TM.scale(scale),
                TM.translate(0, -height / 2),
                TM.rotate(-angle - Math.PI - delta)
            ));
        });
        return res.flat();
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
        return [
            ...this.getInletsOutlets().map((o) => o.prepareDelete(context)).flat(),
            this
        ];
    }

    getInletsOutlets(): SystemNode[] {
        const result: string[] = [this.entity.inletUid, this.entity.outletUid];
        switch (this.entity.plant.type) {
            case PlantType.RETURN_SYSTEM:
                result.push(this.entity.plant.returnUid);
                break;
            case PlantType.TANK:
                break;
            case PlantType.CUSTOM:
                break;
            case PlantType.PUMP:
                break;
            default:
                assertUnreachable(this.entity.plant);
        }
        return result.map((uid) => this.globalStore.get(uid) as SystemNode);
    }

    offerJoiningInteraction(requestSystemUid: string, interaction: Interaction): DrawableEntityConcrete[] | null {
        const inouts = this.getInletsOutlets();
        inouts.sort((a, b) => {
            const awc = a.toWorldCoord();
            const bwc = b.toWorldCoord();
            return coordDist2(awc, interaction.worldCoord) - coordDist2(bwc, interaction.worldCoord);
        });
        for (const sys of inouts) {
            if (sys.offerInteraction(interaction)) {
                return [sys.entity, this.entity];
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

        e.outletUid = (this.globalStore.get(e.outletUid) as SystemNode).getCalculationNode(context, this.uid).uid;
        e.inletUid = (this.globalStore.get(e.inletUid) as SystemNode).getCalculationNode(context, this.uid).uid;

        switch (e.plant.type) {
            case PlantType.RETURN_SYSTEM:
                e.plant.returnUid = (this.globalStore.get(e.plant.returnUid) as SystemNode).getCalculationNode(context, this.uid).uid;
                break;
            case PlantType.TANK:
                break;
            case PlantType.CUSTOM:
                break;
            case PlantType.PUMP:
                break;
        }

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
        signed: boolean,
        pressureKPA: number | null
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
                throw new Error("Misconfigured flow network");
            }
        }

        if (to.connectable === this.entity.inletSystemUid) {
            if (from.connectable !== this.entity.outletSystemUid) {
                throw new Error("Misconfigured flow network");
            }

            return sign * (1e10 + flowLS);
        }

        const pl = getPlantPressureLossKPA(this.entity, this.document.drawing, pressureKPA, flowLS);
        if (pl === null) {
            return null;
        }

        return (
            sign *
            kpa2head(
                pl,
                getFluidDensityOfSystem(this.entity.inletSystemUid, context.doc, context.catalog)!,
                context.drawing.metadata.calculationParams.gravitationalAcceleration
            )
        );
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

        const outlet = this.globalStore.get(this.entity.outletUid);
        const inlet = this.globalStore.get(this.entity.inletUid);
        const retlet = this.entity.plant.type === PlantType.RETURN_SYSTEM ? this.globalStore.get(this.entity.plant.returnUid) : undefined;

        if (retlet instanceof SystemNode) {
            if (retlet.entity.systemUid !== this.entity.outletSystemUid) {
                retlet.entity.systemUid = this.entity.outletSystemUid;
            }

            if (
                Math.abs(retlet.entity.center.x - (this.entity.widthMM / 2) * (this.entity.rightToLeft ? -1 : 1)) > EPS
            ) {
                retlet.entity.center.x = (this.entity.widthMM / 2) * (this.entity.rightToLeft ? -1 : 1);
            }

            if (
                Math.abs(retlet.entity.center.y - (this.entity.heightMM / 4)) > EPS
            ) {
                retlet.entity.center.y = (this.entity.heightMM / 4);
            }
        }

        if (outlet instanceof SystemNode) {
            if (outlet.entity.systemUid !== this.entity.outletSystemUid) {
                outlet.entity.systemUid = this.entity.outletSystemUid;
            }

            if (
                Math.abs(outlet.entity.center.x - (this.entity.widthMM / 2) * (this.entity.rightToLeft ? -1 : 1)) > EPS
            ) {
                outlet.entity.center.x = (this.entity.widthMM / 2) * (this.entity.rightToLeft ? -1 : 1);
            }
        }

        if (inlet instanceof SystemNode) {
            if (inlet.entity.systemUid !== this.entity.inletSystemUid) {
                inlet.entity.systemUid = this.entity.inletSystemUid;
            }

            if (
                Math.abs(inlet.entity.center.x - (-this.entity.widthMM / 2) * (this.entity.rightToLeft ? -1 : 1)) > EPS
            ) {
                inlet.entity.center.x = (-this.entity.widthMM / 2) * (this.entity.rightToLeft ? -1 : 1);
            }
        }
    }

    getCopiedObjects(): BaseBackedObject[] {
        return [this, ...this.getInletsOutlets()];
    }

    costBreakdown(context: CalculationContext): CostBreakdown | null {
        // determine type of plant
        switch (this.entity.plant.type) {
            case PlantType.RETURN_SYSTEM:
                if (this.entity.inletSystemUid === StandardFlowSystemUids.HotWater &&
                    this.entity.outletSystemUid === StandardFlowSystemUids.HotWater
                ) {
                    return {
                        cost: context.priceTable.Plants["Hot Water Plant"],
                        breakdown: [{
                            qty: 1,
                            path: `Plants.Hot Water Plant`,
                        }],
                    };
                } else {
                    return {
                        cost: context.priceTable.Plants.Custom,
                        breakdown: [{
                            qty: 1,
                            path: `Plants.Custom`,
                        }],
                    };
                }
            case PlantType.TANK:
                return {
                    cost: context.priceTable.Plants["Storage Tank"],
                    breakdown: [{
                        qty: 1,
                        path: `Plants.Storage Tank`,
                    }],
                };
            case PlantType.CUSTOM:
                return {
                    cost: context.priceTable.Plants.Custom,
                    breakdown: [{
                        qty: 1,
                        path: `Plants.Custom`,
                    }],
                };
            case PlantType.PUMP:
                return {
                    cost: context.priceTable.Plants.Pump,
                    breakdown: [{
                        qty: 1,
                        path: `Plants.Pump`,
                    }],
                };
        }
        assertUnreachable(this.entity.plant);
    }
}
