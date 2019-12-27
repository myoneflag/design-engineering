import BaseBackedObject from "../lib/base-backed-object";
import BackedConnectable from "../lib/BackedConnectable";
import LoadNodeEntity, {fillDefaultLoadNodeFields} from "../../store/document/entities/load-node-entity";
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
import {matrixScale} from "../utils";
import {cloneSimple, lighten} from "../../lib/utils";
import Flatten from '@flatten-js/core';
import DrawableObjectFactory from "../lib/drawable-object-factory";
import {SelectableObject} from "../lib/object-traits/selectable";
import CenterDraggableObject from "../lib/object-traits/center-draggable-object";

@SelectableObject
@CenterDraggableObject
@CalculatedObject
@ConnectableObject
@CenteredObject
export default class LoadNode extends BackedConnectable<LoadNodeEntity> implements Calculated, Connectable {
    dragPriority = getDragPriority(EntityType.LOAD_NODE);
    maximumConnections = 1;
    minimumConnections = 0;

    drawInternal(context: DrawingContext, args: DrawingArgs): void {
        const {ctx, vp} = context;
        const radius = Math.max(150, vp.toWorldLength(3));

        const filled = fillDefaultLoadNodeFields(context.doc, this.objectStore, this.entity);

        if (args.selected) {
            const sr = Math.max(170, vp.toWorldLength(5));

            ctx.fillStyle = lighten(filled.color!.hex, 50);
            ctx.beginPath();
            ctx.arc(0, 0, sr, 0,Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = filled.color!.hex;
        ctx.strokeStyle = lighten(filled.color!.hex, -10);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0,Math.PI * 2);
        ctx.fill();
    }

    getFrictionHeadLoss(context: CalculationContext, flowLS: number, from: FlowNode, to: FlowNode, signed: boolean): number | null {
        return 0;
    }

    inBounds(objectCoord: Coord, objectRadius?: number): boolean {
        return objectCoord.x ** 2 + objectCoord.y ** 2 <= 150 ** 2;
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
        if (calcEnts.length) {
            return context.globalStore.getOrCreateCalculation(this.getCalculationEntities(context)[0]);
        } else {
            return context.globalStore.getOrCreateCalculation(this.entity);
        }
    }

    getCalculationEntities(context: CalculationContext): LoadNodeEntity[] {
        const tower = this.getCalculationTower(context);
        if (tower.length === 0) {
            return []
        }
        if (tower.length !== 1) {
            throw new Error('Unexpected tower configuration. Expected exactly 1 layer');
        }
        const proj = cloneSimple(this.entity);
        proj.center = tower[0][0].center;
        proj.parentUid = tower[0][0].parentUid;
        proj.uid = tower[0][0].uid;
        proj.calculationHeightM = tower[0][0].calculationHeightM;
        console.log('generated proj: ' + JSON.stringify(proj));

        return [proj];
    }

    locateCalculationBoxWorld(context: DrawingContext, data: CalculationData[], scale: number): TM.Matrix[] {
        return [];
    }

    static register(): void {
        DrawableObjectFactory.registerEntity(EntityType.LOAD_NODE, LoadNode);
    }
}
