import BackedDrawableObject from "../../../../src/htmlcanvas/lib/backed-drawable-object";
import BaseBackedObject from "../../../../src/htmlcanvas/lib/base-backed-object";
import * as TM from "transformation-matrix";
import { Matrix } from "transformation-matrix";
import {lowerBoundNumberTable, matrixScale} from "../../../../src/htmlcanvas/utils";
import CenterDraggableObject from "../../../../src/htmlcanvas/lib/object-traits/center-draggable-object";
import { Interaction, InteractionType } from "../../../../src/htmlcanvas/lib/interaction";
import {CostBreakdown, DrawingContext} from "../../../../src/htmlcanvas/lib/types";
import BigValveEntity, {
    BigValveType,
    fillDefaultBigValveFields,
    SystemNodeEntity
} from "../../../../../common/src/api/document/entities/big-valve/big-valve-entity";
import DrawableObjectFactory from "../../../../src/htmlcanvas/lib/drawable-object-factory";
import { EntityType } from "../../../../../common/src/api/document/entities/types";
import { DrawableEntityConcrete } from "../../../../../common/src/api/document/entities/concrete-entity";
import CanvasContext from "../../../../src/htmlcanvas/lib/canvas-context";
import { SelectableObject } from "../../../../src/htmlcanvas/lib/object-traits/selectable";
import { CenteredObject } from "../../../../src/htmlcanvas/lib/object-traits/centered-object";
import {
    drawRpzdDouble,
    getHighlightColor,
    getRpzdHeadLoss,
    VALVE_HEIGHT_MM,
    VALVE_LINE_WIDTH_MM
} from "../../../../src/htmlcanvas/lib/utils";
import { CalculationContext } from "../../../../src/calculations/types";
import { FlowNode } from "../../../../src/calculations/calculation-engine";
import { DrawingArgs, EntityDrawingArgs } from "../../../../src/htmlcanvas/lib/drawable-object";
import {
    Calculated,
    CalculatedObject,
    FIELD_HEIGHT
} from "../../../../src/htmlcanvas/lib/object-traits/calculated-object";
import { CalculationData } from "../../../../src/store/document/calculations/calculation-field";
import { getValveK, rgb2color, rgb2style } from "../../../lib/utils";
import SystemNode from "./system-node";
import BigValveCalculation from "../../../store/document/calculations/big-valve-calculation";
import Flatten from "@flatten-js/core";
import Cached from "../../lib/cached";
import { ValveType } from "../../../../../common/src/api/document/entities/directed-valves/valve-types";
import {
    assertUnreachable,
    ComponentPressureLossMethod,
    StandardFlowSystemUids
} from "../../../../../common/src/api/config";
import { Color, Coord, coordDist2, SelectedMaterialManufacturer } from "../../../../../common/src/api/document/drawing";
import { cloneSimple, interpolateTable, parseCatalogNumberExact } from "../../../../../common/src/lib/utils";
import { SnappableObject } from "../../lib/object-traits/snappable-object";
import { fittingFrictionLossMH } from "../../../../src/calculations/pressure-drops";
import { prepareFill, prepareStroke } from "../../../../src/htmlcanvas/helpers/draw-helper";
import { DEFAULT_FONT_NAME } from "../../../../src/config";
import Pipe from "../pipe";
import store from "../../../../src/store/store";

export const BIG_VALVE_DEFAULT_PIPE_WIDTH_MM = 20;

@CalculatedObject
@SelectableObject
@CenterDraggableObject
@CenteredObject
@SnappableObject
export default class BigValve extends BackedDrawableObject<BigValveEntity> implements Calculated {
    static register(): void {
        DrawableObjectFactory.registerEntity(EntityType.BIG_VALVE, BigValve);
    }

    lastDrawnWorldRadius: number = 0; // for bounds detection

    drawEntity(context: DrawingContext, args: EntityDrawingArgs): void {
        switch (this.entity.valve.type) {
            case BigValveType.TMV:
                this.drawTmv(context, args);
                break;
            case BigValveType.TEMPERING:
                this.drawTemperingValve(context, args);
                break;
            case BigValveType.RPZD_HOT_COLD:
                this.drawHotColdRPZD(context, args);
                break;
        }

        // Display Entity Name
        this.withWorldAngle(context, { x: 0, y: this.entity.pipeDistanceMM / 2 }, () => {
            if (this.entity.entityName) {
                const name = this.entity.entityName;
                context.ctx.font = 70 + "pt " + DEFAULT_FONT_NAME;
                context.ctx.textBaseline = "top";
                const nameWidth = context.ctx.measureText(name).width;
                const offsetx = - nameWidth / 2;
                context.ctx.fillStyle = "#00ff1421";
                // the 70 represents the height of the font
                const textHight = 70;
                const offsetY = this.entity.pipeDistanceMM + textHight / 2;
                context.ctx.fillRect(offsetx, offsetY, nameWidth, 70);
                context.ctx.fillStyle = "#000";
                context.ctx.fillText(name, offsetx, offsetY - 4);
                context.ctx.textBaseline = "alphabetic";
            }
        });
    }

    drawTmv(context: DrawingContext, { selected, overrideColorList, withCalculation }: EntityDrawingArgs) {
        const { ctx, vp } = context;

        const l = -this.entity.pipeDistanceMM;
        const r = this.entity.pipeDistanceMM;
        const lm = l / 2;
        const rm = r / 2;
        const b = this.entity.pipeDistanceMM * 200 / 150;
        const bm = b / 2;
        const t = 0;
        const m = 0;

        const boxl = l * 1.2;
        const boxw = (r - l) * 1.2;
        const boxt = 0 - b * 0.1;
        const boxh = b * 1.2;

        const sw = 1;

        const scale = context.vp.currToSurfaceScale(ctx);
        ctx.lineWidth = Math.max(1 / scale, 10 * this.toWorldLength(1));
        ctx.strokeStyle = "#000";
        ctx.lineCap = "round";

        ctx.fillStyle ="rgba(255, 255, 255, 0.8)";
        prepareFill(this,ctx);
        ctx.fillRect(l, t, r - l, bm);
        ctx.strokeStyle = "#000";

        if (selected || overrideColorList.length) {
            ctx.fillStyle = rgb2style(getHighlightColor(selected, overrideColorList), 0.4);
                    prepareFill(this,ctx);
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
        ctx.lineTo(r * 0.8, b * 0.8);
        prepareStroke(this,ctx);
        ctx.stroke();
        
    }
  
    isActive(): boolean {
       return this.pressureDrainageActive();
    }

    drawTemperingValve(context: DrawingContext, { selected, overrideColorList }: EntityDrawingArgs) {
        const { ctx, vp } = context;

        const l = -this.entity.pipeDistanceMM;
        const r = this.entity.pipeDistanceMM;
        const b = this.entity.pipeDistanceMM * 200 / 150;
        const t = 0;

        ctx.lineWidth = VALVE_LINE_WIDTH_MM * 2;
        ctx.strokeStyle ="#222222";
        ctx.lineCap = "square";

        if (selected || overrideColorList.length) {
            ctx.fillStyle = rgb2style(getHighlightColor(selected, overrideColorList), 0.4);
            
            prepareFill(this,ctx);
            ctx.fillRect(l * 1.2, 0 - b * 0.1, (r - l) * 1.2, b * 1.2);
        }

        ctx.beginPath();
        ctx.moveTo(l, t);
        ctx.lineTo(r, t);
        ctx.moveTo(0, t);
        ctx.lineTo(0, b);
        prepareStroke(this,ctx);
        ctx.stroke();
    }

    drawHotColdRPZD(context: DrawingContext, { selected, overrideColorList }: EntityDrawingArgs) {
        const { ctx, vp } = context;
        const hotSystem = context.doc.drawing.metadata.flowSystems.find(
            (s) => s.uid === StandardFlowSystemUids.HotWater
        )!;
        const coldSystem = context.doc.drawing.metadata.flowSystems.find(
            (s) => s.uid === StandardFlowSystemUids.ColdWater
        )!;

        const l = -this.entity.pipeDistanceMM;
        const r = this.entity.pipeDistanceMM;
        const b = this.entity.pipeDistanceMM * 200 / 150;
        const t = 0;
        let highlight: Color | undefined = undefined;
        if (selected || overrideColorList.length) {
            highlight = rgb2color(getHighlightColor(selected, overrideColorList));
        }

        ctx.rotate(Math.PI / 2);
        ctx.translate(VALVE_HEIGHT_MM, 0);
        drawRpzdDouble(context, [coldSystem.color.hex, hotSystem.color.hex], highlight, this);
        ctx.translate(-VALVE_HEIGHT_MM, 0);
        ctx.rotate(-Math.PI / 2);
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
                TM.translate(0, -this.entity.pipeDistanceMM * 2),
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
    pressureDrainageActive(): boolean {
        
        return this.document.uiState.pressureOrDrainage==="pressure"
        
    }

    inBounds(objectCoord: Coord) {
         if (!this.isActive()) {
            return false;
        }
        if (Math.abs(objectCoord.x) <= this.entity.pipeDistanceMM) {
            if (objectCoord.y > -this.entity.pipeDistanceMM * 0.3) {
                if (objectCoord.y < this.entity.pipeDistanceMM * 200 / 150 * 1.2) {
                    return true;
                }
            }
        }
        return false;
    }

    prepareDelete(context: CanvasContext): BaseBackedObject[] {
        const list: BaseBackedObject[] = [];
        switch (this.entity.valve.type) {
            case BigValveType.TMV:
                list.push(...this.globalStore.get(this.entity.valve.coldOutputUid)!.prepareDelete(context));
                list.push(...this.globalStore.get(this.entity.valve.warmOutputUid)!.prepareDelete(context));
                break;
            case BigValveType.TEMPERING:
                list.push(...this.globalStore.get(this.entity.valve.warmOutputUid)!.prepareDelete(context));
                break;
            case BigValveType.RPZD_HOT_COLD:
                list.push(...this.globalStore.get(this.entity.valve.coldOutputUid)!.prepareDelete(context));
                list.push(...this.globalStore.get(this.entity.valve.hotOutputUid)!.prepareDelete(context));
                break;
            default:
                assertUnreachable(this.entity.valve);
        }
        list.push(
            ...this.globalStore.get(this.entity.coldRoughInUid)!.prepareDelete(context),
            ...this.globalStore.get(this.entity.hotRoughInUid)!.prepareDelete(context),
            this
        );
        return list;
    }

    getInletsOutlets(): SystemNode[] {
        const result: string[] = [this.entity.coldRoughInUid, this.entity.hotRoughInUid];
        switch (this.entity.valve.type) {
            case BigValveType.TMV:
                result.push(this.entity.valve.warmOutputUid, this.entity.valve.coldOutputUid);
                break;
            case BigValveType.TEMPERING:
                result.push(this.entity.valve.warmOutputUid);
                break;
            case BigValveType.RPZD_HOT_COLD:
                result.push(this.entity.valve.hotOutputUid, this.entity.valve.coldOutputUid);
                break;
            default:
                assertUnreachable(this.entity.valve);
        }
        return result.map((uid) => this.globalStore.get(uid) as SystemNode);
    }

    getOutlets(): SystemNode[] {
        const result: string[] = [];
        switch (this.entity.valve.type) {
            case BigValveType.TMV:
                result.push(this.entity.valve.warmOutputUid, this.entity.valve.coldOutputUid);
                break;
            case BigValveType.TEMPERING:
                result.push(this.entity.valve.warmOutputUid);
                break;
            case BigValveType.RPZD_HOT_COLD:
                result.push(this.entity.valve.hotOutputUid, this.entity.valve.coldOutputUid);
                break;
            default:
                assertUnreachable(this.entity.valve);
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

    getCalculationEntities(context: CalculationContext): [BigValveEntity] {
        const e: BigValveEntity = cloneSimple(this.entity);
        e.uid += ".calculation";

        e.hotRoughInUid = (this.globalStore.get(e.hotRoughInUid) as SystemNode).getCalculationNode(
            context,
            this.uid
        ).uid;
        e.coldRoughInUid = (this.globalStore.get(e.coldRoughInUid) as SystemNode).getCalculationNode(
            context,
            this.uid
        ).uid;

        switch (e.valve.type) {
            case BigValveType.TMV:
                e.valve.warmOutputUid = (this.globalStore.get(e.valve.warmOutputUid) as SystemNode).getCalculationNode(
                    context,
                    this.uid
                ).uid;
                e.valve.coldOutputUid = (this.globalStore.get(e.valve.coldOutputUid) as SystemNode).getCalculationNode(
                    context,
                    this.uid
                ).uid;
                break;
            case BigValveType.TEMPERING:
                e.valve.warmOutputUid = (this.globalStore.get(e.valve.warmOutputUid) as SystemNode).getCalculationNode(
                    context,
                    this.uid
                ).uid;
                break;
            case BigValveType.RPZD_HOT_COLD:
                e.valve.hotOutputUid = (this.globalStore.get(e.valve.hotOutputUid) as SystemNode).getCalculationNode(
                    context,
                    this.uid
                ).uid;
                e.valve.coldOutputUid = (this.globalStore.get(e.valve.coldOutputUid) as SystemNode).getCalculationNode(
                    context,
                    this.uid
                ).uid;
                break;
            default:
                assertUnreachable(e.valve);
        }

        return [e];
    }

    collectCalculations(context: CalculationContext): BigValveCalculation {
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
        const entity = this.entity;

        // it is directional so we must guard every one.
        let valid = false;
        switch (entity.valve.type) {
            case BigValveType.TMV:
                if (from.connectable === entity.hotRoughInUid && to.connectable === entity.valve.warmOutputUid) {
                    valid = true;
                }
                if (from.connectable === entity.coldRoughInUid && to.connectable === entity.valve.coldOutputUid) {
                    valid = true;
                }
                break;
            case BigValveType.TEMPERING:
                if (from.connectable === entity.hotRoughInUid && to.connectable === entity.valve.warmOutputUid) {
                    valid = true;
                }
                break;
            case BigValveType.RPZD_HOT_COLD:
                if (from.connectable === entity.hotRoughInUid && to.connectable === entity.valve.hotOutputUid) {
                    valid = true;
                }
                if (from.connectable === entity.coldRoughInUid && to.connectable === entity.valve.coldOutputUid) {
                    valid = true;
                }
                break;
        }
        if (!valid) {
            // Water not flowing the correct direction
            return sign * (1e10 + flowLS);
        }

        switch (context.drawing.metadata.calculationParams.componentPressureLossMethod) {
            case ComponentPressureLossMethod.INDIVIDUALLY:
                // Find pressure loss from pipe size changes
                break;
            case ComponentPressureLossMethod.PERCENT_ON_TOP_OF_PIPE:
                return 0;
            default:
                assertUnreachable(context.drawing.metadata.calculationParams.componentPressureLossMethod);
        }

        // The actial pressure drop depends on the connection
        let pdKPA: number | null = null;
        if (entity.valve.type === BigValveType.RPZD_HOT_COLD) {
            const systemUid = (globalStore.get(from.connectable)!.entity as SystemNodeEntity).systemUid;
            const calcs = context.globalStore.getOrCreateCalculation(this.entity);
            const size = calcs.rpzdSizeMM![systemUid]!;
            const res = getRpzdHeadLoss(
                context,
                this.entity.valve.catalogId,
                size,
                flowLS,
                systemUid,
                ValveType.RPZD_SINGLE
            );
            return res;
        } else if (from.connectable === entity.coldRoughInUid) {
            if (entity.valve.type === BigValveType.TEMPERING || to.connectable !== entity.valve.coldOutputUid) {
                throw new Error("Invalid configuration - cold input must connect to cold out only");
            }

            // pressure drop is an elbow and a tee for the cold part.
            const kValue1 = getValveK("tThruBranch", context.catalog, BIG_VALVE_DEFAULT_PIPE_WIDTH_MM);
            const kValue2 = getValveK("90Elbow", context.catalog, BIG_VALVE_DEFAULT_PIPE_WIDTH_MM);

            if (kValue1 === null || kValue2 === null) {
                return null;
            }

            const kValue = kValue1 + kValue2;
            const volLM = (BIG_VALVE_DEFAULT_PIPE_WIDTH_MM ** 2 * Math.PI) / 4 / 1000;
            const velocityMS = flowLS / volLM;
            return sign * fittingFrictionLossMH(velocityMS, kValue, ga);
        } else {
            switch (entity.valve.type) {
                case BigValveType.TMV: {
                    const manufacturer = drawing.metadata.catalog.mixingValves.find((material: SelectedMaterialManufacturer) => material.uid === 'tmv')?.manufacturer || 'generic';
                    const pdKPAfield = interpolateTable(catalog.mixingValves.tmv.pressureLossKPAbyFlowRateLS[manufacturer], flowLS);
                    pdKPA = parseCatalogNumberExact(pdKPAfield);
                    break;
                }
                case BigValveType.TEMPERING: {
                    const manufacturer = drawing.metadata.catalog.mixingValves.find((material: SelectedMaterialManufacturer) => material.uid === 'temperingValve')?.manufacturer || 'generic';
                    const pdKPAfield = interpolateTable(
                        catalog.mixingValves.temperingValve.pressureLossKPAbyFlowRateLS[manufacturer],
                        flowLS
                    );
                    pdKPA = parseCatalogNumberExact(pdKPAfield);
                    break;
                }
                default:
                    assertUnreachable(entity.valve);
            }
            if (pdKPA === null) {
                throw new Error("pressure drop for TMV not available");
            }
        }

        const systemUid1 = (globalStore.get(from.connectable)!.entity as SystemNodeEntity).systemUid;
        const fluid = drawing.metadata.flowSystems.find((s) => s.uid === systemUid1)!.fluid;
        const density = parseCatalogNumberExact(catalog.fluids[fluid].densityKGM3)!;

        // https://neutrium.net/equipment/conversion-between-head-and-pressure/
        return sign * ((pdKPA * 1000) / (density * ga));
    }

    rememberToRegister(): void {
        //
    }

    getNeighbours(): BaseBackedObject[] {
        const res: BaseBackedObject[] = [];
        for (const sn of this.getInletsOutlets()) {
            if (sn) {
                res.push(...sn.getNeighbours());
            }
        }
        return res;
    }

    getOutPipes(): Pipe[] {
        const res: Pipe[] = [];
        for (const sn of this.getOutlets()) {
            if (sn) {
                res.push(...sn.getConnetectedSidePipe(''));
            }
        }
        return res;
    }

    getCopiedObjects(): BaseBackedObject[] {
        return [this, ...this.getInletsOutlets()];
    }

    @Cached((kek) => new Set(kek.getParentChain().map((o) => o.uid)))
    shape(): Flatten.Segment | Flatten.Point | Flatten.Polygon | Flatten.Circle | null {
        return super.shape();
    }

    onUpdate() {
        super.onUpdate();

        const filled = fillDefaultBigValveFields(
            store.getters['catalog/default'],
            this.entity,
            this.document.drawing,
        );

        const coldRoughIn = this.globalStore.get(filled.coldRoughInUid);
        const hotRoughIn = this.globalStore.get(filled.hotRoughInUid);
        let hotOutput, coldOutput, warmOutput;

        const pipeDistanceMM = filled.pipeDistanceMM!;
        const valveLengthMM = pipeDistanceMM * 200 / 150;

        if (coldRoughIn instanceof SystemNode) {
            coldRoughIn.entity.center.x = pipeDistanceMM / 2;
        }

        if (hotRoughIn instanceof SystemNode) {
            hotRoughIn.entity.center.x = -pipeDistanceMM / 2;
        }

        switch (filled.valve.type) {
            case BigValveType.TMV:
                coldOutput = this.globalStore.get(filled.valve.coldOutputUid);
                warmOutput = this.globalStore.get(filled.valve.warmOutputUid);
                if (coldOutput && coldOutput instanceof SystemNode) {
                    coldOutput.entity.center.x = pipeDistanceMM / 2;
                    coldOutput.entity.center.y = valveLengthMM / 2;
                }

                if (warmOutput && warmOutput instanceof SystemNode) {
                    warmOutput.entity.center.x = -pipeDistanceMM / 2;
                    warmOutput.entity.center.y = valveLengthMM / 2;
                }
                break;
            case BigValveType.TEMPERING:
                warmOutput = this.globalStore.get(filled.valve.warmOutputUid);
                if (warmOutput && warmOutput instanceof SystemNode) {
                    warmOutput.entity.center.y = valveLengthMM / 2;
                }
                break;
            case BigValveType.RPZD_HOT_COLD:
                hotOutput = this.globalStore.get(filled.valve.hotOutputUid);
                coldOutput = this.globalStore.get(filled.valve.coldOutputUid);
                if (coldOutput && coldOutput instanceof SystemNode) {
                    coldOutput.entity.center.x = pipeDistanceMM / 2;
                    coldOutput.entity.center.y = valveLengthMM / 2;
                }

                if (hotOutput && hotOutput instanceof SystemNode) {
                    hotOutput.entity.center.x = -pipeDistanceMM / 2;
                    hotOutput.entity.center.y = valveLengthMM / 2;
                }
                break;
        }
    }

    costBreakdown(context: CalculationContext): CostBreakdown | null {
        switch (this.entity.valve.type) {
            case BigValveType.TMV:
                return {
                    cost: context.priceTable.Equipment.TMV,
                    breakdown: [{
                        qty: 1,
                        path: `Equipment.TMV`,
                    }],
                };
            case BigValveType.TEMPERING:
                return {
                    cost: context.priceTable.Equipment["Tempering Valve"],
                    breakdown: [{
                        qty: 1,
                        path: `Equipment.Tempering Valve`,
                    }],
                };
            case BigValveType.RPZD_HOT_COLD:
                const calc = context.globalStore.getOrCreateCalculation(this.entity);
                if (!calc.rpzdSizeMM) {
                    return null;
                }
                const hotSize = calc.rpzdSizeMM[StandardFlowSystemUids.HotWater];
                const coldSize = calc.rpzdSizeMM[StandardFlowSystemUids.ColdWater];

                const realHotSize = lowerBoundNumberTable(calc.rpzdSizeMM, hotSize);
                const realColdSize = lowerBoundNumberTable(calc.rpzdSizeMM, coldSize);

                if (realHotSize !== null && realColdSize !== null) {
                    return {
                        cost: context.priceTable.Equipment.RPZD[realHotSize!] + context.priceTable.Equipment.RPZD[realColdSize!],
                        breakdown: [
                            {
                                qty: 1,
                                path: `Equipment.RPZD.${realColdSize}`,
                            },
                            {
                                qty: 1,
                                path: `Equipment.RPZD.${realHotSize}`,
                            },
                        ],
                    };
                } else {
                    return {cost: 0, breakdown: []};
                }

            default:
                assertUnreachable(this.entity.valve);
        }
        return null;
    }
}
