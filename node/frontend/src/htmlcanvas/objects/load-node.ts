import BaseBackedObject from "../lib/base-backed-object";
import BackedConnectable from "../lib/BackedConnectable";
import LoadNodeEntity, { NodeType } from "../../../../common/src/api/document/entities/load-node-entity";
import { Calculated, CalculatedObject } from "../lib/object-traits/calculated-object";
import Connectable, { ConnectableObject } from "../lib/object-traits/connectable";
import { CenteredObject } from "../lib/object-traits/centered-object";
import { DrawingContext } from "../lib/types";
import { DrawingArgs, EntityDrawingArgs } from "../lib/drawable-object";
import { CalculationContext } from "../../calculations/types";
import { FlowNode } from "../../calculations/calculation-engine";
import CanvasContext from "../lib/canvas-context";
import LoadNodeCalculation from "../../store/document/calculations/load-node-calculation";
import { CalculationData } from "../../store/document/calculations/calculation-field";
import * as TM from "transformation-matrix";
import { getDragPriority } from "../../store/document";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import { lighten, rgb2style } from "../../lib/utils";
import Flatten from "@flatten-js/core";
import DrawableObjectFactory from "../lib/drawable-object-factory";
import { SelectableObject } from "../lib/object-traits/selectable";
import CenterDraggableObject from "../lib/object-traits/center-draggable-object";
import PipeEntity from "../../../../common/src/api/document/entities/pipe-entity";
import FittingEntity from "../../../../common/src/api/document/entities/fitting-entity";
import { Matrix } from "transformation-matrix";
import { Coord } from "../../../../common/src/api/document/drawing";
import { cloneSimple } from "../../../../common/src/lib/utils";
import { fillDefaultLoadNodeFields } from "../../store/document/entities/fillDefaultLoadNodeFields";
import { ConnectableEntityConcrete } from "../../../../common/src/api/document/entities/concrete-entity";
import { SnappableObject } from "../lib/object-traits/snappable-object";
import { getHighlightColor } from "../lib/utils";
import {assertUnreachable, StandardFlowSystemUids} from "../../../../common/src/api/config";

@SelectableObject
@CenterDraggableObject
@CalculatedObject
@ConnectableObject({customCopyObjects: true})
@CenteredObject
@SnappableObject
export default class LoadNode extends BackedConnectable<LoadNodeEntity> implements Calculated, Connectable {
    get maximumConnections(): number | null {
        switch (this.entity.node.type) {
            case NodeType.LOAD_NODE:
                return 1;
            case NodeType.DWELLING:
                return null;
        }
    }

    get position(): TM.Matrix {
        const scale = 1 / this.fromParentToWorldLength(1);
        return TM.transform(TM.translate(this.entity.center.x, this.entity.center.y), TM.scale(scale, scale));
    }

    get baseRadius() {
        if (this.entity.node.type === NodeType.DWELLING) {
            return 200;
        } else {
            return 150;
        }
    }

    static register(): void {
        DrawableObjectFactory.registerEntity(EntityType.LOAD_NODE, LoadNode);
    }
    dragPriority = getDragPriority(EntityType.LOAD_NODE);
    minimumConnections = 0;

    drawEntity(context: DrawingContext, args: EntityDrawingArgs): void {
        const { ctx, vp } = context;
        const baseRadius = this.baseRadius;
        const radius = Math.max(baseRadius, vp.surfaceToWorldLength(baseRadius / 50));

        const filled = fillDefaultLoadNodeFields(context.doc, this.globalStore, this.entity);

        if (args.selected || args.overrideColorList.length) {
            const sr = Math.max(baseRadius + 20, vp.surfaceToWorldLength(baseRadius / 50 + 2));

            ctx.fillStyle = rgb2style(getHighlightColor(
                args.selected,
                args.overrideColorList,
                {hex: lighten(filled.color!.hex, 50)},
            ));

            if (
                this.entity.node.type === NodeType.DWELLING &&
                !context.doc.drawing.metadata.calculationParams.dwellingMethod
            ) {
                ctx.fillStyle = rgb2style(getHighlightColor(
                    args.selected,
                    args.overrideColorList,
                    {hex: lighten(filled.color!.hex, 50)},
                ));
            }
            ctx.beginPath();
            this.strokeShape(context, sr);
            ctx.fill();
        }

        ctx.fillStyle = filled.color!.hex;
        if (args.withCalculation) {
            const calculation = this.globalStore.getOrCreateCalculation(this.entity);
            if (!calculation.pressureKPA) {
                ctx.fillStyle = "#888888";
            }
        }

        ctx.strokeStyle = lighten(filled.color!.hex, -10);
        if (
            this.entity.node.type === NodeType.DWELLING &&
            !context.doc.drawing.metadata.calculationParams.dwellingMethod
        ) {
            ctx.fillStyle = lighten(filled.color!.hex, -10, 0.5);
        }
        ctx.beginPath();
        this.strokeShape(context, radius);
        ctx.fill();

        if (this.entity.linkedToUid && !args.forExport) {
            // draw chain link
            const other = this.globalStore.get(this.entity.linkedToUid);
            if (other) {
                const lineWidth = Math.max(vp.surfaceToWorldLength(2), 20);
                const oe = other.entity as ConnectableEntityConcrete;
                const otherLoc = this.toObjectCoord(other.toWorldCoord());

                ctx.strokeStyle = "#000000";
                ctx.lineWidth = lineWidth;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(otherLoc.x, otherLoc.y);
                ctx.stroke();
            }
        }
    }

    strokeShape(context: DrawingContext, radius: number) {
        const { ctx, vp } = context;
        switch (this.entity.node.type) {
            case NodeType.LOAD_NODE:
                ctx.moveTo(0, radius);
                for (let i = 1; i < 6; i++) {
                    ctx.lineTo(Math.sin((Math.PI * 2 * i) / 6) * radius, Math.cos((Math.PI * 2 * i) / 6) * radius);
                }
                ctx.closePath();
                break;
            case NodeType.DWELLING:
                for (let i = 0.5; i < 3.5; i++) {
                    ctx.lineTo(
                        Math.sin((Math.PI * 2 * (i - 1)) / 4) * radius,
                        Math.cos((Math.PI * 2 * (i - 1)) / 4) * radius
                    );
                    ctx.lineTo(Math.sin((Math.PI * 2 * i) / 4) * radius, Math.cos((Math.PI * 2 * i) / 4) * radius);
                }
                ctx.closePath();
                break;
        }
    }

    getFrictionHeadLoss(
        context: CalculationContext,
        flowLS: number,
        from: FlowNode,
        to: FlowNode,
        signed: boolean
    ): number | null {
        return 0;
    }

    inBounds(objectCoord: Coord, objectRadius?: number): boolean {
        return objectCoord.x ** 2 + objectCoord.y ** 2 <= this.baseRadius ** 2;
    }

    shape(): Flatten.Circle | null {
        const wc = this.toWorldCoord();
        return Flatten.circle(Flatten.point(wc.x, wc.y), 150);
    }

    prepareDelete(context: CanvasContext): BaseBackedObject[] {
        return [];
    }

    rememberToRegister(): void {
        /**/
    }

    collectCalculations(context: CalculationContext): LoadNodeCalculation {
        const calcEnts = this.getCalculationEntities(context);
        if (calcEnts[0]) {
            return context.globalStore.getOrCreateCalculation(calcEnts[0]);
        } else {
            return context.globalStore.getOrCreateCalculation(this.entity);
        }
    }

    getCalculationEntities(context: CalculationContext): [LoadNodeEntity, ...Array<PipeEntity | FittingEntity>] | [] {
        const tower = this.getCalculationTower(context);
        const proj = cloneSimple(this.entity);
        if (tower.length === 0) {
            proj.uid = proj.uid + '.0';
            proj.calculationHeightM = 0;
            return [proj];
        }
        const res = tower.flat();
        proj.center = (res[0] as FittingEntity).center;
        proj.parentUid = res[0].parentUid;
        proj.uid = res[0].uid;
        proj.calculationHeightM = tower[0][0].calculationHeightM;

        // we have to set this to the original (canonical) so that we don't have to change children.
        proj.linkedToUid = proj.linkedToUid || this.entity.uid;

        return [proj, ...res.splice(1)];
    }

    locateCalculationBoxWorld(context: DrawingContext, data: CalculationData[], scale: number): TM.Matrix[] {
        return [];
    }


    getCopiedObjects(): BaseBackedObject[] {
        const res: BaseBackedObject[] = [this];
        if (this.entity.linkedToUid) {
            res.push(this.globalStore.get(this.entity.linkedToUid)!);
        }
        return res;
    }

    cost(context: CalculationContext): number | null {
        const filled = fillDefaultLoadNodeFields(context.doc, context.globalStore, this.entity);
        switch (filled.node.type) {
            case NodeType.LOAD_NODE:
                switch (filled.systemUidOption) {
                    case StandardFlowSystemUids.HotWater:
                        return context.priceTable.Node["Load Node - Hot"];
                    case StandardFlowSystemUids.ColdWater:
                        return context.priceTable.Node["Load Node - Cold"];
                    default:
                        return context.priceTable.Node["Load Node - Other"];
                }
            case NodeType.DWELLING:
                switch (filled.systemUidOption) {
                    case StandardFlowSystemUids.HotWater:
                        return context.priceTable.Node["Dwelling Node - Hot"];
                    case StandardFlowSystemUids.ColdWater:
                        return context.priceTable.Node["Dwelling Node - Cold"];
                    default:
                        return context.priceTable.Node["Dwelling Node - Other"];
                }
        }
        assertUnreachable(filled.node);
    }
}
