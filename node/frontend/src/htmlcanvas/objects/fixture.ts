import BackedDrawableObject from "../../../src/htmlcanvas/lib/backed-drawable-object";
import BaseBackedObject from "../../../src/htmlcanvas/lib/base-backed-object";
import * as TM from "transformation-matrix";
import { Matrix } from "transformation-matrix";
import { decomposeMatrix, matrixScale } from "../../../src/htmlcanvas/utils";
import { MouseMoveResult, UNHANDLED } from "../../../src/htmlcanvas/types";
import Connectable from "../../../src/htmlcanvas/lib/object-traits/connectable";
import CenterDraggableObject from "../../../src/htmlcanvas/lib/object-traits/center-draggable-object";
import { Interaction, InteractionType } from "../../../src/htmlcanvas/lib/interaction";
import { CostBreakdown, DrawingContext } from "../../../src/htmlcanvas/lib/types";
import BigValveEntity from "../../../../common/src/api/document/entities/big-valve/big-valve-entity";
import DrawableObjectFactory from "../../../src/htmlcanvas/lib/drawable-object-factory";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import FixtureEntity, { fillFixtureFields, RoughInRecord } from "../../../../common/src/api/document/entities/fixtures/fixture-entity";
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
import FixtureCalculation from "../../store/document/calculations/fixture-calculation";
import Cached from "../lib/cached";
import { Coord, FlowSystemParameters } from "../../../../common/src/api/document/drawing";
import { cloneSimple } from "../../../../common/src/lib/utils";
import SystemNode from "./big-valve/system-node";
import { SnappableObject } from "../lib/object-traits/snappable-object";
import { isDrainage, StandardFlowSystemUids } from "../../../../common/src/api/config";
import { rgb2style } from "../../lib/utils";
import { flowSystemsCompatible, getHighlightColor } from "../lib/utils";
import Pipe from "./pipe";
import { drawPipeCap } from "../helpers/draw-helper";
import { Side } from "../helpers/side";
import store from "../../../src/store/store";

@CalculatedObject
@SelectableObject
@CenterDraggableObject
@CenteredObject
@SnappableObject
export default class Fixture extends BackedDrawableObject<FixtureEntity> implements Calculated {
    static register(): void {
        DrawableObjectFactory.registerEntity(EntityType.FIXTURE, Fixture);
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
                        TM.translate(0, -this.entity.pipeDistanceMM * 2),
                        TM.scale(scale),
                        TM.translate(0, -height / 2),
                        TM.rotate(-angle - Math.PI - delta)
                    ),
                    TM.transform(
                        TM.identity(),
                        TM.translate(wc.x, wc.y),
                        TM.rotate(angle + Math.PI + delta),
                        TM.translate(0, -this.entity.pipeDistanceMM * 6),
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

        const xm1 = -this.entity.pipeDistanceMM + (this.entity.pipeDistanceMM * -1) / 4;
        const x0 = -this.entity.pipeDistanceMM;
        const x1 = -this.entity.pipeDistanceMM + (this.entity.pipeDistanceMM * 1) / 4;
        const x2 = -this.entity.pipeDistanceMM + (this.entity.pipeDistanceMM * 2) / 4;
        const x3 = -this.entity.pipeDistanceMM + (this.entity.pipeDistanceMM * 3) / 4;
        const x4 = -this.entity.pipeDistanceMM + (this.entity.pipeDistanceMM * 4) / 4;
        const x5 = -this.entity.pipeDistanceMM + (this.entity.pipeDistanceMM * 5) / 4;
        const x6 = -this.entity.pipeDistanceMM + (this.entity.pipeDistanceMM * 6) / 4;
        const x7 = -this.entity.pipeDistanceMM + (this.entity.pipeDistanceMM * 7) / 4;
        const x8 = -this.entity.pipeDistanceMM + (this.entity.pipeDistanceMM * 8) / 4;
        const x9 = -this.entity.pipeDistanceMM + (this.entity.pipeDistanceMM * 9) / 4;

        const ym1 = 0 + (this.entity.pipeDistanceMM * -1) / 4;
        const y0 = 0;
        const y1 = 0 + (this.entity.pipeDistanceMM * 1) / 4;
        const y2 = 0 + (this.entity.pipeDistanceMM * 2) / 4;
        const y3 = 0 + (this.entity.pipeDistanceMM * 3) / 4;
        const y4 = 0 + (this.entity.pipeDistanceMM * 4) / 4;
        const y5 = 0 + (this.entity.pipeDistanceMM * 5) / 4;
        const y6 = 0 + (this.entity.pipeDistanceMM * 6) / 4;
        const y7 = 0 + (this.entity.pipeDistanceMM * 7) / 4;
        const y8 = 0 + (this.entity.pipeDistanceMM * 8) / 4;

        ctx.fillStyle = "rgba(230, 255, 230, 0.8)";
        ctx.strokeStyle = "#000";
        ctx.beginPath();
        if (this.entity.roughInsInOrder.length > 2) {
            ctx.fillRect(xm1, ym1, x9 - xm1, y7 - ym1);
            ctx.rect(xm1, ym1, x9 - xm1, y7 - ym1);
        } else {
            ctx.fillRect(x2, ym1, x6 - x2, y4 - ym1);
            ctx.rect(x2, ym1, x6 - x2, y4 - ym1);
        }
        ctx.stroke();

        if (selected || overrideColorList.length) {
            ctx.fillStyle = rgb2style(getHighlightColor(selected, overrideColorList, { hex: "#A0C8A0" }), 0.6);
            if (this.entity.roughInsInOrder.length > 2) {
                ctx.fillRect(xm1, ym1, x9 - xm1, y7 - ym1);
            } else {
                ctx.fillRect(x2, ym1, x6 - x2, y4 - ym1);
            }
        }

        ctx.strokeStyle = "#228800";

        ctx.beginPath();
        if (this.entity.roughInsInOrder.length > 2) {
            // double (cross)
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
            ctx.moveTo(x4, y0);
            ctx.lineTo(x4, y3);
            ctx.moveTo(x3, y1);
            ctx.lineTo(x5, y1);
        }

        ctx.stroke();

        for (const systemUidIter of Object.keys(this.entity.roughIns)) {
            const FS = context.doc.drawing.metadata.flowSystems.find((s) => s.uid === systemUidIter);

            if (!FS) { continue; }

            const roughIn = this.entity.roughIns[systemUidIter];
            const connectedPipe = this.getConnectedPipe(roughIn.uid, roughIn.allowAllSystems ? null : FS.uid);
            if (FS && !connectedPipe) {
                let startPoint = { top: 0, left: 0 };
                if (this.entity.roughInsInOrder.length > 2) {
                    startPoint =
                        FS.uid === StandardFlowSystemUids.WarmWater || FS.uid === StandardFlowSystemUids.HotWater
                            ? { top: y0, left: x2 }
                            : FS.uid === StandardFlowSystemUids.ColdWater
                                ? { top: y0, left: x6 }
                                : FS.uid === StandardFlowSystemUids.SewerDrainage
                                    ? { top: y0, left: x4 }
                                    : { top: 0, left: 0 };
                } else {
                    startPoint =
                        FS.uid === StandardFlowSystemUids.WarmWater || FS.uid === StandardFlowSystemUids.HotWater
                            ? { top: y0, left: x4 }
                            : FS.uid === StandardFlowSystemUids.ColdWater
                                ? { top: y0, left: x4 }
                                : FS.uid === StandardFlowSystemUids.SewerDrainage
                                    ? { top: y0, left: x4 }
                                    : { top: 0, left: 0 };
                }
                if (this.isFlowSystemActive(FS)) {
                    drawPipeCap(
                        ctx,
                        startPoint,
                        Side.TOP,
                        roughIn.allowAllSystems ? "gray" : FS.color.hex
                    );
                }
            }
        }
        this.withWorldAngle(context, { x: 0, y: this.entity.pipeDistanceMM * 1.2 }, () => {
            ctx.font = this.entity.pipeDistanceMM / 2 + "pt " + DEFAULT_FONT_NAME;
            const abbreviation = this.entity.abbreviation ? this.entity.abbreviation : "";
            const bounds = ctx.measureText(abbreviation);
            const left = -bounds.width / 2;
            ctx.fillStyle = "#000";
            // this.entityBacked.type==EntityType.FIXTURE ?20:-10

            ctx.fillText(
                abbreviation,
                left,
                this.entity.pipeDistanceMM * 0.3 + (this.entity.roughInsInOrder.length <= 2 ? 20 : -20)
            );
        });

        // Display Entity Name
        this.withWorldAngle(context, { x: 0, y: this.entity.pipeDistanceMM * 2 }, () => {
            if (this.entity.entityName) {
                const name = this.entity.entityName;
                ctx.font = 70 + "pt " + DEFAULT_FONT_NAME;
                ctx.textBaseline = "top";
                const nameWidth = ctx.measureText(name).width;
                const offsetx = - nameWidth / 2;
                ctx.fillStyle = "#00ff1421";
                // the 70 represents the height of the font
                const textHight = 70;
                const offsetY = textHight / 2;
                ctx.fillRect(offsetx, offsetY, nameWidth, 70);
                ctx.fillStyle = "#000";
                ctx.fillText(name, offsetx, offsetY - 4);
                ctx.textBaseline = "alphabetic";
            }
        });
    }

    getConnectedPipe(connectionUid: string, flowSystemUid: string | null): Pipe | undefined {
        for (const itemId of this.globalStore.getConnections(connectionUid)) {
            const item = this.globalStore.get(itemId);
            if (item && item.entityBacked &&
                item.entityBacked.type === EntityType.PIPE &&
                (!flowSystemUid || ((item as Pipe).entity.systemUid === flowSystemUid))) {
                return item as Pipe;
            }
        }
    }
    validateConnectionPoints(): boolean {
        for (const systemUidIter of Object.keys(this.entity.roughIns)) {
            const flowSystem = this.document.drawing.metadata.flowSystems.find((s) => s.uid === systemUidIter);
            const roughIn = this.entity.roughIns[systemUidIter];
            if (flowSystem &&
                !this.getConnectedPipe(roughIn.uid, roughIn.allowAllSystems ? null : flowSystem.uid)
                && this.isFlowSystemActive(flowSystem)) {
                return false;
            }
        }
        return true;
    }

    isFlowSystemActive(FS: FlowSystemParameters): boolean {
        return (this.document.uiState.pressureOrDrainage === "drainage" && isDrainage(FS.uid, this.document.drawing.metadata.flowSystems)) ||
            (this.document.uiState.pressureOrDrainage === "pressure" && !isDrainage(FS.uid, this.document.drawing.metadata.flowSystems));
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
        if (this.entity.roughInsInOrder.length > 2) {
            // double
            if (objectCoord.x >= -this.entity.pipeDistanceMM && objectCoord.x <= this.entity.pipeDistanceMM) {
                if (objectCoord.y >= 0 && objectCoord.y <= this.entity.pipeDistanceMM * 2) {
                    return true;
                }
            }
            return false;
        } else {
            // single
            if (objectCoord.x >= -this.entity.pipeDistanceMM / 2 && objectCoord.x <= this.entity.pipeDistanceMM / 2) {
                if (objectCoord.y >= 0 && objectCoord.y <= (this.entity.pipeDistanceMM * 3) / 4) {
                    return true;
                }
            }
            return false;
        }
    }

    @Cached((kek) => new Set(kek.getParentChain().map((o) => o.uid)))
    shape() {
        const p = new Flatten.Polygon();
        // tslint:disable-next-line:one-variable-per-declaration
        let l, t, r, b;
        if (this.entity.roughInsInOrder.length > 2) {
            l = (-this.entity.pipeDistanceMM * 5) / 4;
            r = (this.entity.pipeDistanceMM * 5) / 4;
            t = (-this.entity.pipeDistanceMM * 1) / 4;
            b = (this.entity.pipeDistanceMM * 7) / 4;
        } else {
            l = -this.entity.pipeDistanceMM / 2;
            r = this.entity.pipeDistanceMM / 2;
            t = -this.entity.pipeDistanceMM / 4;
            b = (this.entity.pipeDistanceMM * 4) / 4;
        }

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
        for (const suid of this.entity.roughInsInOrder) {
            result.push(...this.globalStore.get(this.entity.roughIns[suid].uid)!.prepareDelete(context));
        }
        result.push(this);

        return result;
    }

    offerJoiningInteraction(systemUid: string, interaction: Interaction) {
        for (const systemUidIter of Object.keys(this.entity.roughIns)) {
            if (flowSystemsCompatible(systemUid, systemUidIter, this.document.drawing)) {
                const obj = this.globalStore.get(this.entity.roughIns[systemUidIter].uid);
                if (obj && obj.offerInteraction(interaction)) {
                    return [obj.entity, this.entity];
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

    getCalculationEntities(context: CalculationContext): [FixtureEntity] {
        const e: FixtureEntity = cloneSimple(this.entity);
        e.uid += ".calculation";

        for (const suid of e.roughInsInOrder) {
            e.roughIns[suid].uid = this.globalStore
                .get(e.roughIns[suid].uid)!
                .getCalculationNode(context, this.uid).uid;
        }

        return [e];
    }

    collectCalculations(context: CalculationContext): FixtureCalculation {
        return context.globalStore.getOrCreateCalculation(this.getCalculationEntities(context)[0]);
    }

    rememberToRegister(): void {
        //
    }

    getNeighbours(): BaseBackedObject[] {
        const res: BaseBackedObject[] = [];
        for (const suid of this.entity.roughInsInOrder) {
            res.push(...this.globalStore.get(this.entity.roughIns[suid].uid)!.getNeighbours());
        }
        return res;
    }

    getCopiedObjects(): BaseBackedObject[] {
        const res: BaseBackedObject[] = [this];

        for (const suid of this.entity.roughInsInOrder) {
            res.push(this.globalStore.get(this.entity.roughIns[suid].uid)!);
        }

        return res;
    }

    onUpdate() {
        super.onUpdate();

        const filled = fillFixtureFields(
            this.document.drawing,
            store.getters['catalog/default'],
            this.entity,
        );

        const pipeDistanceMM = filled.pipeDistanceMM!;
        const xMat = [[], [], [0.0, 0.0], [0.0, -0.5, 0.5]];
        const yMat = [[], [], [-0.2, 0.0], [-0.2, 0.0, 0.0]];
        for (let i = 0; i < filled.roughInsInOrder.length; i++) {
            const suid = filled.roughInsInOrder[i];
            const ri = filled.roughIns[suid];
            const s = this.globalStore.get(ri.uid) as SystemNode;

            // sync the allowAllSystems setting
            if (s && ri.allowAllSystems !== s.entity.allowAllSystems) {
                s.entity.allowAllSystems = ri.allowAllSystems;
            }

            // update physical location of systemNodes
            if (s) {
                s.entity.center.x = pipeDistanceMM * xMat[filled.roughInsInOrder.length][i];
                s.entity.center.y = pipeDistanceMM * yMat[filled.roughInsInOrder.length][i];
            }
        }
    }

    costBreakdown(context: CalculationContext): CostBreakdown | null {
        const catalog = context.catalog.fixtures[this.entity.name];
        return {
            cost: context.priceTable.Fixtures[catalog.priceTableName],
            breakdown: [
                {
                    qty: 1,
                    path: `Fixtures.${catalog.priceTableName}`
                }
            ]
        };
    }
}