import BackedConnectable from '../../../src/htmlcanvas/lib/BackedConnectable';
// tslint:disable-next-line:max-line-length
import DirectedValveEntity, {fillDirectedValveFields} from '../../../src/store/document/entities/directed-valves/directed-valve-entity';
import {DrawingContext} from '../../../src/htmlcanvas/lib/types';
import {Coord, DrawableEntity} from '../../../src/store/document/types';
import CanvasContext from '../../../src/htmlcanvas/lib/canvas-context';
import BaseBackedObject from '../../../src/htmlcanvas/lib/base-backed-object';
import DrawableObjectFactory from '../../../src/htmlcanvas/lib/drawable-object-factory';
import {EntityType} from '../../../src/store/document/entities/types';
import {getDragPriority} from '../../../src/store/document';
import {CalculationContext} from '../../../src/calculations/types';
import {FlowNode} from '../../../src/calculations/calculation-engine';
import {ConnectableObject} from '../../../src/htmlcanvas/lib/object-traits/connectable';
import * as TM from 'transformation-matrix';
import {CenteredObject} from '../../../src/htmlcanvas/lib/object-traits/centered-object';
import CenterDraggableObject from '../../../src/htmlcanvas/lib/object-traits/center-draggable-object';
import {SelectableObject} from '../../../src/htmlcanvas/lib/object-traits/selectable';
import {canonizeAngleRad, cloneSimple, lighten} from '../../../src/lib/utils';
import {IsolationValve, ValveType} from '../../../src/store/document/entities/directed-valves/valve-types';
import {lowerBoundTable, parseCatalogNumberExact} from '../../../src/htmlcanvas/lib/utils';
import Pipe from '../../../src/htmlcanvas/objects/pipe';
import {matrixScale} from '../../../src/htmlcanvas/utils';
import {Catalog} from '../../../src/store/catalog/types';
import {DrawingArgs} from '../../../src/htmlcanvas/lib/drawable-object';
import {Calculated, CalculatedObject} from '../../../src/htmlcanvas/lib/object-traits/calculated-object';
import {CalculationData} from '../../../src/store/document/calculations/calculation-field';
import {assertUnreachable} from "../../../src/config";
import PipeEntity, {MutablePipe} from "../../store/document/entities/pipe-entity";
import DirectedValveCalculation from "../../store/document/calculations/directed-valve-calculation";
import FittingEntity from "../../store/document/entities/fitting-entity";

export const VALVE_SIZE_MM = 140;
export const VALVE_HEIGHT_MM = 100;
export const VALVE_LINE_WIDTH_MM = 10;

@CalculatedObject
@SelectableObject
@CenterDraggableObject
@ConnectableObject
@CenteredObject
export default class DirectedValve extends BackedConnectable<DirectedValveEntity> implements Calculated {

    static register() {
        DrawableObjectFactory.registerEntity(EntityType.DIRECTED_VALVE, this);
    }
    dragPriority = getDragPriority(EntityType.DIRECTED_VALVE);
    maximumConnections = 2;
    minimumConnections = 0;

    get rotationRad(): number {
        // We must get the rotation outside of position() because these
        // rotation calculations depend on position(). So apply this rotation
        // to the context manually afterwards when drawing.
        const connections = this.objectStore.getConnections(this.entity.uid);
        if (connections.length === 0) {
            return 0;
        } else if (connections.length === 1) {
            const oc = this.toObjectCoord(this.getRadials()[0][0]);
            if (connections[0] === this.entity.sourceUid) {
                return canonizeAngleRad(Math.atan2(oc.y, oc.x) + Math.PI);
            } else {
                return canonizeAngleRad(Math.atan2(oc.y, oc.x));
            }
        } else if (connections.length === 2) {
            const s = this.objectStore.get(this.entity.sourceUid) as Pipe;
            const soc = this.toObjectCoord(s.worldEndpoints(this.uid)[0]);
            const other = this.otherUid!;
            const o = this.objectStore.get(other) as Pipe;
            const ooc = this.toObjectCoord(o.worldEndpoints(this.uid)[0]);
            const sa = Math.atan2(soc.y, soc.x);
            const oa = Math.atan2(ooc.y, ooc.x);
            const diff = canonizeAngleRad(oa - (sa + Math.PI));
            return canonizeAngleRad((sa + Math.PI + diff / 2));
        } else {
            throw new Error('invalid configuration for directed entity');
        }
    }

    get position(): TM.Matrix {
        const scale = 1 / this.fromParentToWorldLength(1);
        return TM.transform(
            TM.translate(this.entity.center.x, this.entity.center.y),
            TM.scale(scale, scale),
        );
    }

    get otherUid(): string | undefined {
        return this.objectStore.getConnections(this.uid).find((uid) => uid !== this.entity.sourceUid);
    }

    locateCalculationBoxWorld(context: DrawingContext, data: CalculationData[], scale: number): TM.Matrix[] {
        return [];
    }

    drawInternal(context: DrawingContext, {active, selected}: DrawingArgs): void {
        const s = matrixScale(context.ctx.getTransform());
        context.ctx.rotate(this.rotationRad);

        const e = fillDirectedValveFields(context.doc, this.objectStore, this.entity);
        if (selected && active) {
            context.ctx.fillStyle = lighten(e.color!.hex, 50, 0.8);
            context.ctx.fillRect(-VALVE_SIZE_MM * 1.2, -VALVE_SIZE_MM * 1.2, VALVE_SIZE_MM * 2.4, VALVE_SIZE_MM * 2.4);
        }
        const color = e.color!;

        const baseWidth = Math.max(2.0 / s, VALVE_LINE_WIDTH_MM / this.toWorldLength(1));

        context.ctx.fillStyle =  color.hex;
        context.ctx.strokeStyle = color.hex;
        context.ctx.lineWidth = baseWidth;
        switch (this.entity.valve.type) {
            case ValveType.CHECK_VALVE:
                this.drawCheckValve(context);
                break;
            case ValveType.ISOLATION_VALVE:
                this.drawIsolationValve(context);
                break;
            case ValveType.PRESSURE_RELIEF_VALVE:
                this.drawPressureReliefValve(context);
                break;
            case ValveType.RPZD:
                this.drawRpzd(context);
                break;
            case ValveType.WATER_METER:
                this.drawWaterMeter(context);
                break;
            case ValveType.STRAINER:
                this.drawStrainer(context);
                break;
            default:
                assertUnreachable(this.entity.valve);
        }
    }

    drawCheckValve(context: DrawingContext) {
        const ctx = context.ctx;
        ctx.beginPath();
        ctx.moveTo(-VALVE_HEIGHT_MM, -VALVE_HEIGHT_MM);
        ctx.lineTo(-VALVE_HEIGHT_MM, VALVE_HEIGHT_MM);
        ctx.lineTo(VALVE_HEIGHT_MM, 0);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(VALVE_HEIGHT_MM, VALVE_HEIGHT_MM);
        ctx.lineTo(VALVE_HEIGHT_MM, -VALVE_HEIGHT_MM);
        ctx.stroke();
    }

    drawIsolationValve(context: DrawingContext) {
        const ctx = context.ctx;
        ctx.beginPath();
        ctx.moveTo(-VALVE_SIZE_MM, VALVE_HEIGHT_MM);
        ctx.lineTo(VALVE_SIZE_MM, -VALVE_HEIGHT_MM);
        ctx.lineTo(VALVE_SIZE_MM, VALVE_HEIGHT_MM);
        ctx.lineTo(-VALVE_SIZE_MM, -VALVE_HEIGHT_MM);

        if ((this.entity.valve as IsolationValve).isClosed) {
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
        } else {
            ctx.lineTo(-VALVE_SIZE_MM, VALVE_HEIGHT_MM);
            ctx.stroke();
        }
    }

    drawPressureReliefValve(context: DrawingContext) {
        //
    }

    drawRpzd(context: DrawingContext) {
        //
    }

    drawWaterMeter(context: DrawingContext) {

        const ctx = context.ctx;
        ctx.beginPath();
        ctx.moveTo(-VALVE_SIZE_MM, -VALVE_HEIGHT_MM);
        ctx.lineTo(VALVE_SIZE_MM, VALVE_HEIGHT_MM);
        ctx.lineTo(-VALVE_SIZE_MM, VALVE_HEIGHT_MM);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-VALVE_SIZE_MM, -VALVE_HEIGHT_MM);
        ctx.lineTo(VALVE_SIZE_MM, -VALVE_HEIGHT_MM);
        ctx.lineTo(VALVE_SIZE_MM, VALVE_HEIGHT_MM);
        ctx.lineTo(-VALVE_SIZE_MM, VALVE_HEIGHT_MM);
        ctx.lineTo(-VALVE_SIZE_MM, -VALVE_HEIGHT_MM);
        ctx.stroke();
    }

    drawStrainer(context: DrawingContext) {
        const ctx = context.ctx;
        ctx.beginPath();
        const offset = VALVE_HEIGHT_MM / 2;
        ctx.moveTo(-VALVE_SIZE_MM, -VALVE_HEIGHT_MM + offset);
        ctx.lineTo(-VALVE_SIZE_MM, 0 + offset);
        ctx.moveTo(-VALVE_SIZE_MM, -VALVE_HEIGHT_MM / 2 + offset);
        ctx.lineTo(VALVE_SIZE_MM, -VALVE_HEIGHT_MM / 2 + offset);
        ctx.moveTo(VALVE_SIZE_MM, -VALVE_HEIGHT_MM + offset);
        ctx.lineTo(VALVE_SIZE_MM, 0 + offset);


        ctx.moveTo(-VALVE_SIZE_MM / 2, -VALVE_HEIGHT_MM / 2 + offset);
        ctx.lineTo(VALVE_SIZE_MM / 2, VALVE_HEIGHT_MM / 2 + offset);
        ctx.moveTo(VALVE_SIZE_MM * 0.8, VALVE_HEIGHT_MM * 0.2 + offset);
        ctx.lineTo(VALVE_SIZE_MM * 0.2, VALVE_HEIGHT_MM * 0.8 + offset);
        ctx.stroke();
    }

    flip() {
        const entity = this.entity;
        const connections = this.objectStore.getConnections(entity.uid);

        if (connections.length === 1) {
            if (entity.sourceUid === connections[0]) {
                entity.sourceUid = "N/A";
            } else {
                entity.sourceUid = connections[0];
            }
        } else if (connections.length === 2) {
            if (entity.sourceUid === connections[0]) {
                entity.sourceUid = connections[1];
            } else {
                entity.sourceUid = connections[0];
            }
        } else {
            throw new Error('Directed valve is connected to too many things');
        }
    }

    inBounds(objectCoord: Coord, objectRadius?: number): boolean {
        const dist = Math.sqrt(objectCoord.x ** 2 + objectCoord.y ** 2);
        return dist < VALVE_SIZE_MM + (objectRadius ? objectRadius : 0);
    }


    prepareDelete(context: CanvasContext): BaseBackedObject[] {
        return [];
    }

    rememberToRegister(): void {
        //
    }

    largestPipeSizeNominalMM(context: CalculationContext): number | null {
        const sizes = this.objectStore.getConnections(this.entity.uid).map((uid) => {
            const p = this.objectStore.get(uid) as Pipe;
            if (!p || p.type !== EntityType.PIPE) {
                throw new Error('A non pipe object is connected to a valve');
            }

            const calculation = context.globalStore.getCalculation(p.entity);
            if (!calculation || calculation.realNominalPipeDiameterMM === null) {
                return null;
            } else {
                return calculation.realNominalPipeDiameterMM;
            }
        });

        const valids = sizes.filter((u) => u !== null) as number[];
        if (valids.length === 0) {
            return null;
        }
        return Math.max(...valids);
    }

    getFrictionHeadLoss(
        context: CalculationContext,
        flowLS: number,
        from: FlowNode,
        to: FlowNode,
        signed: boolean,
    ): number {
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

        if (this.objectStore.getConnections(this.entity.uid).length !== 2) {
            throw new Error('need 2 connections to have a calculation here.');
        }

        let kValue: number | null = 0;
        switch (this.entity.valve.type) {
            case ValveType.CHECK_VALVE:
            case ValveType.ISOLATION_VALVE:
            case ValveType.WATER_METER:
            case ValveType.STRAINER:
                const table = context.catalog.valves[this.entity.valve.catalogId];
                const size = this.largestPipeSizeNominalMM(context);
                if (size === null) {
                    throw new Error('No pipes are sized for this valve');
                }
                kValue = parseCatalogNumberExact(lowerBoundTable(table.valvesBySize, size)!.kValue);

                if (this.entity.valve.type === ValveType.CHECK_VALVE) {
                    // go the right way
                    if (from.connection !== this.entity.sourceUid) {
                        return sign * (1e10 + flowLS);
                    }
                } else if (this.entity.valve.type === ValveType.ISOLATION_VALVE) {
                    if (this.entity.valve.isClosed) {
                        return sign * (1e10 + flowLS);
                    }
                }
                break;
            case ValveType.PRESSURE_RELIEF_VALVE:
                // TODO
                break;
            case ValveType.RPZD:
                // TODO
                break;
        }

        const volLM = this.largestPipeSizeNominalMM(context)! ** 2 * Math.PI / 4 / 1000;
        const velocityMS = flowLS / volLM;
        if (kValue) {
            return sign * (kValue * velocityMS ** 2) / (2 * ga);
        } else {
            return 0;
        }
    }

    friendlyTypeName(catalog: Catalog): string {
        switch (this.entity.valve.type) {
            case ValveType.CHECK_VALVE:
            case ValveType.ISOLATION_VALVE:
            case ValveType.WATER_METER:
            case ValveType.STRAINER:
                return catalog.valves[this.entity.valve.catalogId].name;
            case ValveType.RPZD:
                return 'RPZD';
            case ValveType.PRESSURE_RELIEF_VALVE:
                return 'PRV';
        }
        assertUnreachable(this.entity.valve);
    }

    connect(uid: string) {
        if (this.objectStore.getConnections(this.entity.uid).length === 0) {
            this.entity.sourceUid = uid;
        } else if (this.objectStore.getConnections(this.entity.uid).length === 1) {
            if (this.entity.sourceUid !== this.objectStore.getConnections(this.entity.uid)[0]) {
                this.entity.sourceUid = uid;
            }
        } else {
            throw new Error('shouldn\'t be extending here. connections: ' + JSON.stringify(this.objectStore.getConnections(this.entity.uid)) + ' connecting ' + uid);
        }
    }

    getCalculationEntities(context: CalculationContext): Array<DirectedValveEntity | PipeEntity | FittingEntity> {
        const tower = this.getCalculationTower(context);
        if (tower.length === 0) {
            return [];
        } else if (tower.length === 1) {
            // replace the connectable
            const e = cloneSimple(this.entity);
            e.uid = tower[0][0].uid;
            e.calculationHeightM = tower[0][0].calculationHeightM;
            if (this.objectStore.has(e.sourceUid)) {
                e.sourceUid = this.objectStore.get(e.sourceUid)!.getCalculationEntities(context)[0].uid;
            }
            return [e];
        } else if (tower.length === 2) {
            // Plop us on the pipe in the middle.
            const pipe = tower[0][1]!;
            const p1 = cloneSimple(pipe);
            const p2 = cloneSimple(pipe);
            (p1 as MutablePipe).endpointUid = [p1.endpointUid[0], this.uid + '.calculation'];
            (p2 as MutablePipe).endpointUid = [this.uid + '.calculation', p2.endpointUid[1]];

            const e = cloneSimple(this.entity);
            e.uid = e.uid + '.calculation';
            e.calculationHeightM = (tower[0][0].calculationHeightM! + tower[1][0].calculationHeightM!) / 2;

            // we have to figure out whether source is the lower one or higher one.
            if ((this.objectStore.get(this.entity.sourceUid) as Pipe).entity.heightAboveFloorM <
                (this.objectStore.get(this.otherUid!) as Pipe).entity.heightAboveFloorM) {
                // source is #0
                e.sourceUid = tower[0][0].uid;
            } else {
                e.sourceUid = tower[1][0].uid;
            }

            return [e, tower[0][0], p1, p2, tower[1][0]];
        } else {
            throw new Error('Invalid tower configuration on directed valve');
        }
    }

    collectCalculations(context: CalculationContext): DirectedValveCalculation {
        // find the only directed valve in there and take its calc.
        const me = this.getCalculationEntities(context)
            .find((e) => e.type === EntityType.DIRECTED_VALVE) as DirectedValveEntity;

        if (!me) {
            throw new Error('Can\'t find self in calculations');
        }
        return context.globalStore.getOrCreateCalculation(me);
    }

    protected refreshObjectInternal(obj: DrawableEntity, old?: DrawableEntity): void {
        //
    }
}
