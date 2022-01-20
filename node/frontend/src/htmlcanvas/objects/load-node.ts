import BaseBackedObject from "../lib/base-backed-object";
import BackedConnectable from "../lib/BackedConnectable";
import LoadNodeEntity, { NodeType } from "../../../../common/src/api/document/entities/load-node-entity";
import { Calculated, CalculatedObject } from "../lib/object-traits/calculated-object";
import Connectable, { ConnectableObject } from "../lib/object-traits/connectable";
import { CenteredObject } from "../lib/object-traits/centered-object";
import { CostBreakdown, DrawingContext } from "../lib/types";
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
import {
    ConnectableEntityConcrete,
    DrawableEntityConcrete, hasExplicitSystemUid
} from "../../../../common/src/api/document/entities/concrete-entity";
import { SnappableObject } from "../lib/object-traits/snappable-object";
import { getHighlightColor } from "../lib/utils";
import { assertUnreachable, isDrainage, isGas, StandardFlowSystemUids } from "../../../../common/src/api/config";
import { DEFAULT_FONT_NAME } from "../../../src/config";
import { Interaction, InteractionType } from "../lib/interaction";
import { determineConnectableSystemUid } from "../../store/document/entities/lib";
import Pipe from "./pipe";
import { Direction } from "../types";
import { isSameWorldPX } from "../on-screen-items";
import { NoFlowAvailableReason } from "../../store/document/calculations/pipe-calculation";

@SelectableObject
@CenterDraggableObject
@CalculatedObject
@ConnectableObject({ customCopyObjects: true })
@CenteredObject
@SnappableObject
export default class LoadNode extends BackedConnectable<LoadNodeEntity> implements Calculated, Connectable {
    get maximumConnections(): number | null {
        switch (this.entity.node.type) {
            case NodeType.LOAD_NODE:
                return 2;
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

        const filled = fillDefaultLoadNodeFields(context.doc, this.globalStore, this.entity, context.catalog, context.nodes);

        const thisIsGas = isGas(filled.systemUidOption!, context.catalog.fluids, context.doc.drawing.metadata.flowSystems);

        if (args.selected || args.overrideColorList.length) {
            const sr = Math.max(baseRadius + 20, vp.surfaceToWorldLength(baseRadius / 50 + 2));

            ctx.fillStyle = rgb2style(getHighlightColor(
                args.selected,
                args.overrideColorList,
                { hex: lighten(filled.color!.hex, 50) },
            ));

            ctx.beginPath();
            this.strokeShape(context, sr);
            ctx.fill();
        }

        ctx.fillStyle = filled.color!.hex;
        if (args.withCalculation) {
            const calculation = this.globalStore.getOrCreateCalculation(this.entity);
            if (!calculation.pressureKPA && !thisIsGas) {
                ctx.fillStyle = "#888888";
            }
        }

        ctx.strokeStyle = lighten(filled.color!.hex, -10);
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

        const currentLoc = this.toObjectCoord(this.globalStore.get(this.entity.uid)!.toWorldCoord());

        let name = "";
        let newx = currentLoc.x;
        let newy = currentLoc.y;
        let distance = 210; // the 210 represents the distance from midpoint to new coordinates
        if (!this.entity.linkedToUid) {
            distance = -210;
        }

        if (typeof this.entity.customNodeId !== "undefined") {
            name = context.nodes.find(node => node.id === this.entity.customNodeId || node.uid === this.entity.customNodeId)!.name;

            const entities = Array.from((this.globalStore.entitiesInLevel.get(this.document.uiState.levelUid) || new Set()).values()).map((u) => this.globalStore.get(u)!.entity);

            // get the other node
            let other = null;
            if (!this.entity.linkedToUid) {
                for (let i = 0; i < entities.length; i++) {
                    let e = entities[i];
                    if (e.type === EntityType.LOAD_NODE && e.linkedToUid === this.entity.uid) {
                        other = this.globalStore.get(e.uid);
                    }
                }
            } else {
                other = this.globalStore.get(this.entity.linkedToUid);
            }

            if (other) {
                const otherLoc = this.toObjectCoord(other.toWorldCoord());
                // to get midpoint
                const midx = (otherLoc.x + currentLoc.x) / 2;
                const midy = (otherLoc.y + currentLoc.y) / 2;

                const angleAB = Math.atan2(otherLoc.y - currentLoc.y, otherLoc.x - currentLoc.x);
                // to get the angle of the line from minpoint to a new coordinates, add 90 degrees
                // in radians, that is Math.PI / 2
                const angleCD = angleAB + Math.PI / 2;
                // now we can get the new coordinates
                newx = midx + distance * Math.cos(angleCD);
                newy = midy + distance * Math.sin(angleCD);
            } else {
                newy += distance
            }
        } else if (typeof this.entity.name !== "undefined" && this.entity.name) {
            name = this.entity.name;
            newy += distance;
        }

        ctx.save();
        ctx.font = 70 + "pt " + DEFAULT_FONT_NAME;
        ctx.textBaseline = "top";
        const nameWidth = ctx.measureText(name).width;
        const offsetx = nameWidth / 2;
        ctx.fillStyle = "#00ff1421";
        // the 70 represents the height of the font
        const textHight = 70;
        const offsetY = textHight / 2;
        ctx.fillRect(newx - offsetx, newy - offsetY, nameWidth, 70);
        ctx.fillStyle = "#007b1c";
        ctx.fillText(name, newx - offsetx, newy - offsetY - 4);
        ctx.restore();
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

    flowSystemsCompatible(a: string, b: string): boolean {
        if (a === b) {
            return true;
        }
        if (isDrainage(a, this.document.drawing.metadata.flowSystems)) {
            return true;
        }
        return false;
    }

    offerInteraction(interaction: Interaction): DrawableEntityConcrete[] | null {
        const result = super.offerInteraction(interaction);
        if (result) {
            // the result is with the assumption that there are 2 max connections.
            // but the 2 connections is only to manage allowing a sewer connection.
            // So be more restrictive than the super behavior that allows 2 max connections,
            // and make sure that only sewer + other is allowed for that case.
            const connections = this.globalStore.getConnections(this.entity.uid);
            if (connections.length === 1) {
                // need to restrict it.
                const p1 = this.globalStore.get(connections[0]) as Pipe;
                const system1 = p1.entity.systemUid;
                let system2: string | null = null;

                switch (interaction.type) {
                    case InteractionType.CONTINUING_PIPE:
                    case InteractionType.STARTING_PIPE:
                        system2 = interaction.system.uid;
                        break;
                    case InteractionType.INSERT:
                        system2 = interaction.systemUid;
                        break;
                    case InteractionType.MOVE_ONTO_RECEIVE:
                        if (hasExplicitSystemUid(interaction.src)) {
                            system2 = interaction.src.systemUid;
                        }
                        break;
                    case InteractionType.MOVE_ONTO_SEND:
                        if (hasExplicitSystemUid(interaction.dest)) {
                            system2 = interaction.dest.systemUid;
                        }
                        break;
                    case InteractionType.EXTEND_NETWORK:
                        system2 = interaction.systemUid;
                        break;

                }

                if ((system2 && isDrainage(system2, this.document.drawing.metadata.flowSystems)) && !isDrainage(system1, this.document.drawing.metadata.flowSystems)) {
                    return result;
                } else if (isDrainage(system1, this.document.drawing.metadata.flowSystems) && !(system2 && isDrainage(system2, this.document.drawing.metadata.flowSystems))) {
                    return result;
                } else {
                    return null;
                }
            }
        }

        return result;
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

    costBreakdown(context: CalculationContext): CostBreakdown | null {
        const filled = fillDefaultLoadNodeFields(context.doc, context.globalStore, this.entity, context.catalog, context.nodes);
        switch (filled.node.type) {
            case NodeType.LOAD_NODE:
                switch (filled.systemUidOption) {
                    case StandardFlowSystemUids.HotWater:
                        return {
                            cost: context.priceTable.Node["Load Node - Hot"],
                            breakdown: [{
                                qty: 1,
                                path: `Node.Load Node - Hot`,
                            }],
                        };
                    case StandardFlowSystemUids.ColdWater:
                        return {
                            cost: context.priceTable.Node["Load Node - Cold"],
                            breakdown: [{
                                qty: 1,
                                path: `Node.Load Node - Cold`,
                            }],
                        };
                    default:
                        return {
                            cost: context.priceTable.Node["Load Node - Other"],
                            breakdown: [{
                                qty: 1,
                                path: `Node.Load Node - Other`,
                            }],
                        };
                }
            case NodeType.DWELLING:
                switch (filled.systemUidOption) {
                    case StandardFlowSystemUids.HotWater:
                        return {
                            cost: context.priceTable.Node["Dwelling Node - Hot"],
                            breakdown: [{
                                qty: 1,
                                path: `Node.Dwelling Node - Hot`,
                            }],
                        };
                    case StandardFlowSystemUids.ColdWater:
                        return {
                            cost: context.priceTable.Node["Dwelling Node - Cold"],
                            breakdown: [{
                                qty: 1,
                                path: `Node.Dwelling Node - Cold`,
                            }],
                        };
                    default:
                        return {
                            cost: context.priceTable.Node["Dwelling Node - Other"],
                            breakdown: [{
                                qty: 1,
                                path: `Node.Dwelling Node - Other`,
                            }],
                        };
                }
        }
        assertUnreachable(filled.node);
    }

    dragByBackConnectableEntity(context: CanvasContext, pipeUid: string, point: Coord, originCenter: Coord, direction?: Direction, skip?: boolean) {
        if (skip) {
            return;
        }
        if ((!direction || direction == Direction.Horizontal) && isSameWorldPX(this.entity.center.x, originCenter.x)) {
            this.debase(context);
            this.entity.center.x += point.x - originCenter.x;
            this.rebase(context);
        } else if ((!direction || direction == Direction.Vertical) && isSameWorldPX(this.entity.center.y, originCenter.y)) {
            this.debase(context);
            this.entity.center.y += point.y - originCenter.y;
            this.rebase(context);
        }
    }

    validateConnectionPoints(): boolean {
        const connections = this.globalStore.getConnections(this.entity.uid);
        if (!connections.length) {
            return false;
        }
        for (const conn of connections) {
            const pipe = this.globalStore.get(conn) as Pipe;
            const calc = this.globalStore.getOrCreateCalculation(pipe.entity);
            if (calc.noFlowAvailableReason === NoFlowAvailableReason.NO_SOURCE) {
                return false;
            }
        }
        return true;
    }
}
