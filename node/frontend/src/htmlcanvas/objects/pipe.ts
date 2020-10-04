import BackedDrawableObject from "../../../src/htmlcanvas/lib/backed-drawable-object";
import BaseBackedObject from "../../../src/htmlcanvas/lib/base-backed-object";
import PipeEntity, {fillPipeDefaultFields, MutablePipe} from "../../../../common/src/api/document/entities/pipe-entity";
import * as TM from "transformation-matrix";
import {Matrix} from "transformation-matrix";
import {CalculationFilters, DocumentState} from "../../../src/store/document/types";
import Flatten from "@flatten-js/core";
import {Draggable, DraggableObject} from "../../../src/htmlcanvas/lib/object-traits/draggable-object";
import * as _ from "lodash";
import {canonizeAngleRad, lighten, rgb2style} from "../../../src/lib/utils";
import {Interaction, InteractionType} from "../../../src/htmlcanvas/lib/interaction";
import {CostBreakdown, DrawingContext} from "../../../src/htmlcanvas/lib/types";
import DrawableObjectFactory from "../../../src/htmlcanvas/lib/drawable-object-factory";
import {EntityType} from "../../../../common/src/api/document/entities/types";
import BackedConnectable, {BaseBackedConnectable} from "../../../src/htmlcanvas/lib/BackedConnectable";
import {CalculationContext, PressurePushMode} from "../../../src/calculations/types";
import {
    ConnectableEntityConcrete,
    DrawableEntityConcrete,
    isConnectableEntity
} from "../../../../common/src/api/document/entities/concrete-entity";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import {SelectableObject} from "../../../src/htmlcanvas/lib/object-traits/selectable";
import uuid from "uuid";
import FittingEntity from "../../../../common/src/api/document/entities/fitting-entity";
import assert from "assert";
import {PIPE_STUB_MAX_LENGTH_MM} from "../../../src/htmlcanvas/lib/black-magic/auto-connect";
import {getDarcyWeisbachFlatMH} from "../../../src/calculations/pressure-drops";
import {SIGNIFICANT_FLOW_THRESHOLD} from "../../../src/htmlcanvas/layers/calculation-layer";
import {FlowNode} from "../../../src/calculations/calculation-engine";
import {EntityDrawingArgs} from "../../../src/htmlcanvas/lib/drawable-object";
import {CalculationData} from "../../../src/store/document/calculations/calculation-field";
import PipeCalculation, {
    Configuration,
    NoFlowAvailableReason
} from "../../../src/store/document/calculations/pipe-calculation";
import {Calculated, CalculatedObject, FIELD_HEIGHT} from "../../../src/htmlcanvas/lib/object-traits/calculated-object";
import Cached from "../lib/cached";
import {GlobalStore} from "../lib/global-store";
import {PipeMaterial, PipeSpec} from "../../../../common/src/api/catalog/types";
import {Coord, Coord3D} from "../../../../common/src/api/document/drawing";
import {
    cloneSimple,
    interpolateTable,
    lowerBoundTable,
    parseCatalogNumberExact
} from "../../../../common/src/lib/utils";
import { determineConnectableNetwork } from "../../store/document/entities/lib";
import {
    assertUnreachable,
    ComponentPressureLossMethod, isDrainage, isGas,
    StandardFlowSystemUids
} from "../../../../common/src/api/config";
import { SnappableObject } from "../lib/object-traits/snappable-object";
import { getHighlightColor } from "../lib/utils";

export const TEXT_MAX_SCALE = 0.4;
export const MIN_PIPE_PIXEL_WIDTH = 1.5;
export const RING_MAIN_HEAD_LOSS_CONSTANT = 1.28;

let lastDrawnScale: number = 1;

@CalculatedObject
@SelectableObject
@DraggableObject
@SnappableObject
export default class Pipe extends BackedDrawableObject<PipeEntity> implements Draggable, Calculated {
    get position(): Matrix {
        // We don't draw by object location because the object doesn't really have an own location. Instead, its
        // location is determined by other objects.
        return TM.identity();
    }

    get lastDrawnWidth() {
        if (this.lastDrawnWidthInternal !== undefined) {
            return this.lastDrawnWidthInternal;
        }
        return 10;
    }

    set lastDrawnWidth(value: number) {
        this.lastDrawnWidthInternal = value;
    }

    get computedLengthM(): number {
        const [wa, wb] = this.worldEndpoints();
        return Math.sqrt((wa.x - wb.x) ** 2 + (wa.y - wb.y) ** 2 + (wa.z - wb.z) ** 2) / 1000;
    }

    static register(): void {
        DrawableObjectFactory.registerEntity(EntityType.PIPE, Pipe);
    }

    lastDrawnLine!: Flatten.Segment | Flatten.Point;
    lastDrawnWidthInternal!: number;
    snapHoverTimeoutMS: 0;

    locateCalculationBoxWorld(context: DrawingContext, data: CalculationData[], scale: number): TM.Matrix[] {
        const { ctx, vp } = context;
        // Manage to draw on screen first

        if (!context.globalStore.getCalculation(this.entity)) {
            return [];
        }
        // Manage to draw rotated first
        const shape = this.shape();
        if (shape instanceof Flatten.Point) {
            return [];
        }

        const results: TM.Matrix[] = [];

        [0.5, 0.6, 0.4, 0.7, 0.3, 0.8, 0.2, 0.9, 0.1].forEach((ratio) => {
            const avgx = shape.start.x * ratio + shape.end.x * (1 - ratio);
            const avgy = shape.start.y * ratio + shape.end.y * (1 - ratio);

            const length = vp.toSurfaceLength(shape.length);

            if (length < 100) {
                return [];
            }

            let angle = Flatten.vector(shape.start, shape.end).angleTo(Flatten.vector([1, 0]));
            angle = canonizeAngleRad(angle);
            if (Math.abs(angle) > Math.PI / 2) {
                angle += Math.PI;
            }

            results.push(
                TM.transform(
                    TM.identity(),
                    TM.translate(avgx, avgy),
                    TM.rotate(-angle),
                    TM.scale(scale, scale),
                    TM.translate(0, 0)
                ),

                TM.transform(
                    TM.identity(),
                    TM.translate(avgx, avgy),
                    TM.rotate(-angle),
                    TM.scale(scale, scale),
                    TM.translate(0, (+data.length * FIELD_HEIGHT) / 3)
                ),

                TM.transform(
                    TM.identity(),
                    TM.translate(avgx, avgy),
                    TM.rotate(-angle),
                    TM.scale(scale, scale),
                    TM.translate(0, (-data.length * FIELD_HEIGHT) / 3)
                )
            );
        });
        return results;
    }

    drawCalculations(context: DrawingContext, filters: CalculationFilters) {
        const { ctx, vp } = context;
        // Manage to draw on screen first

        if (!context.globalStore.getCalculation(this.entity)) {
            return;
        }
        // Manage to draw rotated first
        const shape = this.shape();
        if (shape instanceof Flatten.Point) {
            return;
        }

        const oTM = ctx.getTransform();

        const avgx = (shape.start.x + shape.end.x) / 2;
        const avgy = (shape.start.y + shape.end.y) / 2;

        const length = vp.toSurfaceLength(shape.length);

        if (length < 100) {
            return;
        }

        ctx.translate(avgx, avgy);

        let angle = Flatten.vector(shape.start, shape.end).angleTo(Flatten.vector([1, 0]));
        angle = canonizeAngleRad(angle);
        if (Math.abs(angle) > Math.PI / 2) {
            angle += Math.PI;
        }

        ctx.rotate(-angle);
        ctx.translate(0, -this.lastDrawnWidthInternal / 2);

        const s = context.vp.currToSurfaceScale(ctx);
        if (s > TEXT_MAX_SCALE) {
            ctx.scale(1 / TEXT_MAX_SCALE, 1 / TEXT_MAX_SCALE);
        } else {
            ctx.scale(1 / s, 1 / s);
        }
        ctx.setTransform(oTM);
    }

    isActive(): boolean {
        const systemUid = this.entity.systemUid;
        switch (this.document.uiState.pressureOrDrainage) {
            case "pressure":
                return !isDrainage(systemUid);
            case "drainage":
                return isDrainage(systemUid);
        }
        assertUnreachable(this.document.uiState.pressureOrDrainage);
    }

    drawEntity(context: DrawingContext, { selected, withCalculation, overrideColorList }: EntityDrawingArgs): void {
        const { ctx, doc } = context;
        const s = context.vp.currToSurfaceScale(ctx);
        lastDrawnScale = s;

        // lol what are our coordinates
        const [aw, bw] = this.worldEndpoints();
        const ao = this.toObjectCoord(aw);
        const bo = this.toObjectCoord(bw);

        let targetWWidth = 15;
        let baseColor = this.displayObject(doc).color!.hex;

        if (!this.isActive()) {
            baseColor = '#777777';
        }

        const baseWidth = Math.max(
            MIN_PIPE_PIXEL_WIDTH / s,
            targetWWidth / this.toWorldLength(1),
            (MIN_PIPE_PIXEL_WIDTH / s) * (5 + Math.log(s))
        );
        this.lastDrawnWidthInternal = baseWidth;

        if (withCalculation) {
            const calculation = context.globalStore.getCalculation(this.entity);
            if (calculation) {
                if (calculation.realNominalPipeDiameterMM) {
                    targetWWidth = calculation.realNominalPipeDiameterMM;
                }
            }
            if (
                calculation &&
                calculation.totalPeakFlowRateLS !== null &&
                calculation.totalPeakFlowRateLS < SIGNIFICANT_FLOW_THRESHOLD
            ) {
                if (calculation.noFlowAvailableReason !== NoFlowAvailableReason.NO_LOADS_CONNECTED) {
                    baseColor = "#aaaaaa";
                }
            }

            ctx.strokeStyle = baseColor;
            ctx.fillStyle = baseColor;
            // Direction arrows
            if (calculation && calculation.configuration === Configuration.RETURN) {
                if (calculation.flowFrom) {
                    const endpoints = [this.toObjectCoord(aw), this.toObjectCoord(bw)];
                    if (calculation.flowFrom.includes(this.entity.endpointUid[1])) {
                        const tmp = endpoints[1];
                        endpoints[1] = endpoints[0];
                        endpoints[0] = tmp;
                    }

                    const gap = baseWidth * 10;
                    const vec = Flatten.vector([endpoints[1].x - endpoints[0].x, endpoints[1].y - endpoints[0].y]).normalize();
                    const orth = vec.rotate90CCW();

                    for (let dist = gap; dist < this.computedLengthM * 1000; dist += gap) {
                        const base = {x: endpoints[0].x, y: endpoints[0].y};
                        base.x += vec.x * dist;
                        base.y += vec.y * dist;

                        ctx.beginPath();
                        ctx.moveTo(base.x, base.y);
                        ctx.lineTo(base.x + orth.x * baseWidth * 1.5, base.y + orth.y * baseWidth * 1.5);
                        ctx.lineTo(base.x + vec.x * baseWidth * 2.5, base.y + vec.y * baseWidth * 2.5);
                        ctx.lineTo(base.x - orth.x * baseWidth * 1.5, base.y - orth.y * baseWidth * 1.5);
                        ctx.fill();
                    }
                }
            }

            if (!calculation || (calculation.rawReturnFlowRateLS === null && calculation.configuration === Configuration.RETURN)) {
                ctx.setLineDash([baseWidth * 1, baseWidth * 2]);
            }

            if (!calculation || (calculation.PSDFlowRateLS === null && calculation.optimalInnerPipeDiameterMM === null)) {
                ctx.setLineDash([baseWidth * 3, baseWidth * 3]);
            }
        }

        ctx.lineCap = "round";
        if (selected || overrideColorList.length ) {
            ctx.beginPath();
            ctx.lineWidth = baseWidth + 6.0 / s;
            // this.lastDrawnWidth = baseWidth + 6.0 / s;
            ctx.strokeStyle = rgb2style(getHighlightColor(
                selected,
                overrideColorList,
                {hex: lighten(baseColor, 0)},
            ), 0.5);

            ctx.moveTo(ao.x, ao.y);
            ctx.lineTo(bo.x, bo.y);
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = baseWidth;
        ctx.moveTo(ao.x, ao.y);
        ctx.lineTo(bo.x, bo.y);
        ctx.stroke();

        ctx.setLineDash([]);

        if (_.isEqual(ao, bo)) {
            // Because flatten throws an error when creating a line with two equal points, we make a point here instead.
            this.lastDrawnLine = new Flatten.Point(ao.x, ao.y);
        } else {
            this.lastDrawnLine = new Flatten.Segment(new Flatten.Point(ao.x, ao.y), new Flatten.Point(bo.x, bo.y));
        }
    }

    // Returns the world coordinates of the two endpoints
    @Cached(
        (kek) => {
            return new Set(
                [
                    kek,
                    ...kek
                        .getNeighbours()
                        .map((o) => o.getParentChain())
                        .flat()
                ].map((o) => o.uid)
            );
        },
        (excludeUid) => excludeUid
    )
    worldEndpoints(excludeUid: string | null = null): Coord3D[] {
        const ao = this.globalStore.get(this.entity.endpointUid[0]) as BaseBackedConnectable;
        const bo = this.globalStore.get(this.entity.endpointUid[1]) as BaseBackedConnectable;
        if (!ao || !bo) {
            throw new Error("One of pipe's endpoints are missing. Pipe is: " + JSON.stringify(this.entity));
        }
        if (ao && bo) {
            const res: Coord3D[] = [];
            if ((ao.entity.calculationHeightM === null) !== (bo.entity.calculationHeightM === null)) {
                throw new Error(
                    "We are working with a 3d object and a 2d object - not allowed \n" +
                        JSON.stringify(ao.entity) +
                        "\n" +
                        JSON.stringify(bo.entity)
                );
            }
            if (ao.uid !== excludeUid) {
                const a = ao.toWorldCoord({ x: 0, y: 0 });
                res.push({ x: a.x, y: a.y, z: (ao.entity.calculationHeightM || 0) * 1000 });
            }
            if (bo.uid !== excludeUid) {
                const b = bo.toWorldCoord({ x: 0, y: 0 });
                res.push({ x: b.x, y: b.y, z: (bo.entity.calculationHeightM || 0) * 1000 });
            }
            return res;
        } else {
            throw new Error("One of pipe's endpoints are missing. Pipe is: " + JSON.stringify(this.entity));
        }
    }

    project(wc: Coord, minWorldEndpointDist: number = 0): Coord {
        const snipped = this.snipEnds(minWorldEndpointDist);
        const p = Flatten.point(wc.x, wc.y).distanceTo(snipped)[1];
        return { x: p.end.x, y: p.end.y };
    }

    inBounds(oc: Coord, radius: number = 0): boolean {
        if (!this.isActive()) {
            return false;
        }
        const shape = this.shape();
        let width = this.lastDrawnWidth;
        if (width === undefined) {
            width = 5;
        }

        // make it clickable
        if (lastDrawnScale) {
            width = Math.max(width, 8 / lastDrawnScale);
        }

        return shape.distanceTo(new Flatten.Point(oc.x, oc.y))[0] < width + radius;
    }

    displayObject(doc: DocumentState): PipeEntity {
        return fillPipeDefaultFields(doc.drawing, this.computedLengthM, this.entity);
    }

    onDragStart(event: MouseEvent, objectCoord: Coord, context: CanvasContext, isMultiDrag: boolean): PipeDragState {
        const eps = this.worldEndpoints();
        const a = Flatten.point(eps[0].x, eps[0].y);
        const b = Flatten.point(eps[1].x, eps[1].y);
        return {
            a2b: Flatten.vector(a, b),
            normal: Flatten.vector(a, b).rotate90CCW(),
            pointOnPipe: _.cloneDeep(this.worldEndpoints()[0])
        };
    }

    projectEndpoint(
        pointWc: Coord,
        epUid: string,
        direction: Flatten.Vector,
        isStraight: boolean, // we need a precomputed variable because the object changes during a move.
        context: CanvasContext
    ): FittingEntity | boolean {
        const o = this.globalStore.get(epUid) as BackedConnectable<ConnectableEntityConcrete>;
        const e = o.entity as ConnectableEntityConcrete;
        if (e.type === EntityType.SYSTEM_NODE) {
            return false;
        }

        if (this.globalStore.getConnections(e.uid).length !== 2) {
            return false;
        }

        if (isStraight) {
            // Create pipe instead of extend it.
            const newValveUid = uuid();
            const pipe: PipeEntity = {
                color: this.entity.color,
                diameterMM: this.entity.diameterMM,
                endpointUid: [epUid, newValveUid],
                heightAboveFloorM: this.entity.heightAboveFloorM,
                lengthM: null,
                material: this.entity.material,
                maximumVelocityMS: this.entity.maximumVelocityMS,
                parentUid: null,
                network: determineConnectableNetwork(this.globalStore, e)!,
                systemUid: this.entity.systemUid,
                type: EntityType.PIPE,
                uid: uuid()
            };

            const perp = direction.rotate90CCW();
            const fromWc = o.toWorldCoord({ x: 0, y: 0 });
            const perpLine = Flatten.line(Flatten.point(fromWc.x, fromWc.y), perp.rotate90CCW());
            const projLine = Flatten.line(Flatten.point(pointWc.x, pointWc.y), direction.rotate90CCW());
            const newLoc = perpLine.intersect(projLine);
            assert(newLoc.length === 1);

            const valve: FittingEntity = {
                center: { x: newLoc[0].x, y: newLoc[0].y },
                color: this.entity.color,
                parentUid: null,
                calculationHeightM: null,
                systemUid: this.entity.systemUid,
                type: EntityType.FITTING,
                uid: newValveUid
            };

            if (this.entity.endpointUid[0] === epUid) {
                context.$store.dispatch("document/updatePipeEndpoints", {
                    entity: this.entity,
                    endpoints: [newValveUid, this.entity.endpointUid[1]]
                });
            } else {
                assert(this.entity.endpointUid[1] === epUid);
                context.$store.dispatch("document/updatePipeEndpoints", {
                    entity: this.entity,
                    endpoints: [this.entity.endpointUid[0], newValveUid]
                });
            }

            context.$store.dispatch("document/addEntity", pipe);
            context.$store.dispatch("document/addEntity", valve);

            return valve;
        } else {
            // extend existing pipe
            // find other pipe
            const econnections = this.globalStore.getConnections(e.uid);
            const opuid = econnections[0] === this.uid ? econnections[1] : econnections[0];
            const opo = this.globalStore.get(opuid) as Pipe;
            const wep = opo.worldEndpoints();
            const incident = Flatten.line(Flatten.point(wep[0].x, wep[0].y), Flatten.point(wep[1].x, wep[1].y));
            const projLine = Flatten.line(Flatten.point(pointWc.x, pointWc.y), direction.rotate90CCW());

            const nwp = projLine.intersect(incident);
            assert(nwp.length === 1);
            o.debase(context);
            o.entity.center = { x: nwp[0].x, y: nwp[0].y };
            o.rebase(context);

            return true;
        }
    }

    onDrag(
        event: MouseEvent,
        grabbedObjectCoord: Coord,
        eventObjectCoord: Coord,
        grabState: PipeDragState,
        context: CanvasContext,
        isMultiDrag: boolean
    ) {
        if (!isMultiDrag) {
            context.$store.dispatch("document/revert", false);
        }
        const needToReposition: string[] = [];
        const spawnedEntities: FittingEntity[] = [];

        const straights: boolean[] = [];
        this.entity.endpointUid.forEach((euid) => {
            const o = this.globalStore.get(euid) as BackedConnectable<ConnectableEntityConcrete>;
            straights.push(o.isStraight(30));
        });

        let i = 0;
        this.entity.endpointUid.forEach((euid) => {
            const o = this.globalStore.get(euid)!;
            if (!context.isSelected(o.uid)) {
                const newProjection = {
                    x: grabState.pointOnPipe.x + eventObjectCoord.x - grabbedObjectCoord.x,
                    y: grabState.pointOnPipe.y + eventObjectCoord.y - grabbedObjectCoord.y
                };
                const res = this.projectEndpoint(newProjection, o.uid, grabState.a2b, straights[i], context);
                if (!res) {
                    // Cannot project for whatever reason, so move it normally plz.
                    needToReposition.push(o.uid);
                }
                if (!_.isBoolean(res)) {
                    spawnedEntities.push(res);
                }
            }
            i++;
        });

        if (needToReposition.length === 1) {
            // just plop the pipe to the other side
            const e = this.globalStore.get(needToReposition[0]) as BackedConnectable<ConnectableEntityConcrete>;
            if (e.type !== EntityType.SYSTEM_NODE) {
                e.debase(context);

                const otherSide = this.entity.endpointUid.filter((euid) => euid !== needToReposition[0])[0];
                const oo = this.globalStore.get(otherSide) as BackedConnectable<ConnectableEntityConcrete>;

                let center: Coord;
                if (oo) {
                    center = oo.toWorldCoord({ x: 0, y: 0 });
                } else {
                    center = spawnedEntities[0].center;
                }
                let newCenter = Flatten.point(center.x, center.y).translate(grabState.a2b);
                if (needToReposition[0] === this.entity.endpointUid[0]) {
                    newCenter = Flatten.point(center.x, center.y).translate(grabState.a2b.multiply(-1));
                }

                e.entity.center = newCenter;
                e.rebase(context);
            }
        } else if (needToReposition.length === 2) {
            // just drag the pipe ends like they were objects.
            this.entity.endpointUid.forEach((euid) => {
                const o = this.globalStore.get(euid) as BackedConnectable<ConnectableEntityConcrete>;
                if (o.type !== EntityType.SYSTEM_NODE) {
                    o.debase(context);
                    o.entity.center.x += eventObjectCoord.x - grabbedObjectCoord.x;
                    o.entity.center.y += eventObjectCoord.y - grabbedObjectCoord.y;
                    o.rebase(context);
                }
            });
        }
        if (!isMultiDrag) {
            this.onRedrawNeeded();
        }
    }
    onDragFinish(event: MouseEvent, context: CanvasContext, isMultiDrag: boolean): void {
        //
        if (!isMultiDrag) {
            this.onInteractionComplete(event);
        }
    }

    prepareDelete(context: CanvasContext): BaseBackedObject[] {
        const result: BaseBackedObject[] = [this];
        const origEndpoints = cloneSimple(this.entity.endpointUid);
        if (this.globalStore instanceof GlobalStore) {
            context.$store.dispatch("document/updatePipeEndpoints", {
                entity: this.entity,
                endpoints: [undefined, undefined]
            });
            for (let i = 0; i < 2; i++) {
                const a = this.globalStore.get(origEndpoints[i]);
                if (a instanceof BackedConnectable) {
                    result.push(...a.prepareDeleteConnection(this.entity.uid, context));
                } else {
                    throw new Error(
                        "endpoint non existent on pipe. non existing is " +
                            JSON.stringify(a) +
                            " " +
                            JSON.stringify(origEndpoints) +
                            " entity is " +
                            JSON.stringify(this.entity) +
                            " " +
                            JSON.stringify(a ? a.entity : undefined)
                    );
                }
            }
        } else {
            throw new Error("Can only delete with global store");
        }
        return result;
    }

    offerInteraction(interaction: Interaction): DrawableEntityConcrete[] | null {
        if (!this.isActive()) {
            return null;
        }

        switch (interaction.type) {
            case InteractionType.INSERT:
                if (interaction.systemUid && interaction.systemUid !== this.entity.systemUid) {
                    return null;
                }
                return [this.entity];
            case InteractionType.MOVE_ONTO_RECEIVE: {
                if (this.entity.endpointUid.indexOf(interaction.src.uid) !== -1) {
                    return null;
                }
                // We can receive valves.
                if (isConnectableEntity(interaction.src)) {
                    if (
                        interaction.src.type !== EntityType.DIRECTED_VALVE &&
                        interaction.src.type !== EntityType.LOAD_NODE
                    ) {
                        if (interaction.src.systemUid !== this.entity.systemUid) {
                            return null;
                        }
                    }
                    return [this.entity];
                } else {
                    return null;
                }
            }
            case InteractionType.CONTINUING_PIPE:
            case InteractionType.STARTING_PIPE:
                if (interaction.system.uid !== this.entity.systemUid) {
                    return null;
                }
                return [this.entity];
            case InteractionType.MOVE_ONTO_SEND:
                return null;
            case InteractionType.EXTEND_NETWORK:
                if (
                    this.globalStore.get(this.entity.endpointUid[0])!.type === EntityType.SYSTEM_NODE ||
                    this.globalStore.get(this.entity.endpointUid[1])!.type === EntityType.SYSTEM_NODE
                ) {
                    if (this.computedLengthM < PIPE_STUB_MAX_LENGTH_MM) {
                        // we can't be the stub pipe of the system node
                        return null;
                    }
                }
                if (interaction.systemUid === null || interaction.systemUid === this.entity.systemUid) {
                    return [this.entity];
                } else {
                    return null;
                }
        }
    }

    rememberToRegister(): void {
        //
    }

    shape(): Flatten.Segment | Flatten.Point {
        const [a, b] = this.worldEndpoints();
        if (_.isEqual(a, b)) {
            return Flatten.point([a.x, a.y]);
        } else {
            return Flatten.segment(a.x, a.y, b.x, b.y);
        }
    }

    getCatalogPage({ drawing, catalog, globalStore }: CalculationContext): PipeMaterial | null {
        const computed = fillPipeDefaultFields(drawing, this.computedLengthM, this.entity);
        if (!computed.material) {
            return null;
        }
        const calculation = globalStore.getCalculation(this.entity);
        return catalog.pipes[computed.material];
    }

    getManufacturerCatalogPage(context: CalculationContext): { [key: string]: PipeSpec } | null {
        const { drawing, catalog } = context;
        const computed = fillPipeDefaultFields(drawing, this.computedLengthM, this.entity);
        if (!computed.material) {
            return null;
        }
        const page = catalog.pipes[computed.material];
        const manufacturer = drawing.metadata.catalog.pipes.find((m) => m.uid === computed.material)?.manufacturer || 'generic';
        const minimumPipeSize = drawing.metadata.flowSystems.find(s => s.uid === computed.systemUid)!.networks[computed.network].minimumPipeSize;
        
        let pipeSize: { [key: string]: PipeSpec } = {};
        for (var i = 0; i < Object.entries(page.pipesBySize[manufacturer]).length; i++) {
            const [key, pipe] = Object.entries(page.pipesBySize[manufacturer])[i];
            if (Number(pipe.diameterNominalMM) >= minimumPipeSize) {
                pipeSize = {...pipeSize, [key]: pipe};
            }
        }

        return pipeSize;
    }

    getCatalogBySizePage(context: CalculationContext): PipeSpec | null {
        const calculation = context.globalStore.getCalculation(this.entity);
        
        if (!calculation || !calculation.realNominalPipeDiameterMM) {
            return null;
        }
        const material = this.getCatalogPage(context);
        if (!material) {
            return null;
        }
 
        const tableVal = lowerBoundTable(this.getManufacturerCatalogPage(context)!, calculation.realNominalPipeDiameterMM);

        return tableVal;
    }

    snipEnds(worldLength: number): Flatten.Segment | Flatten.Point {
        let ts: Flatten.Segment | Flatten.Point = this.shape();
        const l = ts as Flatten.Segment;

        const ep = this.worldEndpoints();
        const middle = Flatten.point((ep[0].x + ep[1].x) / 2, (ep[0].y + ep[1].y) / 2);
        if (l.length <= worldLength * 2) {
            ts = middle;
        } else {
            const pe2m = Flatten.vector(l.pe, middle);
            const ps2m = Flatten.vector(l.ps, middle);
            ts = Flatten.segment(
                l.pe.translate(pe2m.normalize().multiply(worldLength)),
                l.ps.translate(ps2m.normalize().multiply(worldLength))
            );
        }
        return ts;
    }

    @Cached(
        (kek) =>
            new Set(
                [kek]
                    .map((o) => [o, o.getNeighbours(), o.getParentChain()])
                    .flat(2)
                    .map((o) => o.getParentChain())
                    .flat()
                    .map((o) => o.uid)
            ),
        (context, flowLS, from, to, signed, pressureKPA, pressurePushMode) => flowLS + from.connectable + to.connectable + signed + pressureKPA + pressurePushMode
    )
    getFrictionHeadLoss(
        context: CalculationContext,
        flowLS: number,
        from: FlowNode,
        to: FlowNode,
        signed: boolean,
        pressureKPA: number | null,
        pressurePushMode: PressurePushMode,
    ): number | null {
        if (isDrainage(this.entity.systemUid)) {
            return 0;
        }

        const ga = context.drawing.metadata.calculationParams.gravitationalAcceleration;
        const { drawing, catalog, globalStore } = context;
        const entity = this.entity;
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

        const pipeIsGas = isGas(context.doc.drawing.metadata.flowSystems
            .find((f) => f.uid === this.entity.systemUid)?.fluid!, context.catalog);

        const system = drawing.metadata.flowSystems.find((s) => s.uid === entity.systemUid)!;
        const fluid = catalog.fluids[system.fluid];

        const volLM =
            (parseCatalogNumberExact(context.globalStore.getCalculation(this.entity)!.realInternalDiameterMM)! ** 2 *
                Math.PI) /
            4 /
            1000;
        const velocityMS = flowLS / volLM;

        const page = this.getCatalogBySizePage(context);
        if (!page) {
            return null;
        }

        const dynamicViscosity = parseCatalogNumberExact(
            // TODO: get temperature of the pipe.
            interpolateTable(fluid.dynamicViscosityByTemperature, system.temperature)
        );

        let pipeLength = this.entity.lengthM == null ? this.computedLengthM : this.entity.lengthM;

        switch (context.drawing.metadata.calculationParams.componentPressureLossMethod) {
            case ComponentPressureLossMethod.INDIVIDUALLY:
                // Find pressure loss from components
                break;
            case ComponentPressureLossMethod.PERCENT_ON_TOP_OF_PIPE:
                pipeLength *= 1 + 0.01 * context.drawing.metadata.calculationParams.pipePressureLossAddOnPCT;
                break;
            default:
                assertUnreachable(context.drawing.metadata.calculationParams.componentPressureLossMethod);
        }

        let retval = 0;
        if (pipeIsGas) {
            // TODO: Calculate gas.

        } else {

            retval = sign *
            getDarcyWeisbachFlatMH(
                parseCatalogNumberExact(page.diameterInternalMM)!,
                parseCatalogNumberExact(page.colebrookWhiteCoefficient)!,
                parseCatalogNumberExact(fluid.densityKGM3)!,
                dynamicViscosity!,
                pipeLength,
                velocityMS,
                ga
            );
        }

        const calc = context.globalStore.getOrCreateCalculation(this.entity);
        if (calc.configuration === Configuration.RING_MAIN) {
            retval *= RING_MAIN_HEAD_LOSS_CONSTANT;
        }

        let heightHeadLoss = 0;
        const fromo = context.globalStore.get(from.connectable) as BaseBackedConnectable;
        const too = context.globalStore.get(to.connectable) as BaseBackedConnectable;

        if (!this.entity.endpointUid.includes(from.connectable) || !this.entity.endpointUid.includes(to.connectable)) {
            throw new Error("asking for flow from endpoints that don't exist");
        }

        if (fromo.entity.calculationHeightM !== null) {
            if (too.entity.calculationHeightM === null) {
                throw new Error("inconsistent 2d/3d paradigm");
            }
            heightHeadLoss = too.entity.calculationHeightM - fromo.entity.calculationHeightM;
        } else if (too.entity.calculationHeightM !== null) {
            throw new Error("inconsistent 2d/3d paradigm");
        } else {
            throw new Error("pipe " + this.uid + " with no 3d");
        }

        switch (pressurePushMode) {
            case PressurePushMode.PSD:
            case PressurePushMode.Static:
                break;
            case PressurePushMode.CirculationFlowOnly:
                heightHeadLoss = 0;
                break;
            default:
                assertUnreachable(pressurePushMode);
        }

        return retval + heightHeadLoss;
    }

    getCalculationEntities(context: CalculationContext): [PipeEntity] {
        const pe = cloneSimple(this.entity);
        pe.uid += ".calculation";
        (pe as MutablePipe).endpointUid = [
            (this.globalStore.get(pe.endpointUid[0]) as BaseBackedConnectable).getCalculationNode(context, this.uid)
                .uid,

            (this.globalStore.get(pe.endpointUid[1]) as BaseBackedConnectable).getCalculationNode(context, this.uid).uid
        ];
        return [pe];
    }

    collectCalculations(context: CalculationContext): PipeCalculation {
        return context.globalStore.getOrCreateCalculation(this.getCalculationEntities(context)[0]);
    }

    getNeighbours(): BaseBackedObject[] {
        return this.entity.endpointUid.map((uid) => this.globalStore.get(uid)!);
    }

    protected refreshObjectInternal(obj: PipeEntity): void {
        //
    }

    costBreakdown(context: CalculationContext): CostBreakdown | null {
        const filled = fillPipeDefaultFields(context.drawing, this.computedLengthM, this.entity);
        const catalogEntry = this.getCatalogPage(context);
        if (!catalogEntry) {
            return null;
        }

        const manufacturer = context.drawing.metadata.catalog.pipes
            .find((pipeObj) => pipeObj.uid === filled.material)?.manufacturer || 'generic';
        const priceTableName = catalogEntry.manufacturer.find((m) => m.uid === manufacturer)?.priceTableName;
        if (!priceTableName) {
            return null;
        }

        const size = context.globalStore.getOrCreateCalculation(this.entity).realNominalPipeDiameterMM!;
        if (priceTableName in context.priceTable.Pipes) {
            const availableSizes = Object.keys(context.priceTable.Pipes[priceTableName])
                .map((a) => Number(a)).sort((a, b) => a - b);
            if (this.entity.uid.includes('8c8d9e22-2e8e-4584-aeba-a15e23f1c737')) {
                console.log(availableSizes);
            }
            const bestSize = availableSizes.find((s) => s >= size);

            if (bestSize !== undefined && bestSize in context.priceTable.Pipes[priceTableName]) {
                const res: CostBreakdown = {
                    cost: context.priceTable.Pipes[priceTableName][bestSize] * filled.lengthM!,
                    breakdown: [{
                        qty: filled.lengthM!,
                        path: `Pipes.${priceTableName}.${bestSize}`,
                    }],
                };
                if (filled.systemUid === StandardFlowSystemUids.HotWater
                    && context.globalStore.getOrCreateCalculation(filled).configuration === Configuration.RETURN) {
                    // needs insulation
                    const availableInsulationSizes = Object.keys(context.priceTable.Insulation)
                        .map((a) => Number(a)).sort((a, b) => a - b);
                    const bestInsulationSize = availableInsulationSizes.find((s) => s >= bestSize);

                    if (bestInsulationSize) {
                        res.breakdown.push({
                            qty: filled.lengthM!,
                            path: `Insulation.${bestInsulationSize}`
                        });
                        res.cost += context.priceTable.Insulation[bestInsulationSize] * filled.lengthM!;
                    }
                }
                return res;
            }
        }
        return null;
    }
}

DrawableObjectFactory.registerEntity(EntityType.PIPE, Pipe);

export interface PipeDragState {
    a2b: Flatten.Vector;
    normal: Flatten.Vector;
    pointOnPipe: Coord;
}
