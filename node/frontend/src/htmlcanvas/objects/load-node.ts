import BaseBackedObject from "../lib/base-backed-object";
import BackedConnectable from "../lib/BackedConnectable";
import LoadNodeEntity, {fillDefaultLoadNodeFields, NodeType} from "../../store/document/entities/load-node-entity";
import {Calculated, CalculatedObject} from "../lib/object-traits/calculated-object";
import Connectable, {ConnectableObject} from "../lib/object-traits/connectable";
import {CenteredObject} from "../lib/object-traits/centered-object";
import {DrawingContext} from "../lib/types";
import {DrawingArgs} from "../lib/drawable-object";
import {CalculationContext} from "../../calculations/types";
import {FlowNode} from "../../calculations/calculation-engine";
import {Coord} from "../../store/document/types";
import CanvasContext from "../lib/canvas-context";
import LoadNodeCalculation from "../../store/document/calculations/load-node-calculation";
import {CalculationData} from "../../store/document/calculations/calculation-field";
import * as TM from 'transformation-matrix';
import {getDragPriority} from "../../store/document";
import {EntityType} from "../../store/document/entities/types";
import {cloneSimple, lighten} from "../../lib/utils";
import Flatten from '@flatten-js/core';
import DrawableObjectFactory from "../lib/drawable-object-factory";
import {SelectableObject} from "../lib/object-traits/selectable";
import CenterDraggableObject from "../lib/object-traits/center-draggable-object";
import PipeEntity from "../../store/document/entities/pipe-entity";
import FittingEntity from "../../store/document/entities/fitting-entity";

@SelectableObject
@CenterDraggableObject
@CalculatedObject
@ConnectableObject
@CenteredObject
export default class LoadNode extends BackedConnectable<LoadNodeEntity> implements Calculated, Connectable {
    dragPriority = getDragPriority(EntityType.LOAD_NODE);
    get maximumConnections(): number | null {
        switch (this.entity.node.type) {
            case NodeType.LOAD_NODE:
                return 1;
            case NodeType.DWELLING:
                return null;
        }
    };
    minimumConnections = 0;

    drawInternal(context: DrawingContext, args: DrawingArgs): void {
        const {ctx, vp} = context;
        let baseRadius = this.baseRadius;
        const radius = Math.max(baseRadius, vp.toWorldLength(baseRadius / 50));

        const filled = fillDefaultLoadNodeFields(context.doc, this.objectStore, this.entity);


        if (args.selected) {
            const sr = Math.max(baseRadius + 20, vp.toWorldLength(baseRadius / 50 + 2));

            ctx.fillStyle = lighten(filled.color!.hex, 50);
            if (this.entity.node.type === NodeType.DWELLING &&
                !context.doc.drawing.metadata.calculationParams.dwellingMethod
            ) {
                ctx.fillStyle = lighten(filled.color!.hex, 50, 0.5);
                console.log('making transparent');
            }
            ctx.beginPath();
            this.strokeShape(context, sr);
            ctx.fill();
        }

        ctx.fillStyle = filled.color!.hex;
        ctx.strokeStyle = lighten(filled.color!.hex, -10);
        if (this.entity.node.type === NodeType.DWELLING &&
            !context.doc.drawing.metadata.calculationParams.dwellingMethod
        ) {
            ctx.fillStyle = lighten(filled.color!.hex, -10, 0.5);
            console.log('making transparent');
        }
        ctx.beginPath();
        this.strokeShape(context, radius);
        ctx.fill();
    }

    get baseRadius() {
        if (this.entity.node.type === NodeType.DWELLING) {
            return 300;
        } else {
            return 150;
        }
    }

    strokeShape(context: DrawingContext, radius: number) {
        const {ctx, vp} = context;
        switch (this.entity.node.type) {
            case NodeType.LOAD_NODE:
                ctx.moveTo(0, radius);
                for (let i = 1; i < 6; i++) {
                    ctx.lineTo(Math.sin(Math.PI * 2 * i / 6) * radius, Math.cos(Math.PI * 2 * i / 6) * radius);
                }
                ctx.closePath();
                break;
            case NodeType.DWELLING:
                for (let i = 0.5; i < 3.5; i++) {
                    ctx.lineTo(Math.sin(Math.PI * 2 * (i - 1) / 4) * radius, Math.cos(Math.PI * 2 * (i - 1) / 4) * radius);
                    ctx.lineTo(Math.sin(Math.PI * 2 * i / 4) * radius, Math.cos(Math.PI * 2 * i / 4) * radius);
                }
                ctx.closePath();
                break;

        }
    }

    getFrictionHeadLoss(context: CalculationContext, flowLS: number, from: FlowNode, to: FlowNode, signed: boolean): number | null {
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
    }

    collectCalculations(context: CalculationContext): LoadNodeCalculation {
        const calcEnts = this.getCalculationEntities(context);
        if (calcEnts[0]) {
            return context.globalStore.getOrCreateCalculation(calcEnts[0]);
        } else {
            return context.globalStore.getOrCreateCalculation(this.entity);
        }
    }

    getCalculationEntities(context: CalculationContext): [LoadNodeEntity, ...(PipeEntity | FittingEntity)[]] | [] {
        const tower = this.getCalculationTower(context);
        if (tower.length === 0) {
            return []
        }
        if (this.entity.node.type === NodeType.LOAD_NODE) {
            if (tower.length !== 1) {
                throw new Error('Unexpected tower configuration. Expected exactly 1 layer');
            }
        }
        const proj = cloneSimple(this.entity);
        const res = tower.flat();
        proj.center = (res[0] as FittingEntity).center;
        proj.parentUid = res[0].parentUid;
        proj.uid = res[0].uid;
        proj.calculationHeightM = tower[0][0].calculationHeightM;

        return [proj, ...res.splice(1)];
    }

    locateCalculationBoxWorld(context: DrawingContext, data: CalculationData[], scale: number): TM.Matrix[] {
        return [];
    }

    static register(): void {
        DrawableObjectFactory.registerEntity(EntityType.LOAD_NODE, LoadNode);
    }
}
