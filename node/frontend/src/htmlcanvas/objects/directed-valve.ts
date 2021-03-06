import BackedConnectable from "../../../src/htmlcanvas/lib/BackedConnectable";
import DirectedValveEntity from "../../../../common/src/api/document/entities/directed-valves/directed-valve-entity";
import { CostBreakdown, DrawingContext } from "../../../src/htmlcanvas/lib/types";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import BaseBackedObject from "../../../src/htmlcanvas/lib/base-backed-object";
import DrawableObjectFactory from "../../../src/htmlcanvas/lib/drawable-object-factory";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import { getDragPriority } from "../../../src/store/document";
import { CalculationContext } from "../../../src/calculations/types";
import { FlowNode } from "../../../src/calculations/calculation-engine";
import { ConnectableObject } from "../../../src/htmlcanvas/lib/object-traits/connectable";
import * as TM from "transformation-matrix";
import { CenteredObject } from "../../../src/htmlcanvas/lib/object-traits/centered-object";
import CenterDraggableObject from "../../../src/htmlcanvas/lib/object-traits/center-draggable-object";
import { SelectableObject } from "../../../src/htmlcanvas/lib/object-traits/selectable";
import { canonizeAngleRad } from "../../../src/lib/trigonometry"
import { lighten } from "../../../src/lib/utils";
import { IsolationValve, ValveType } from "../../../../common/src/api/document/entities/directed-valves/valve-types";
import {
    drawRpzdDouble,
    getRpzdHeadLoss,
    VALVE_HEIGHT_MM,
    VALVE_LINE_WIDTH_MM,
    VALVE_SIZE_MM
} from "../../../src/htmlcanvas/lib/utils";
import Pipe from "../../../src/htmlcanvas/objects/pipe";
import { EntityDrawingArgs } from "../../../src/htmlcanvas/lib/drawable-object";
import { Calculated, CalculatedObject } from "../../../src/htmlcanvas/lib/object-traits/calculated-object";
import { CalculationData } from "../../../src/store/document/calculations/calculation-field";
import PipeEntity, { MutablePipe } from "../../../../common/src/api/document/entities/pipe-entity";
import DirectedValveCalculation, { emptyDirectedValveCalculation } from "../../store/document/calculations/directed-valve-calculation";
import FittingEntity from "../../../../common/src/api/document/entities/fitting-entity";
import { assertUnreachable, ComponentPressureLossMethod, isDrainage, isGas } from "../../../../common/src/api/config";
import { Catalog } from "../../../../common/src/api/catalog/types";
import { Coord, DrawableEntity } from "../../../../common/src/api/document/drawing";
import { cloneSimple, lowerBoundTable, parseCatalogNumberExact } from "../../../../common/src/lib/utils";
import { fillDirectedValveFields } from "../../store/document/entities/fillDirectedValveFields";
import { determineConnectableSystemUid } from "../../store/document/entities/lib";
import { fittingFrictionLossMH, getFluidDensityOfSystem, kpa2head } from "../../calculations/pressure-drops";
import { SnappableObject } from "../lib/object-traits/snappable-object";
import { lowerBoundNumberTable } from "../utils";
import { decomposeMatrix } from "../utils";
import { DEFAULT_FONT_NAME } from "../../config";
import { Direction } from "../types";
import { isSameWorldPX } from "../on-screen-items";


@CalculatedObject
@SelectableObject
@CenterDraggableObject
@ConnectableObject()
@CenteredObject
@SnappableObject
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
        const connections = this.globalStore.getConnections(this.entity.uid);
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
            const s = this.globalStore.get(this.entity.sourceUid) as Pipe;
            const soc = this.toObjectCoord(s.worldEndpoints(this.uid)[0]);
            const other = this.otherUid!;
            const o = this.globalStore.get(other) as Pipe;
            const ooc = this.toObjectCoord(o.worldEndpoints(this.uid)[0]);
            const sa = Math.atan2(soc.y, soc.x);
            const oa = Math.atan2(ooc.y, ooc.x);
            const diff = canonizeAngleRad(oa - (sa + Math.PI));
            return canonizeAngleRad(sa + Math.PI + diff / 2);
        } else {
            throw new Error("invalid configuration for directed entity");
        }
    }

    get position(): TM.Matrix {
        const scale = 1 / this.fromParentToWorldLength(1);
        return TM.transform(TM.translate(this.entity.center.x, this.entity.center.y), TM.scale(scale, scale));
    }

    get otherUid(): string | undefined {
        return this.globalStore.getConnections(this.uid).find((uid) => uid !== this.entity.sourceUid);
    }

    locateCalculationBoxWorld(context: DrawingContext, data: CalculationData[], scale: number): TM.Matrix[] {
        return [];
    }

    isActive(): boolean {
        const systemUid = determineConnectableSystemUid(this.globalStore, this.entity);
        switch (this.document.uiState.pressureOrDrainage) {
            case "pressure":
                return systemUid === undefined || !isDrainage(systemUid, this.document.drawing.metadata.flowSystems);
            case "drainage":
                return systemUid === undefined || isDrainage(systemUid, this.document.drawing.metadata.flowSystems);
        }
        assertUnreachable(this.document.uiState.pressureOrDrainage);
    }

    get valveWidthMM(): number {
        return this.valveHeightMM * VALVE_SIZE_MM / VALVE_HEIGHT_MM;
    }

    get valveHeightMM(): number {
        return this.entity.valveSizeMM || VALVE_HEIGHT_MM;
    }

    drawEntity(context: DrawingContext, { selected }: EntityDrawingArgs): void {
        const s = context.vp.currToSurfaceScale(context.ctx);
        context.ctx.rotate(this.rotationRad);

        const e = fillDirectedValveFields(context.doc.drawing, this.globalStore, this.entity);
        if (selected) {
            context.ctx.fillStyle = lighten(e.color!.hex, 50, 0.8);
            context.ctx.fillRect(-this.valveWidthMM * 1.2, -this.valveWidthMM * 1.2, this.valveWidthMM * 2.4, this.valveWidthMM * 2.4);
        }
        let color = e.color!;
        if (!this.isActive()) {
            color = { hex: 'rgba(150, 150, 150, 0.65)' };
        }

        const baseWidth = Math.max(2.0 / s, VALVE_LINE_WIDTH_MM / this.toWorldLength(1));

        context.ctx.fillStyle = color.hex;
        context.ctx.strokeStyle = color.hex;
        context.ctx.lineWidth = baseWidth;
        let maxOffsetY = this.valveWidthMM;
        switch (this.entity.valve.type) {
            case ValveType.CHECK_VALVE:
                this.drawCheckValve(context);
                break;
            case ValveType.ISOLATION_VALVE:
                this.drawIsolationValve(context);
                break;
            case ValveType.PRV_SINGLE:
                this.drawPrvSingle(context);
                break;

            case ValveType.PRV_DOUBLE:
                this.drawPrvDouble(context);
                maxOffsetY = this.valveHeightMM * (2 + 0.3);
                break;

            case ValveType.PRV_TRIPLE:
                this.drawPrvTriple(context);
                maxOffsetY = this.valveHeightMM * (3 + 0.3);
                break;
            case ValveType.RPZD_SINGLE:
                this.drawRpzdSingle(context);
                break;

            case ValveType.RPZD_DOUBLE_ISOLATED:
            case ValveType.RPZD_DOUBLE_SHARED:
                drawRpzdDouble(context, [context.ctx.fillStyle, context.ctx.fillStyle], undefined, this);
                maxOffsetY = this.valveHeightMM * (2 + 0.3);
                break;
            case ValveType.WATER_METER:
                this.drawWaterMeter(context);
                break;
            case ValveType.STRAINER:
                this.drawStrainer(context);
                break;
            case ValveType.BALANCING:
                this.drawBalancingValve(context);
                break;
            case ValveType.GAS_REGULATOR:
                this.drawGasRegulator(context);
                break;
            case ValveType.FILTER:
                this.drawFilter(context);
                break;
            case ValveType.FLOOR_WASTE:
                this.drawFloorWaste(context);
                break;
            case ValveType.INSPECTION_OPENING:
                this.drawInspectionOpening(context);
                break;
            case ValveType.REFLUX_VALVE:
                this.drawRefluxValve(context);
                break;
            default:
                assertUnreachable(this.entity.valve);
        }

        // Display Entity Name
        if (this.entity.entityName) {
            const name = this.entity.entityName;
            context.ctx.font = 70 + "pt " + DEFAULT_FONT_NAME;
            context.ctx.textBaseline = "top";
            const nameWidth = context.ctx.measureText(name).width;
            const offsetx = - nameWidth / 2;
            context.ctx.fillStyle = "#00ff1421";
            // the 70 represents the height of the font
            const textHight = 70;
            const offsetY = maxOffsetY + textHight / 2;
            context.ctx.fillRect(offsetx, offsetY, nameWidth, 70);
            context.ctx.fillStyle = color.hex;
            context.ctx.fillText(name, offsetx, offsetY - 4);
            context.ctx.textBaseline = "alphabetic";
        }
    }

    drawFloorWaste(context: DrawingContext) {
        this.withWorldAngle(context, { x: 0, y: 0 }, () => {
            const ctx = context.ctx;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, this.valveWidthMM, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            const lineX = this.valveWidthMM / 2;
            const lineY = ((this.valveWidthMM ** 2) - (lineX ** 2)) ** 0.5;

            ctx.moveTo(0, this.valveWidthMM);
            ctx.lineTo(0, -this.valveWidthMM);
            ctx.moveTo(lineX, lineY);
            ctx.lineTo(lineX, -lineY);
            ctx.moveTo(-lineX, lineY);
            ctx.lineTo(-lineX, -lineY);

            ctx.stroke();


            ctx.fillStyle = '#000000';
            ctx.font = '65px ' + DEFAULT_FONT_NAME;

            let name = 'FW';
            if (this.entity.valve.type === ValveType.FLOOR_WASTE && this.entity.valve.variant === 'bucketTrap') {
                name = 'BT';
            }

            ctx.fillText(name, -50, 25);
        });
    }

    drawInspectionOpening(context: DrawingContext) {
        this.withWorldAngle(context, { x: 0, y: 0 }, () => {
            const ctx = context.ctx;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, this.valveWidthMM, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#000000';
            ctx.font = '65px ' + DEFAULT_FONT_NAME;
            ctx.fillText("I.O.", -50, 25);
        });
    }

    drawRefluxValve(context: DrawingContext) {
        const ctx = context.ctx;
        ctx.beginPath();
        ctx.moveTo(-this.valveWidthMM, this.valveHeightMM);
        ctx.lineTo(-this.valveWidthMM, -this.valveHeightMM);
        ctx.lineTo(this.valveWidthMM, this.valveHeightMM);
        ctx.lineTo(this.valveWidthMM, -this.valveHeightMM);
        ctx.stroke();
    }

    drawCheckValve(context: DrawingContext) {
        const ctx = context.ctx;
        ctx.beginPath();
        ctx.moveTo(-this.valveHeightMM, -this.valveHeightMM);
        ctx.lineTo(-this.valveHeightMM, this.valveHeightMM);
        ctx.lineTo(this.valveHeightMM, 0);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(this.valveHeightMM, this.valveHeightMM);
        ctx.lineTo(this.valveHeightMM, -this.valveHeightMM);
        ctx.stroke();
    }

    drawIsolationValve(context: DrawingContext) {
        const ctx = context.ctx;
        ctx.beginPath();
        ctx.moveTo(-this.valveWidthMM, this.valveHeightMM);
        ctx.lineTo(this.valveWidthMM, -this.valveHeightMM);
        ctx.lineTo(this.valveWidthMM, this.valveHeightMM);
        ctx.lineTo(-this.valveWidthMM, -this.valveHeightMM);

        if ((this.entity.valve as IsolationValve).isClosed) {
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
        } else {
            ctx.lineTo(-this.valveWidthMM, this.valveHeightMM);
            ctx.stroke();
        }
    }

    drawBalancingValve(context: DrawingContext) {
        const ctx = context.ctx;
        ctx.beginPath();
        ctx.moveTo(-this.valveWidthMM, this.valveHeightMM);
        ctx.lineTo(this.valveWidthMM, -this.valveHeightMM);
        ctx.lineTo(this.valveWidthMM, this.valveHeightMM);
        ctx.lineTo(-this.valveWidthMM, -this.valveHeightMM);

        ctx.lineTo(-this.valveWidthMM, this.valveHeightMM);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-this.valveWidthMM / 2, -this.valveHeightMM / 2);
        ctx.lineTo(-this.valveWidthMM / 2, -this.valveHeightMM * 5 / 4);
        ctx.lineTo(-this.valveWidthMM / 4, -this.valveHeightMM * 5 / 4);

        ctx.moveTo(this.valveWidthMM / 2, -this.valveHeightMM / 2);
        ctx.lineTo(this.valveWidthMM / 2, -this.valveHeightMM * 5 / 4);
        ctx.lineTo(this.valveWidthMM * 3 / 4, -this.valveHeightMM * 5 / 4);

        ctx.stroke();
    }

    drawGasRegulator(context: DrawingContext) {
        const ctx = context.ctx;


        ctx.beginPath();
        ctx.moveTo(-this.valveWidthMM, this.valveHeightMM * 0.7);
        ctx.lineTo(this.valveWidthMM, -this.valveHeightMM * 0.7);
        ctx.lineTo(this.valveWidthMM, this.valveHeightMM * 0.7);
        ctx.lineTo(-this.valveWidthMM, -this.valveHeightMM * 0.7);
        ctx.lineTo(-this.valveWidthMM, this.valveHeightMM * 0.7);
        ctx.stroke();

        // Umbrella
        const currAngle = canonizeAngleRad(decomposeMatrix(context.vp.currToSurfaceTransform(ctx)).a);
        const upsideDown = currAngle > Math.PI / 2 || currAngle < -Math.PI / 2;

        if (upsideDown) {
            ctx.moveTo(0, 0);
            ctx.lineTo(0, this.valveHeightMM);
            ctx.lineTo(-this.valveWidthMM * 0.7, this.valveHeightMM);
            ctx.bezierCurveTo(-this.valveWidthMM * 0.7, this.valveHeightMM * 1.5, this.valveWidthMM * 0.7,
                this.valveHeightMM * 1.5, this.valveWidthMM * 0.7, this.valveHeightMM);
            ctx.lineTo(0, this.valveHeightMM);
            ctx.stroke();
        } else {
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -this.valveHeightMM);
            ctx.lineTo(-this.valveWidthMM * 0.7, -this.valveHeightMM);
            ctx.bezierCurveTo(-this.valveWidthMM * 0.7, -this.valveHeightMM * 1.5, this.valveWidthMM * 0.7,
                -this.valveHeightMM * 1.5, this.valveWidthMM * 0.7, -this.valveHeightMM);
            ctx.lineTo(0, -this.valveHeightMM);
            ctx.stroke();
        }

        // Arrow right
        ctx.strokeStyle = 'rgba(50, 50, 200, 0.5)';
        ctx.fillStyle = 'rgba(50, 50, 200, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-this.valveWidthMM * 0.5, -this.valveHeightMM * 0.7);
        ctx.lineTo(this.valveWidthMM * 0.7, 0);
        ctx.lineTo(-this.valveWidthMM * 0.5, this.valveHeightMM * 0.7);
        ctx.fill();
    }

    drawReturnPump(context: DrawingContext) {
        const ctx = context.ctx;
        ctx.beginPath();
        ctx.moveTo(this.valveHeightMM * Math.cos(Math.PI * 3 / 4), this.valveHeightMM * Math.sin(Math.PI * 3 / 4));
        ctx.lineTo(this.valveHeightMM * Math.cos(- Math.PI * 3 / 4), this.valveHeightMM * Math.sin(- Math.PI * 3 / 4));
        ctx.lineTo(this.valveHeightMM, 0);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, this.valveHeightMM, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawFilter(context: DrawingContext) {
        const ctx = context.ctx;
        ctx.beginPath();
        const VALVE_HEIGHT_MM = this.valveWidthMM * 6 / 7;

        // outer box
        ctx.moveTo(this.valveWidthMM, -VALVE_HEIGHT_MM);
        ctx.lineTo(this.valveWidthMM, VALVE_HEIGHT_MM);
        ctx.lineTo(-this.valveWidthMM, VALVE_HEIGHT_MM);
        ctx.lineTo(-this.valveWidthMM, -VALVE_HEIGHT_MM);
        ctx.closePath();
        ctx.stroke();

        // mesh
        ctx.beginPath();
        ctx.moveTo(-this.valveWidthMM * 3 / 7, -VALVE_HEIGHT_MM);
        ctx.lineTo(-this.valveWidthMM, - VALVE_HEIGHT_MM / 3);
        ctx.moveTo(this.valveWidthMM * 1 / 7, -VALVE_HEIGHT_MM);
        ctx.lineTo(-this.valveWidthMM, VALVE_HEIGHT_MM / 3);
        ctx.moveTo(this.valveWidthMM * 5 / 7, -VALVE_HEIGHT_MM);
        ctx.lineTo(-this.valveWidthMM * 7 / 7, VALVE_HEIGHT_MM);

        ctx.moveTo(this.valveWidthMM, - VALVE_HEIGHT_MM * 2 / 3);
        ctx.lineTo(-this.valveWidthMM * 3 / 7, VALVE_HEIGHT_MM);
        ctx.moveTo(this.valveWidthMM, 0);
        ctx.lineTo(this.valveWidthMM * 1 / 7, VALVE_HEIGHT_MM);
        ctx.moveTo(this.valveWidthMM, VALVE_HEIGHT_MM * 2 / 3);
        ctx.lineTo(this.valveWidthMM * 5 / 7, VALVE_HEIGHT_MM);
        ctx.stroke();
    }

    drawPrvN(context: DrawingContext, n: number) {
        const ctx = context.ctx;
        const oldfs = ctx.fillStyle;
        ctx.fillStyle = "#ffffff";

        ctx.fillRect(
            -this.valveHeightMM * 1.3,
            -this.valveHeightMM * ((2 * n) / 2 + 0.3),
            this.valveHeightMM * 2.6,
            this.valveHeightMM * (2 * n + 0.6)
        );

        ctx.beginPath();
        ctx.rect(
            -this.valveHeightMM * 1.3,
            -this.valveHeightMM * ((2 * n) / 2 + 0.3),
            this.valveHeightMM * 2.6,
            this.valveHeightMM * (2 * n + 0.6)
        );
        ctx.stroke();

        ctx.fillStyle = oldfs;
        for (let i = 0; i < n; i++) {
            const yOffset = (-n / 2 + i + 0.5) * (this.valveWidthMM * 1.3);
            ctx.beginPath();
            ctx.moveTo(-this.valveHeightMM, -this.valveWidthMM / 2 + yOffset);
            ctx.lineTo(-this.valveHeightMM, this.valveWidthMM / 2 + yOffset);
            ctx.lineTo(this.valveHeightMM, 0 + yOffset);
            ctx.closePath();
            ctx.fill();
        }
    }

    drawPrvSingle(context: DrawingContext) {
        this.drawPrvN(context, 1);
    }

    drawPrvDouble(context: DrawingContext) {
        this.drawPrvN(context, 2);
    }

    drawPrvTriple(context: DrawingContext) {
        this.drawPrvN(context, 3);
    }

    drawRpzdSingle(context: DrawingContext) {
        const ctx = context.ctx;
        const oldfs = ctx.fillStyle;
        ctx.fillStyle = "#ffffff";

        ctx.fillRect(-this.valveHeightMM * 1.3, -this.valveHeightMM * 1.3, this.valveHeightMM * 2.6, this.valveHeightMM * 2.6);

        ctx.beginPath();
        ctx.rect(-this.valveHeightMM * 1.3, -this.valveHeightMM * 1.3, this.valveHeightMM * 2.6, this.valveHeightMM * 2.6);
        ctx.stroke();

        ctx.fillStyle = oldfs;
        ctx.beginPath();
        ctx.moveTo(-this.valveHeightMM, -this.valveWidthMM / 2);
        ctx.lineTo(-this.valveHeightMM, this.valveWidthMM / 2);
        ctx.lineTo(this.valveHeightMM, 0);
        ctx.closePath();
        ctx.fill();
    }

    drawWaterMeter(context: DrawingContext) {
        const ctx = context.ctx;
        ctx.beginPath();
        ctx.moveTo(-this.valveWidthMM, -this.valveHeightMM);
        ctx.lineTo(this.valveWidthMM, this.valveHeightMM);
        ctx.lineTo(-this.valveWidthMM, this.valveHeightMM);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-this.valveWidthMM, -this.valveHeightMM);
        ctx.lineTo(this.valveWidthMM, -this.valveHeightMM);
        ctx.lineTo(this.valveWidthMM, this.valveHeightMM);
        ctx.lineTo(-this.valveWidthMM, this.valveHeightMM);
        ctx.lineTo(-this.valveWidthMM, -this.valveHeightMM);
        ctx.stroke();
    }

    drawStrainer(context: DrawingContext) {
        const ctx = context.ctx;
        ctx.beginPath();
        const offset = this.valveHeightMM / 2;
        ctx.moveTo(-this.valveWidthMM, -this.valveHeightMM + offset);
        ctx.lineTo(-this.valveWidthMM, 0 + offset);
        ctx.moveTo(-this.valveWidthMM, -this.valveHeightMM / 2 + offset);
        ctx.lineTo(this.valveWidthMM, -this.valveHeightMM / 2 + offset);
        ctx.moveTo(this.valveWidthMM, -this.valveHeightMM + offset);
        ctx.lineTo(this.valveWidthMM, 0 + offset);

        ctx.moveTo(-this.valveWidthMM / 2, -this.valveHeightMM / 2 + offset);
        ctx.lineTo(this.valveWidthMM / 2, this.valveHeightMM / 2 + offset);
        ctx.moveTo(this.valveWidthMM * 0.8, this.valveHeightMM * 0.2 + offset);
        ctx.lineTo(this.valveWidthMM * 0.2, this.valveHeightMM * 0.8 + offset);
        ctx.stroke();
    }

    flip() {
        const entity = this.entity;
        const connections = this.globalStore.getConnections(entity.uid);

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
            throw new Error("Directed valve is connected to too many things");
        }
    }

    inBounds(objectCoord: Coord, objectRadius?: number): boolean {
        if (!this.isActive()) {
            return false;
        }
        const dist = Math.sqrt(objectCoord.x ** 2 + objectCoord.y ** 2);
        return dist < this.valveWidthMM + (objectRadius ? objectRadius : 0);
    }

    prepareDelete(context: CanvasContext): BaseBackedObject[] {
        return [];
    }

    rememberToRegister(): void {
        //
    }

    largestPipeSizeNominalMM(context: CalculationContext): number | null {
        const sizes = this.globalStore.getConnections(this.entity.uid).map((uid) => {
            const p = this.globalStore.get(uid) as Pipe;
            if (!p || p.type !== EntityType.PIPE) {
                throw new Error("A non pipe object is connected to a valve");
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

    largestPipeSizeInternal(context: CalculationContext): number | null {
        const sizes = this.globalStore.getConnections(this.entity.uid).map((uid) => {
            const p = this.globalStore.get(uid) as Pipe;
            if (!p || p.type !== EntityType.PIPE) {
                throw new Error("A non pipe object is connected to a valve");
            }

            const calculation = context.globalStore.getCalculation(p.entity);
            if (!calculation || calculation.realInternalDiameterMM === null) {
                return null;
            } else {
                return calculation.realInternalDiameterMM;
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

        if (this.globalStore.getConnections(this.entity.uid).length !== 2) {
            throw new Error("need 2 connections to have a calculation here.");
        }

        // 1. Directional control
        switch (this.entity.valve.type) {
            case ValveType.CHECK_VALVE:
            case ValveType.ISOLATION_VALVE:
            case ValveType.WATER_METER:
            case ValveType.STRAINER: {
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
            }

            case ValveType.RPZD_SINGLE:
            case ValveType.RPZD_DOUBLE_SHARED:
            case ValveType.RPZD_DOUBLE_ISOLATED: {
                if (from.connection !== this.entity.sourceUid) {
                    return sign * (1e10 + flowLS);
                }
                break;
            }
            case ValveType.GAS_REGULATOR:
            case ValveType.FILTER:
            case ValveType.PRV_SINGLE:
            case ValveType.PRV_DOUBLE:
            case ValveType.PRV_TRIPLE:
            case ValveType.BALANCING:
            case ValveType.FLOOR_WASTE:
            case ValveType.INSPECTION_OPENING:
            case ValveType.REFLUX_VALVE:
                break;
            default:
                assertUnreachable(this.entity.valve);
        }

        // 2. Pressure Loss Method
        switch (context.drawing.metadata.calculationParams.componentPressureLossMethod) {
            case ComponentPressureLossMethod.INDIVIDUALLY:
                // Find pressure loss from components
                break;
            case ComponentPressureLossMethod.PERCENT_ON_TOP_OF_PIPE:
                return 0;
            default:
                assertUnreachable(context.drawing.metadata.calculationParams.componentPressureLossMethod);
        }

        // 3. Component pressure loss
        let kValue: number | null = 0;
        switch (this.entity.valve.type) {
            case ValveType.CHECK_VALVE:
            case ValveType.ISOLATION_VALVE:
            case ValveType.STRAINER: {
                const table = context.catalog.valves[this.entity.valve.catalogId];
                const size = this.largestPipeSizeNominalMM(context);
                if (size === null) {
                    return null;
                }
                kValue = parseCatalogNumberExact(lowerBoundTable(table.valvesBySize, size)!.kValue);
                break;
            }

            case ValveType.RPZD_SINGLE:
            case ValveType.RPZD_DOUBLE_SHARED:
            case ValveType.RPZD_DOUBLE_ISOLATED: {
                const calcs = context.globalStore.getOrCreateCalculation(this.entity);
                const size = calcs.sizeMM;
                if (size === null) {
                    return null;
                }

                const systemUid = determineConnectableSystemUid(context.globalStore, this.entity);
                if (systemUid === undefined) {
                    return null;
                }

                return getRpzdHeadLoss(
                    context,
                    this.entity.valve.catalogId,
                    calcs.sizeMM!,
                    flowLS,
                    systemUid,
                    this.entity.valve.type,
                    this.entity.valve.type === ValveType.RPZD_DOUBLE_ISOLATED
                        ? this.entity.valve.isolateOneWhenCalculatingHeadLoss
                        : false
                );
            }

            case ValveType.PRV_SINGLE:
            case ValveType.PRV_DOUBLE:
            case ValveType.PRV_TRIPLE:
                if (from.connection === this.entity.sourceUid) {
                    // ok.
                    const myPressure = pressureKPA;

                    const systemUid = determineConnectableSystemUid(context.globalStore, this.entity);
                    if (systemUid === undefined) {
                        return null;
                    }

                    if (myPressure !== null) {
                        if (myPressure > this.entity.valve.targetPressureKPA!) {
                            return kpa2head(
                                myPressure - this.entity.valve.targetPressureKPA!,
                                getFluidDensityOfSystem(systemUid, context.doc, context.catalog)!,
                                context.doc.drawing.metadata.calculationParams.gravitationalAcceleration
                            );
                        } else {
                            return 0;
                        }
                    } else {
                        return null;
                    }
                } else {
                    return null;
                }
            case ValveType.BALANCING:
                // Pressure for balancing valve is to be set beforehand.
                const sysUid = determineConnectableSystemUid(context.globalStore, this.entity);
                if (!sysUid) {
                    return null;
                }
                const vCalc = context.globalStore.getOrCreateCalculation(this.entity);
                if (vCalc.pressureDropKPA === null) {
                    return null;
                }
                return kpa2head(
                    vCalc.pressureDropKPA,
                    getFluidDensityOfSystem(sysUid, context.doc, context.catalog)!,
                    context.doc.drawing.metadata.calculationParams.gravitationalAcceleration,
                );
            case ValveType.GAS_REGULATOR: {
                if (from.connection === this.entity.sourceUid) {
                    const myPressure = pressureKPA;
                    const systemUid = determineConnectableSystemUid(context.globalStore, this.entity);
                    if (systemUid === undefined) {
                        return null;
                    }

                    if (myPressure !== null) {
                        if (myPressure > this.entity.valve.outletPressureKPA!) {
                            return kpa2head(
                                myPressure - this.entity.valve.outletPressureKPA!,
                                getFluidDensityOfSystem(systemUid, context.doc, context.catalog)!,
                                context.doc.drawing.metadata.calculationParams.gravitationalAcceleration
                            );
                        } else {
                            return 0;
                        }
                    } else {
                        return null;
                    }
                } else {
                    return null;
                }
            }
            case ValveType.WATER_METER:
            case ValveType.FILTER: {
                const systemUid = determineConnectableSystemUid(context.globalStore, this.entity);
                if (systemUid === undefined) {
                    return null;
                }

                return kpa2head(
                    this.entity.valve.pressureDropKPA!,
                    getFluidDensityOfSystem(systemUid, context.doc, context.catalog)!,
                    context.doc.drawing.metadata.calculationParams.gravitationalAcceleration
                );
            }
            case ValveType.FLOOR_WASTE:
            case ValveType.INSPECTION_OPENING:
            case ValveType.REFLUX_VALVE:
                return null;
            default:
                assertUnreachable(this.entity.valve);
        }

        const volLM = (this.largestPipeSizeInternal(context)! ** 2 * Math.PI) / 4 / 1000;
        const velocityMS = flowLS / volLM;
        if (kValue) {
            return sign * fittingFrictionLossMH(velocityMS, kValue, ga)
        } else {
            return 0;
        }
    }

    friendlyTypeName(catalog: Catalog): string {
        switch (this.entity.valve.type) {
            case ValveType.ISOLATION_VALVE:
                const systemUid = determineConnectableSystemUid(this.globalStore, this.entity);
                if (isGas(systemUid!, catalog.fluids, this.document.drawing.metadata.flowSystems)) {
                    return 'Isolation Valve';
                }
            // noinspection FallThroughInSwitchStatementJS
            case ValveType.CHECK_VALVE:
            case ValveType.WATER_METER:
            case ValveType.STRAINER:
                return catalog.valves[this.entity.valve.catalogId].name;
            case ValveType.RPZD_DOUBLE_ISOLATED:
                return "RPZD Double Isolated - 100% Load";
            case ValveType.RPZD_SINGLE:
                return "RPZD";
            case ValveType.RPZD_DOUBLE_SHARED:
                return "RPZD Double - 50/50 Load";
            case ValveType.PRV_SINGLE:
                return "PRV Single";
            case ValveType.PRV_DOUBLE:
                return "PRV Double (50% Load Each)";
            case ValveType.PRV_TRIPLE:
                return "PRV Triple (33.3% Load Each)";
            case ValveType.BALANCING:
                return "Balancing Valve";
            case ValveType.GAS_REGULATOR:
                return "Gas Regulator";
            case ValveType.FILTER:
                return "Filter";
            case ValveType.FLOOR_WASTE:
                return "Floor waste";
            case ValveType.INSPECTION_OPENING:
                return "Inspection opening";
            case ValveType.REFLUX_VALVE:
                return "Reflux valve";
        }
        assertUnreachable(this.entity.valve);
    }


    sourceHeirs: string[] = [];
    connect(uid: string) {
        if (!this.globalStore.suppressSideEffects) {
            if (this.globalStore.getConnections(this.entity.uid).length === 0) {
                // this.entity.sourceUid = uid;
            } else if (this.globalStore.getConnections(this.entity.uid).length === 1) {
                if (this.entity.sourceUid !== this.globalStore.getConnections(this.entity.uid)[0]) {
                    this.entity.sourceUid = uid;
                }
            } else {
                // The following error is disabled to allow intermittent connecting / disconnecting.
                // throw new Error('shouldn\'t be extending here. connections: ' +
                // JSON.stringify(this.objectStore.getConnections(this.entity.uid)) + ' connecting ' + uid);
                this.sourceHeirs.push(uid);
            }
        } else {
            this.sourceHeirs.splice(0);
        }
    }

    disconnect(uid: string) {
        if (!this.globalStore.suppressSideEffects) {
            const conns = this.globalStore.getConnections(this.entity.uid);
            if (conns.length > 2) {
                this.sourceHeirs = this.sourceHeirs.filter((tuid) => tuid !== uid);

                if (uid === this.entity.sourceUid) {
                    if (this.sourceHeirs.length === 0) {
                        this.entity.sourceUid = conns[0];
                    } else {
                        this.entity.sourceUid = this.sourceHeirs.splice(0, 1)[0];
                    }
                }
            }
        } else {
            this.sourceHeirs.splice(0);
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
            if (this.globalStore.has(e.sourceUid)) {
                e.sourceUid = this.globalStore.get(e.sourceUid)!.getCalculationEntities(context)[0].uid;
            }
            return [e];
        } else if (tower.length === 2) {
            // Plop us on the pipe in the middle.
            const pipe = tower[1][1]!;
            const p1 = cloneSimple(pipe);
            const p2 = cloneSimple(pipe);
            p2.uid = p1.uid + ".segment.2";
            (p1 as MutablePipe).endpointUid = [p1.endpointUid[0], this.uid + ".calculation"];
            (p2 as MutablePipe).endpointUid = [this.uid + ".calculation", p2.endpointUid[1]];
            let lower: string;
            let higher: string;
            if (p1.endpointUid[0] === tower[0][0].uid) {
                lower = p1.uid;
                higher = p2.uid;
            } else {
                lower = p2.uid;
                higher = p1.uid;
            }

            if (lower === undefined || higher === undefined) {
                throw new Error("Invalid tower configuration");
            }

            const e = cloneSimple(this.entity);
            e.uid = e.uid + ".calculation";
            e.calculationHeightM = (tower[0][0].calculationHeightM! + tower[1][0].calculationHeightM!) / 2;

            // we have to figure out whether source is the lower one or higher one.
            if (
                (this.globalStore.get(this.entity.sourceUid) as Pipe).entity.heightAboveFloorM <
                (this.globalStore.get(this.otherUid!) as Pipe).entity.heightAboveFloorM
            ) {
                // source is #0
                e.sourceUid = lower;
            } else {
                e.sourceUid = higher;
            }

            return [e, tower[0][0], p1, p2, tower[1][0]];
        } else {
            throw new Error("Invalid tower configuration on directed valve");
        }
    }

    collectCalculations(context: CalculationContext): DirectedValveCalculation {
        // find the only directed valve in there and take its calc.
        const me = this.getCalculationEntities(context).find(
            (e) => e.type === EntityType.DIRECTED_VALVE
        ) as DirectedValveEntity;

        if (!me) {
            if (this.getCalculationEntities(context).length === 0) {
                return emptyDirectedValveCalculation();
            } else {
                throw new Error("Can't find self in calculations " + this.uid + " " + this.entity.valve.type);
            }
        } else {
            return context.globalStore.getOrCreateCalculation(me);
        }
    }

    protected refreshObjectInternal(obj: DrawableEntity, old?: DrawableEntity): void {
        //
    }

    costBreakdown(context: CalculationContext): CostBreakdown | null {
        let size = this.largestPipeSizeNominalMM(context);

        const calc = context.globalStore.getOrCreateCalculation(this.entity);
        let ownSize = calc.sizeMM;
        switch (this.entity.valve.type) {
            case ValveType.CHECK_VALVE:
                size = lowerBoundNumberTable(context.priceTable.Valves["Check Valve"], size);
                if (size) {
                    return {
                        cost: context.priceTable.Valves["Check Valve"][size],
                        breakdown: [{
                            qty: 1,
                            path: `Valves.Check Valve.${size}`,
                        }],
                    };
                }
                break;
            case ValveType.ISOLATION_VALVE:
                switch (this.entity.valve.catalogId) {
                    case "gateValve":
                        size = lowerBoundNumberTable(context.priceTable.Valves["Brass Gate Valve"], size);
                        if (size) {
                            return {
                                cost: context.priceTable.Valves["Brass Gate Valve"][size],
                                breakdown: [{
                                    qty: 1,
                                    path: `Valves.Brass Gate Valve.${size}`,
                                }],
                            };
                        }
                        break;
                    case "ballValve":
                        size = lowerBoundNumberTable(context.priceTable.Valves["Brass Ball Valve"], size);
                        if (size) {
                            return {
                                cost: context.priceTable.Valves["Brass Ball Valve"][size],
                                breakdown: [{
                                    qty: 1,
                                    path: `Valves.Brass Ball Valve.${size}`,
                                }],
                            };
                        }
                        break;
                    case "butterflyValve":
                        size = lowerBoundNumberTable(context.priceTable.Valves["Butterfly Valve"], size);
                        if (size) {
                            return {
                                cost: context.priceTable.Valves["Butterfly Valve"][size],
                                breakdown: [{
                                    qty: 1,
                                    path: `Valves.Butterfly Valve.${size}`,
                                }],
                            };
                        }
                        break;
                }
                break;
            case ValveType.WATER_METER: {
                const system = determineConnectableSystemUid(context.globalStore, this.entity);
                if (isGas(system!, context.catalog.fluids, context.drawing.metadata.flowSystems)) {
                    return {
                        cost: context.priceTable.Equipment["Gas Meter"],
                        breakdown: [{
                            qty: 1,
                            path: `Equipment.Gas Meter`,
                        }],
                    };
                } else {

                    size = lowerBoundNumberTable(context.priceTable.Valves["Water Meter"], size);
                    if (size) {
                        return {
                            cost: context.priceTable.Valves["Water Meter"][size],
                            breakdown: [{
                                qty: 1,
                                path: `Valves.Water Meter.${size}`,
                            }],
                        };
                    }
                }

                break;
            }
            case ValveType.STRAINER:
                size = lowerBoundNumberTable(context.priceTable.Valves.Strainer, size);
                if (size) {
                    return {
                        cost: context.priceTable.Valves["Strainer"][size],
                        breakdown: [{
                            qty: 1,
                            path: `Valves.Strainer.${size}`,
                        }],
                    };
                }
                break;
            case ValveType.RPZD_SINGLE:
                ownSize = lowerBoundNumberTable(context.priceTable.Equipment.RPZD, ownSize);
                if (ownSize) {
                    return {
                        cost: context.priceTable.Equipment.RPZD[ownSize],
                        breakdown: [{
                            qty: 1,
                            path: `Equipment.RPZD.${ownSize}`,
                        }],
                    };
                }
                break;
            case ValveType.RPZD_DOUBLE_SHARED:
                ownSize = lowerBoundNumberTable(context.priceTable.Equipment.RPZD, ownSize);
                if (ownSize) {
                    return {
                        cost: context.priceTable.Equipment.RPZD[ownSize] * 2,
                        breakdown: [{
                            qty: 2,
                            path: `Equipment.RPZD.${ownSize}`,
                        }],
                    };
                }
                break;
            case ValveType.RPZD_DOUBLE_ISOLATED:
                ownSize = lowerBoundNumberTable(context.priceTable.Equipment.RPZD, ownSize);
                if (ownSize) {
                    return {
                        cost: context.priceTable.Equipment.RPZD[ownSize] * 2,
                        breakdown: [{
                            qty: 2,
                            path: `Equipment.RPZD.${ownSize}`,
                        }],
                    };
                }
                break;
            case ValveType.PRV_SINGLE:
                ownSize = lowerBoundNumberTable(context.priceTable.Equipment.PRV, ownSize);
                if (ownSize) {
                    return {
                        cost: context.priceTable.Equipment.PRV[ownSize],
                        breakdown: [{
                            qty: 1,
                            path: `Equipment.PRV.${ownSize}`,
                        }],
                    };
                }
                break;
            case ValveType.PRV_DOUBLE:
                ownSize = lowerBoundNumberTable(context.priceTable.Equipment.PRV, ownSize);
                if (ownSize) {
                    return {
                        cost: context.priceTable.Equipment.PRV[ownSize] * 2,
                        breakdown: [{
                            qty: 2,
                            path: `Equipment.PRV.${ownSize}`,
                        }],
                    };
                }
                break;
            case ValveType.PRV_TRIPLE:
                ownSize = lowerBoundNumberTable(context.priceTable.Equipment.PRV, ownSize);
                if (ownSize) {
                    return {
                        cost: context.priceTable.Equipment.PRV[ownSize] * 2,
                        breakdown: [{
                            qty: 2,
                            path: `Equipment.PRV.${ownSize}`,
                        }],
                    };
                }
                break;
            case ValveType.BALANCING:
                size = lowerBoundNumberTable(context.priceTable.Equipment["Balancing Valve"], size);
                if (size) {
                    return {
                        cost: context.priceTable.Equipment["Balancing Valve"][size],
                        breakdown: [{
                            qty: 1,
                            path: `Equipment.Balancing Valve.${size}`,
                        }],
                    };
                }
                break;
            case ValveType.FILTER:
                return {
                    cost: context.priceTable.Equipment["Gas Filter"],
                    breakdown: [{
                        qty: 1,
                        path: `Equipment.Gas Filter`,
                    }],
                };
            case ValveType.GAS_REGULATOR:
                return {
                    cost: context.priceTable.Equipment["Gas Regulator"],
                    breakdown: [{
                        qty: 1,
                        path: `Equipment.Gas Regulator`,
                    }],
                };
            case ValveType.FLOOR_WASTE:
                return {
                    cost: context.priceTable.Equipment['Floor Waste'],
                    breakdown: [{
                        qty: 1,
                        path: `Equipment.Floor Waste`,
                    }]
                };
            case ValveType.INSPECTION_OPENING:
                return {
                    cost: context.priceTable.Equipment['Inspection Opening'],
                    breakdown: [{
                        qty: 1,
                        path: `Equipment.Inspection Opening`,
                    }]
                };
            case ValveType.REFLUX_VALVE:
                size = lowerBoundNumberTable(context.priceTable.Equipment["Reflux Valve"], size);
                if (size) {
                    return {
                        cost: context.priceTable.Equipment['Reflux Valve'][size],
                        breakdown: [{
                            qty: 1,
                            path: `Equipment.Reflux Valve.${size}`,
                        }]
                    };
                }
                break;
            default:
                assertUnreachable(this.entity.valve);
        }
        return null;
    }

    getConnetectedSidePipe(pipeUid: string): Pipe[] {
        const connectionUids = this.globalStore.getConnections(this.uid)!;
        const sidePipeUids = connectionUids.filter((uid) => uid !== pipeUid);
        return sidePipeUids.map((uid) => this.globalStore.get(uid)! as Pipe);
    }

    dragByBackConnectableEntity(context: CanvasContext, pipeUid: string, point: Coord, originCenter: Coord, direction?: Direction, skip?: boolean) {
        const sidePipes = this.getConnetectedSidePipe(pipeUid);
        if (skip) {
            sidePipes.forEach((sidePipe) => {
                sidePipe.dragConnectableEntity(context, this.uid, point, originCenter);
            });
            return;
        }
        if ((!direction || direction == Direction.Horizontal) && isSameWorldPX(this.entity.center.x, originCenter.x)) {
            this.debase(context);
            this.entity.center.x += point.x - originCenter.x;
            this.rebase(context);
            sidePipes.forEach((sidePipe) => {
                sidePipe.dragConnectableEntity(context, this.uid, point, originCenter, Direction.Horizontal);
            });
        } else if ((!direction || direction == Direction.Vertical) && isSameWorldPX(this.entity.center.y, originCenter.y)) {
            this.debase(context);
            this.entity.center.y += point.y - originCenter.y;
            this.rebase(context);
            sidePipes.forEach((sidePipe) => {
                sidePipe.dragConnectableEntity(context, this.uid, point, originCenter, Direction.Vertical);
            });
        }
    }
}
