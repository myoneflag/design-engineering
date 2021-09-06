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
import { EntityDrawingArgs } from "../../../src/htmlcanvas/lib/drawable-object";
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
import { Coord, coordDist2, FlowSystemParameters } from "../../../../common/src/api/document/drawing";
import { cloneSimple, EPS } from "../../../../common/src/lib/utils";
import { PlantType, ReturnSystemPlant } from "../../../../common/src/api/document/entities/plants/plant-types";
import { assertUnreachable, StandardFlowSystemUids } from "../../../../common/src/api/config";
import { SnappableObject } from "../lib/object-traits/snappable-object";
import { rgb2style } from "../../lib/utils";
import Pipe from "./pipe";
import { drawPipeCap, drawRectangles } from "../helpers/draw-helper";
import { Side } from "../helpers/side";
import { DrainageGreaseInterceptorTrap } from './../../../../common/src/api/document/entities/plants/plant-types';

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
            const lastAlpha = ctx.globalAlpha;

            if (!this.isActive()) {
                ctx.globalAlpha = 0.5;
            }

            let entitywidthMM = this.entity.widthMM;
            let entityHeightMM = this.entity.heightMM;

            if (this.entity.plant.type === PlantType.DRAINAGE_GREASE_INTERCEPTOR_TRAP) {
                entityHeightMM = this.entity.widthMM;
                entitywidthMM = this.entity.lengthMM!;
            }

            const l = -entitywidthMM / 2;
            const r = entitywidthMM / 2;
            const b = entityHeightMM / 2;
            const t = -entityHeightMM / 2;

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

            const inletFS = context.doc.drawing.metadata.flowSystems.find((s) => s.uid === this.entity.inletSystemUid);
            const outletFS = context.doc.drawing.metadata.flowSystems.find(
                (s) => s.uid === this.entity.outletSystemUid
            );
            const GasFS = context.doc.drawing.metadata.flowSystems.find((s) => s.uid === "gas");
         
            const middleOfBox=t - (t - b) / 2;
               const capTop = middleOfBox - 23;
            const widthOfConnectionPoint=70;
            const heightOfConnectionPoint=10;
            const secondConnectionTop=t - (3 * (t - b)) / 4;
            const secondConnectionCapTop = secondConnectionTop-23;
            if (inletFS && !this.getConnectedPipe(this.entity.inletUid, inletFS)) {
                
                drawRectangles(ctx, [
                    {
                        point: { left: l - widthOfConnectionPoint, top: middleOfBox },
                        width: widthOfConnectionPoint,
                        height: heightOfConnectionPoint,
                        strokeStyle: inletFS?.color.hex || ""
                    }
                ]);
                drawPipeCap(ctx, { top: capTop, left: l - widthOfConnectionPoint - 10 }, Side.LEFT);
              
            }
            if (outletFS && !this.getConnectedPipe(this.entity.outletUid, outletFS)) {
                drawRectangles(ctx, [
                    {
                        point: { left: r, top: middleOfBox },
                        width: widthOfConnectionPoint,
                        height: heightOfConnectionPoint,
                        strokeStyle:outletFS?.color.hex || ""
                    }
                ]);
               
                drawPipeCap(ctx, { top: capTop, left: r + widthOfConnectionPoint + 10 }, Side.RIGHT);
                  

            }

            if (this.entity.plant.type === PlantType.RETURN_SYSTEM) {
                const gasUId = (this.entity.plant as ReturnSystemPlant).gasNodeUid;
                const returnUid = (this.entity.plant as ReturnSystemPlant).returnUid;
                if (GasFS && !this.getConnectedPipe(gasUId, GasFS)) {
                  
                    drawRectangles(ctx, [
                        {
                            point: { left: l - widthOfConnectionPoint, top: secondConnectionTop },
                            width: widthOfConnectionPoint,
                            height: heightOfConnectionPoint,
                            strokeStyle: GasFS?.color.hex || ""
                        }
                    ]);
                    drawPipeCap(
                        ctx,
                        { top: secondConnectionCapTop, left: l - widthOfConnectionPoint- 10 },
                        Side.LEFT
                    );
                }
                if (outletFS && !this.getConnectedPipe(returnUid, outletFS)) {
                   drawRectangles(ctx, [
                       {
                           point: { left: r, top: secondConnectionTop },
                           width: widthOfConnectionPoint,
                           height: heightOfConnectionPoint,
                           strokeStyle: outletFS?.color.hex || ""
                       }
                   ]);

                   drawPipeCap(ctx, { top: secondConnectionCapTop, left: r + widthOfConnectionPoint + 10 }, Side.RIGHT);
                }
            }
            ctx.fillStyle = "rgba(0, 0, 0, 0.2)";

            const ts = Math.min(entitywidthMM, entityHeightMM) * 0.7;
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

            const name = this.resolveDisplayName(context, this.entity);

            const fontSize = Math.round(this.toWorldLength(entitywidthMM) / name.length);
            ctx.font = fontSize + "px " + DEFAULT_FONT_NAME;
            const measure = ctx.measureText(name.toUpperCase());

            ctx.fillStyle = "#000000";
            ctx.fillText(name.toUpperCase(), -measure.width / 2, +fontSize / 3);

            ctx.globalAlpha = lastAlpha;
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

    isActive() {
        let iAmDrainage = false;
        let iAmPressure = false;
        switch (this.entity.plant.type) {
            case PlantType.RETURN_SYSTEM:
            case PlantType.TANK:
            case PlantType.PUMP:
                iAmPressure = true;
                break;
            case PlantType.CUSTOM:
                iAmDrainage = iAmPressure = true;
                break;
            case PlantType.DRAINAGE_PIT:
            case PlantType.DRAINAGE_GREASE_INTERCEPTOR_TRAP:
                iAmDrainage = true;
                break;
            default:
                assertUnreachable(this.entity.plant);
        }

        return (this.document.uiState.pressureOrDrainage === 'drainage' && iAmDrainage) ||
            (this.document.uiState.pressureOrDrainage === 'pressure' && iAmPressure);
    }
    getConnectedPipe(connectionUid: string, flowSystem: FlowSystemParameters): any {
        // connectionUid can be :
        // this.entity.inletUid;
        // this.entity.outletUid; ,....
        const GlobalStoreObjects = Array.from(this.globalStore.values());
        return GlobalStoreObjects.find((item) => {
            return (
                item.entityBacked.type == EntityType.PIPE &&
                (item as Pipe).entity.endpointUid.indexOf(connectionUid) != -1 &&
                (item as Pipe).entity.systemUid == flowSystem.uid
            );
        });
    }
    validateConnectionPoints(): Boolean {
        const inletFS = this.document.drawing.metadata.flowSystems.find((s) => s.uid === this.entity.inletSystemUid);
        const outletFS = this.document.drawing.metadata.flowSystems.find((s) => s.uid === this.entity.outletSystemUid);

        if (inletFS && !this.getConnectedPipe(this.entity.inletUid, inletFS)) {
            return false;
        }
        if (outletFS && !this.getConnectedPipe(this.entity.outletUid, outletFS)) {
            return false;
        }
        return true;
    }
    locateCalculationBoxWorld(context: DrawingContext, data: CalculationData[], scale: number): TM.Matrix[] {
        const angle = (this.toWorldAngleDeg(0) / 180) * Math.PI;
        const height = data.length * FIELD_HEIGHT;
        const wc = this.toWorldCoord();

        let entitywidthMM = this.entity.widthMM;
        let entityHeightMM = this.entity.heightMM;

        if (this.entity.plant.type === PlantType.DRAINAGE_GREASE_INTERCEPTOR_TRAP) {
            entityHeightMM = this.entity.widthMM;
            entitywidthMM = this.entity.lengthMM!;
        }

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
            return [height, Math.max(entitywidthMM, entityHeightMM)].map((offset) => TM.transform(
                TM.identity(),
                TM.translate(wc.x, wc.y),
                TM.rotate(angle + Math.PI + delta),
                TM.translate(0, -Math.max(entitywidthMM, entityHeightMM) + offset),
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
        if (!this.isActive()) {
            return false;
        }
        let entitywidthMM = this.entity.widthMM;
        let entityHeightMM = this.entity.heightMM;

        if (this.entity.plant.type === PlantType.DRAINAGE_GREASE_INTERCEPTOR_TRAP) {
            entityHeightMM = this.entity.widthMM;
            entitywidthMM = this.entity.lengthMM!;
        }
        const capDistance = 100;

        const l = -entitywidthMM / 2 -capDistance;
        const r = entitywidthMM / 2 + capDistance;
        const b = entityHeightMM / 2 + capDistance;
        const t = -entityHeightMM/ 2 - capDistance;
        if(objectCoord.x >= l && objectCoord.y >= t &&  objectCoord.x <= r  && objectCoord.y <= b )
            return true;
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
                result.push(this.entity.plant.gasNodeUid);
                break;
            case PlantType.TANK:
            case PlantType.CUSTOM:
            case PlantType.PUMP:
            case PlantType.DRAINAGE_PIT:
            case PlantType.DRAINAGE_GREASE_INTERCEPTOR_TRAP:
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
                e.plant.gasNodeUid = (this.globalStore.get(e.plant.gasNodeUid) as SystemNode).getCalculationNode(context, this.uid).uid;
                break;
            case PlantType.TANK:
            case PlantType.CUSTOM:
            case PlantType.PUMP:
            case PlantType.DRAINAGE_PIT:
            case PlantType.DRAINAGE_GREASE_INTERCEPTOR_TRAP:
                break;
            default:
                assertUnreachable(e.plant);
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
        const gaslet = this.entity.plant.type === PlantType.RETURN_SYSTEM ? this.globalStore.get(this.entity.plant.gasNodeUid) : undefined;

        let entitywidthMM = this.entity.widthMM;
        let entityHeightMM = this.entity.heightMM;

        if (this.entity.plant.type === PlantType.DRAINAGE_GREASE_INTERCEPTOR_TRAP) {
            entityHeightMM = this.entity.widthMM;
            entitywidthMM = this.entity.lengthMM!;
        }

        if (retlet instanceof SystemNode) {
            if (retlet.entity.systemUid !== this.entity.outletSystemUid) {
                retlet.entity.systemUid = this.entity.outletSystemUid;
            }

            if (
                Math.abs(retlet.entity.center.x - (entitywidthMM / 2) * (this.entity.rightToLeft ? -1 : 1)) > EPS
            ) {
                retlet.entity.center.x = (entitywidthMM / 2) * (this.entity.rightToLeft ? -1 : 1);
            }

            if (
                Math.abs(retlet.entity.center.y - (entityHeightMM / 4)) > EPS
            ) {
                retlet.entity.center.y = (entityHeightMM / 4);
            }
        }

        if (outlet instanceof SystemNode) {
            if (outlet.entity.systemUid !== this.entity.outletSystemUid) {
                outlet.entity.systemUid = this.entity.outletSystemUid;
            }

            if (
                Math.abs(outlet.entity.center.x - (entitywidthMM / 2) * (this.entity.rightToLeft ? -1 : 1)) > EPS
            ) {
                outlet.entity.center.x = (entitywidthMM / 2) * (this.entity.rightToLeft ? -1 : 1);
            }
        }

        if (inlet instanceof SystemNode) {
            if (inlet.entity.systemUid !== this.entity.inletSystemUid) {
                inlet.entity.systemUid = this.entity.inletSystemUid;
            }

            if (
                Math.abs(inlet.entity.center.x - (-entitywidthMM / 2) * (this.entity.rightToLeft ? -1 : 1)) > EPS
            ) {
                inlet.entity.center.x = (-entitywidthMM / 2) * (this.entity.rightToLeft ? -1 : 1);
            }
        }

        if (gaslet instanceof SystemNode) {

            if (
                Math.abs(gaslet.entity.center.x - (entitywidthMM / 2) * (this.entity.rightToLeft ? 1 : -1)) > EPS
            ) {
                gaslet.entity.center.x = (entitywidthMM / 2) * (this.entity.rightToLeft ? 1 : -1);
            }

            if (
                Math.abs(gaslet.entity.center.y - (entityHeightMM / 4)) > EPS
            ) {
                gaslet.entity.center.y = (entityHeightMM / 4);
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
                if (this.entity.inletSystemUid === StandardFlowSystemUids.ColdWater &&
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
            case PlantType.DRAINAGE_PIT:
                return {
                    cost: context.priceTable.Equipment["Drainage Pit"],
                    breakdown: [{
                        qty: 1,
                        path: 'Equipment.Drainage Pit',
                    }],
                };
            case PlantType.DRAINAGE_GREASE_INTERCEPTOR_TRAP:
                return {
                    cost: context.priceTable.Equipment["Grease Interceptor Trap"],
                    breakdown: [{
                        qty: 1,
                        path: 'Equipment.Grease Interceptor Trap',
                    }],
                };
        }
        assertUnreachable(this.entity.plant);
    }

    resolveDisplayName(context: DrawingContext, entity: PlantEntity): string {
        let name = this.entity.name;
        switch(entity.plant.type) {
            case PlantType.RETURN_SYSTEM:
            case PlantType.PUMP:
            case PlantType.TANK:
            case PlantType.DRAINAGE_PIT:
            case PlantType.CUSTOM:
                break;
            case PlantType.DRAINAGE_GREASE_INTERCEPTOR_TRAP:
                const catalog = context.catalog;
                const plant = this.entity.plant as DrainageGreaseInterceptorTrap;
                const manufacturer = context.doc.drawing.metadata.catalog.greaseInterceptorTrap![0]?.manufacturer || 'generic';
                
                let manufacturerName = '';
                if (manufacturer !== 'generic') {
                    manufacturerName = catalog.greaseInterceptorTrap!.manufacturer.find(i => i.uid === manufacturer)!.name + ' PANELTIM';
                }

                name = `${manufacturerName} ${plant.capacity} ${this.entity.name}`
                break;
            default:
                assertUnreachable(entity.plant);
        }

        return name;
    }
}
