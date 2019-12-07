import BackedDrawableObject from '../../../src/htmlcanvas/lib/backed-drawable-object';
import BaseBackedObject from '../../../src/htmlcanvas/lib/base-backed-object';
import PipeEntity, {fillPipeDefaultFields, makePipeFields} from '../../../src/store/document/entities/pipe-entity';
import * as TM from 'transformation-matrix';
import {Matrix} from 'transformation-matrix';
import {DrawingMode} from '../../../src/htmlcanvas/types';
import {CalculationFilter, CalculationFilters, ConnectableEntity, Coord, DocumentState} from '../../../src/store/document/types';
import {matrixScale} from '../../../src/htmlcanvas/utils';
import Flatten from '@flatten-js/core';
import {Draggable, DraggableObject} from '../../../src/htmlcanvas/lib/object-traits/draggable-object';
import * as _ from 'lodash';
import {canonizeAngleRad, connect, disconnect, getPropertyByString, lighten} from '../../../src/lib/utils';
import {Interaction, InteractionType} from '../../../src/htmlcanvas/lib/interaction';
import {DrawingContext} from '../../../src/htmlcanvas/lib/types';
import DrawableObjectFactory from '../../../src/htmlcanvas/lib/drawable-object-factory';
import {EntityType} from '../../../src/store/document/entities/types';
import BackedConnectable from '../../../src/htmlcanvas/lib/BackedConnectable';
import {PipeMaterial, PipeSpec} from '../../../src/store/catalog/types';
import {interpolateTable, lowerBoundTable, parseCatalogNumberExact} from '../../../src/htmlcanvas/lib/utils';
import {CalculationContext} from '../../../src/calculations/types';
import {ConnectableEntityConcrete, DrawableEntityConcrete} from '../../../src/store/document/entities/concrete-entity';
import CanvasContext from '../../../src/htmlcanvas/lib/canvas-context';
import {SelectableObject} from '../../../src/htmlcanvas/lib/object-traits/selectable';
import uuid from 'uuid';
import FittingEntity from '../../../src/store/document/entities/fitting-entity';
import assert from 'assert';
import {PIPE_STUB_MAX_LENGTH_MM} from '../../../src/htmlcanvas/lib/black-magic/auto-connect';
import {EPS, getDarcyWeisbachFlatMH} from '../../../src/calculations/pressure-drops';
import {SIGNIFICANT_FLOW_THRESHOLD} from '../../../src/htmlcanvas/layers/calculation-layer';
import {FlowNode} from '../../../src/calculations/calculation-engine';
import {DrawingArgs} from '../../../src/htmlcanvas/lib/drawable-object';
import {DEFAULT_FONT_NAME} from '../../../src/config';
import {CalculationData, CalculationField} from '../../../src/store/document/calculations/calculation-field';
import {makePipeCalculationFields} from '../../../src/store/document/calculations/pipe-calculation';
import {Calculated, CalculatedObject, FIELD_HEIGHT} from '../../../src/htmlcanvas/lib/object-traits/calculated-object';

export const TEXT_MAX_SCALE = 0.4;
export const MIN_PIPE_PIXEL_WIDTH = 3.5;

@CalculatedObject
@SelectableObject
@DraggableObject
export default class Pipe extends BackedDrawableObject<PipeEntity> implements Draggable, Calculated {

    static register(): void {
        DrawableObjectFactory.registerEntity(EntityType.PIPE, Pipe);
    }

    lastDrawnLine!: Flatten.Segment | Flatten.Point;
    lastDrawnWidthInternal!: number;

    get position(): Matrix {
        // We don't draw by object location because the object doesn't really have an own location. Instead, its
        // location is determined by other objects.
        return TM.identity();
    }

    locateCalculationBoxWorld(context: DrawingContext, data: CalculationData[], scale: number): TM.Matrix[] {
        const {ctx, vp} = context;
        // Manage to draw on screen first

        if (!this.entity.calculation) {
            return [];
        }
        // Manage to draw rotated first
        const shape = this.shape();
        if (shape instanceof Flatten.Point) {
            return [];
        }

        const results: TM.Matrix[] = [];

        [0.5, 0.60, 0.40, 0.70, 0.30, 0.80, 0.20, 0.90, 0.10].forEach((ratio) => {
            const avgx = (shape.start.x * ratio + shape.end.x * (1 - ratio));
            const avgy = (shape.start.y * ratio + shape.end.y * (1 - ratio));

            const length = vp.toScreenLength(shape.length);

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
                    TM.translate(0, 0),
                ),

                TM.transform(
                    TM.identity(),
                    TM.translate(avgx, avgy),
                    TM.rotate(-angle),
                    TM.scale(scale, scale),
                    TM.translate(0, (+ data.length * FIELD_HEIGHT) / 3),
                ),

                TM.transform(
                    TM.identity(),
                    TM.translate(avgx, avgy),
                    TM.rotate(-angle),
                    TM.scale(scale, scale),
                    TM.translate(0, (- data.length * FIELD_HEIGHT) / 3),
                ),
            );
        });
        return results;
    }

    drawCalculations(context: DrawingContext, filters: CalculationFilters) {
        const {ctx, vp} = context;
        // Manage to draw on screen first

        if (!this.entity.calculation) {
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

        const length = vp.toScreenLength(shape.length);

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
        ctx.translate(0, - this.lastDrawnWidthInternal / 2);

        const s = matrixScale(ctx.getTransform());
        if (s > TEXT_MAX_SCALE) {
            ctx.scale(1 / TEXT_MAX_SCALE, 1 / TEXT_MAX_SCALE);
        } else {
            ctx.scale(1 / s, 1 / s);
        }
        ctx.setTransform(oTM);
    }

    drawInternal(context: DrawingContext, {active, selected, calculationFilters}: DrawingArgs): void {
        const {ctx, doc} = context;
        const s = matrixScale(ctx.getTransform());

        // lol what are our coordinates
        const [aw, bw] = this.worldEndpoints();
        const ao = this.toObjectCoord(aw);
        const bo = this.toObjectCoord(bw);

        let targetWWidth = 10;
        let baseColor = this.displayObject(doc).color!.hex;

        const baseWidth = Math.max(MIN_PIPE_PIXEL_WIDTH / s, targetWWidth / this.toWorldLength(1));
        this.lastDrawnWidthInternal = baseWidth;

        if (calculationFilters) {
            if (this.entity.calculation) {
                if (this.entity.calculation.realNominalPipeDiameterMM) {
                    targetWWidth = this.entity.calculation.realNominalPipeDiameterMM;
                }
            }
            if (!this.entity.calculation ||
                !this.entity.calculation.realNominalPipeDiameterMM ||
                !this.entity.calculation.peakFlowRate ||
                this.entity.calculation.peakFlowRate < SIGNIFICANT_FLOW_THRESHOLD
            ) {
                baseColor = '#aaaaaa';
            }
        }

        ctx.lineCap = 'round';
        if (active && selected) {
            ctx.beginPath();
            ctx.lineWidth = baseWidth + 6.0 / s;
            // this.lastDrawnWidth = baseWidth + 6.0 / s;
            ctx.strokeStyle = lighten(baseColor, 0, 0.5);

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

        if (_.isEqual(ao, bo)) {
            // Because flatten throws an error when creating a line with two equal points, we make a point here instead.
            this.lastDrawnLine = new Flatten.Point(ao.x, ao.y);
        } else {
            this.lastDrawnLine = new Flatten.Segment(new Flatten.Point(ao.x, ao.y), new Flatten.Point(bo.x, bo.y));
        }
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

    // Returns the world coordinates of the two endpoints
    worldEndpoints(excludeUid: string | null = null): Coord[] {
        const a: ConnectableEntity =
            this.objectStore.get(this.entity.endpointUid[0])!.entity as ConnectableEntity;
        const b: ConnectableEntity =
            this.objectStore.get(this.entity.endpointUid[1])!.entity as ConnectableEntity;

        if (!a || !b) {
            throw new Error('One of pipe\'s endpoints are missing. Pipe is: ' + JSON.stringify(this.entity));
        }

        const ao = this.objectStore.get(a.uid) as BaseBackedObject;
        const bo = this.objectStore.get(b.uid) as BaseBackedObject;
        if (ao && bo) {
            const res: Coord[] = [];
            if (ao.uid !== excludeUid) {
                res.push(ao.toWorldCoord({x: 0, y: 0}));
            }
            if (bo.uid !== excludeUid) {
                res.push(bo.toWorldCoord({x: 0, y: 0}));
            }
            return res;
        } else {
            throw new Error('One of pipe\'s endpoints are missing. Pipe is: ' + JSON.stringify(this.entity));
        }
    }

    project(wc: Coord, minWorldEndpointDist: number = 0): Coord {
        const snipped = this.snipEnds(minWorldEndpointDist);
        const p = Flatten.point(wc.x, wc.y).distanceTo(snipped)[1];
        return {x: p.end.x, y: p.end.y};
    }

    inBounds(oc: Coord, radius: number = 0): boolean {
        const shape = this.shape();
        let width = this.lastDrawnWidth;
        if (width === undefined) {
            width = 10;
        }
        return shape.distanceTo(new Flatten.Point(oc.x, oc.y))[0] < width + radius;
    }

    get computedLengthM(): number {
        const [wa, wb] = this.worldEndpoints();
        return Math.sqrt((wa.x - wb.x) ** 2 + (wa.y - wb.y) ** 2) / 1000;
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
            pointOnPipe: _.cloneDeep(this.worldEndpoints()[0]),
        };
    }

    projectEndpoint(
        pointWc: Coord,
        epUid: string,
        direction: Flatten.Vector,
        isStraight: boolean, // we need a precomputed variable because the object changes during a move.
        context: CanvasContext,
    ): FittingEntity | boolean {
        const o = this.objectStore.get(epUid) as BackedConnectable<ConnectableEntityConcrete>;
        const e = o.entity as ConnectableEntityConcrete;
        if (e.type === EntityType.SYSTEM_NODE) {
            return false;
        }

        if (e.connections.length !== 2) {
            return false;
        }

        if (isStraight) {
            // Create pipe instead of extend it.
            const newValveUid = uuid();
            const pipe: PipeEntity = {
                calculation: null,
                color: this.entity.color,
                diameterMM: this.entity.diameterMM,
                endpointUid: [epUid, newValveUid],
                heightAboveFloorM: this.entity.heightAboveFloorM,
                lengthM: null,
                material: this.entity.material,
                maximumVelocityMS: this.entity.maximumVelocityMS,
                parentUid: null,
                systemUid: this.entity.systemUid,
                type: EntityType.PIPE,
                uid: uuid(),
            };


            const perp = direction.rotate90CCW();
            const fromWc = o.toWorldCoord({x: 0, y: 0});
            const perpLine = Flatten.line(Flatten.point(fromWc.x, fromWc.y), perp.rotate90CCW());
            const projLine = Flatten.line(Flatten.point(pointWc.x, pointWc.y), direction.rotate90CCW());
            const newLoc = perpLine.intersect(projLine);
            assert(newLoc.length === 1);

            const valve: FittingEntity = {
                calculation: null,
                center: {x: newLoc[0].x, y: newLoc[0].y},
                color: this.entity.color,
                connections: [this.uid, pipe.uid],
                parentUid: null,
                systemUid: this.entity.systemUid,
                type: EntityType.FITTING,
                uid: newValveUid,
            };

            if (this.entity.endpointUid[0] === epUid) {
                this.entity.endpointUid[0] = newValveUid;
            } else {
                assert(this.entity.endpointUid[1] === epUid);
                this.entity.endpointUid[1] = newValveUid;
            }

            context.$store.dispatch('document/addEntity', pipe);
            context.$store.dispatch('document/addEntity', valve);

            disconnect(context, e.uid, this.uid);
            connect(context, e.uid, pipe.uid);

            return valve;
        } else {
            // extend existing pipe
            // find other pipe
            const opuid = e.connections[0] === this.uid ? e.connections[1] : e.connections[0];
            const opo = this.objectStore.get(opuid) as Pipe;
            const wep = opo.worldEndpoints();
            const incident = Flatten.line(Flatten.point(wep[0].x, wep[0].y), Flatten.point(wep[1].x, wep[1].y));
            const projLine = Flatten.line(Flatten.point(pointWc.x, pointWc.y), direction.rotate90CCW());

            const nwp = projLine.intersect(incident);
            assert(nwp.length === 1);
            o.debase();
            o.entity.center = {x: nwp[0].x, y: nwp[0].y};
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
        isMultiDrag: boolean,
    ): void {
        if (!isMultiDrag) {
            context.$store.dispatch('document/revert', false);
        }
        const needToReposition: string[] = [];
        const spawnedEntities: FittingEntity[] = [];

        const straights: boolean[] = [];
        this.entity.endpointUid.forEach((euid) => {
            const o = this.objectStore.get(euid) as BackedConnectable<ConnectableEntityConcrete>;
            straights.push(o.isStraight(30));
        });

        let i = 0;
        this.entity.endpointUid.forEach((euid) => {
            const o = this.objectStore.get(euid)!;
            if (!o.layer.isSelected(o.uid)) {
                const newProjection = {
                    x: grabState.pointOnPipe.x + eventObjectCoord.x - grabbedObjectCoord.x,
                    y: grabState.pointOnPipe.y + eventObjectCoord.y - grabbedObjectCoord.y,
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
            i ++;
        });

        if (needToReposition.length === 1) {
            // just plop the pipe to the other side
            const e = this.objectStore.get(needToReposition[0]) as BackedConnectable<ConnectableEntityConcrete>;
            if (e.type !== EntityType.SYSTEM_NODE) {
                e.debase();

                const otherSide = this.entity.endpointUid.filter((euid) => euid !== needToReposition[0])[0];
                const oo = this.objectStore.get(otherSide) as BackedConnectable<ConnectableEntityConcrete>;

                let center: Coord;
                if (oo) {
                    center = oo.toWorldCoord({x: 0, y: 0});
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
                const o = this.objectStore.get(euid) as BackedConnectable<ConnectableEntityConcrete>;
                if (o.type !== EntityType.SYSTEM_NODE) {
                    o.debase();
                    o.entity.center.x += eventObjectCoord.x - grabbedObjectCoord.x;
                    o.entity.center.y += eventObjectCoord.y - grabbedObjectCoord.y;
                    o.rebase(context);
                }
            });
        }
        if (!isMultiDrag) {
            context.processDocument(false);
            this.onChange();
        }
    }
    onDragFinish(event: MouseEvent, context: CanvasContext, isMultiDrag: boolean): void {
        //
        if (!isMultiDrag) {
            this.onCommit(event);
        }
    }

    prepareDelete(context: CanvasContext): BaseBackedObject[] {
        const result: BaseBackedObject[] = [this];
        for (let i = 0; i < 2; i++) {
            const a = this.objectStore.get(this.entity.endpointUid[i]);
            if (a instanceof BackedConnectable) {
                result.push(...a.prepareDeleteConnection(this.entity.uid, context));
            } else {
                throw new Error('endpoint non existent on pipe ' + JSON.stringify(this.entity));
            }
        }
        return result;
    }

    offerInteraction(interaction: Interaction): DrawableEntityConcrete[] | null {
        switch (interaction.type) {
            case InteractionType.INSERT:
                return [this.entity];
            case InteractionType.MOVE_ONTO_RECEIVE: {
                if (this.entity.endpointUid.indexOf(interaction.src.uid) !== -1) {
                    return null;
                }
                // We can receive valves.
                if ('connections' in interaction.src) {
                    return [this.entity];
                } else {
                    return null;
                }
            }
            case InteractionType.CONTINUING_PIPE:
            case InteractionType.STARTING_PIPE:
                return [this.entity];
            case InteractionType.MOVE_ONTO_SEND:
                return null;
            case InteractionType.EXTEND_NETWORK:
                if (this.objectStore.get(this.entity.endpointUid[0])!.type === EntityType.SYSTEM_NODE ||
                    this.objectStore.get(this.entity.endpointUid[1])!.type === EntityType.SYSTEM_NODE
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

    getCatalogPage({drawing, catalog}: CalculationContext): PipeMaterial | null {
        const computed = fillPipeDefaultFields(drawing, this.computedLengthM, this.entity);
        if (!computed.material) {
            return null;
        }
        if (!computed.calculation || !computed.calculation.realNominalPipeDiameterMM) {
            return null;
        }
        return catalog.pipes[computed.material];
    }

    getCatalogBySizePage(context: CalculationContext): PipeSpec | null {
        const {drawing} = context;
        const computed = fillPipeDefaultFields(drawing, this.computedLengthM, this.entity);
        if (!computed.calculation || !computed.calculation.realNominalPipeDiameterMM) {
            return null;
        }
        const material = this.getCatalogPage(context);
        if (!material) {
            return null;
        }
        const tableVal = lowerBoundTable(
            material.pipesBySize,
            computed.calculation.realNominalPipeDiameterMM,
        );
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
                l.ps.translate(ps2m.normalize().multiply(worldLength)),
            );
        }
        return ts;
    }

    getFrictionHeadLoss(context: CalculationContext,
                        flowLS: number,
                        from: FlowNode,
                        to: FlowNode,
                        signed: boolean,
    ): number {
        const ga = context.drawing.calculationParams.gravitationalAcceleration;
        const {drawing, catalog, objectStore} = context;
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

        const system = drawing.flowSystems.find((s) => s.uid === entity.systemUid)!;
        const fluid = catalog.fluids[system.fluid];

        const volLM =
            parseCatalogNumberExact(entity.calculation!.realInternalDiameterMM)! ** 2 * Math.PI / 4 / 1000;
        const velocityMS = flowLS / volLM;

        const page = this.getCatalogBySizePage(context);
        if (!page) {
            throw new Error('Cannot find pipe entry for this pipe.');
        }

        const dynamicViscosity = parseCatalogNumberExact(
            // TODO: get temperature of the pipe.
            interpolateTable(fluid.dynamicViscosityByTemperature, system.temperature),
        );

        const retval = sign * getDarcyWeisbachFlatMH(
            parseCatalogNumberExact(page.diameterInternalMM)!,
            parseCatalogNumberExact(page.colebrookWhiteCoefficient)!,
            parseCatalogNumberExact(fluid.densityKGM3)!,
            dynamicViscosity!,
            this.computedLengthM,
            velocityMS,
            ga,
        );

        return retval;
    }

    protected refreshObjectInternal(obj: PipeEntity): void {
        //
    }
}

DrawableObjectFactory.registerEntity(EntityType.PIPE, Pipe);

export interface PipeDragState {
    a2b: Flatten.Vector;
    normal: Flatten.Vector;
    pointOnPipe: Coord;
}
