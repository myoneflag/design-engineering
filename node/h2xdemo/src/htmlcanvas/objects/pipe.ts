import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import PipeEntity, {fillPipeDefaultFields} from '@/store/document/entities/pipe-entity';
import * as TM from 'transformation-matrix';
import {Matrix} from 'transformation-matrix';
import {DrawingMode, MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';
import {ConnectableEntity, Coord, DocumentState} from '@/store/document/types';
import {matrixScale} from '@/htmlcanvas/utils';
import Flatten from '@flatten-js/core';
import {Draggable, DraggableObject} from '@/htmlcanvas/lib/object-traits/draggable-object';
import * as _ from 'lodash';
import {lighten} from '@/lib/utils';
import {Interaction, InteractionType} from '@/htmlcanvas/lib/interaction';
import {DrawingContext} from '@/htmlcanvas/lib/types';
import DrawableObjectFactory from '@/htmlcanvas/lib/drawable-object-factory';
import {EntityType} from '@/store/document/entities/types';
import BackedConnectable from '@/htmlcanvas/lib/BackedConnectable';
import {PipeMaterial, PipeSpec} from '@/store/catalog/types';
import {lowerBoundTable} from '@/htmlcanvas/lib/utils';
import {CalculationContext} from '@/calculations/types';
import {DrawableEntityConcrete} from '@/store/document/entities/concrete-entity';
import CanvasContext from '@/htmlcanvas/lib/canvas-context';

@DraggableObject
export default class Pipe extends BackedDrawableObject<PipeEntity> implements Draggable {
    static register(): void {
        DrawableObjectFactory.registerEntity(EntityType.PIPE, Pipe);
    }

    lastDrawnLine!: Flatten.Segment | Flatten.Point;
    lastDrawnWidth!: number;

    get position(): Matrix {
        // We don't draw by object location because the object doesn't really have an own location. Instead, its
        // location is determined by other objects.
        return TM.identity();
    }

    drawInternal({ctx, doc}: DrawingContext, layerActive: boolean, selected: boolean, mode: DrawingMode): void {
        const s = matrixScale(ctx.getTransform());

        // lol what are our coordinates
        const [aw, bw] = this.worldEndpoints();
        const ao = this.toObjectCoord(aw);
        const bo = this.toObjectCoord(bw);

        let targetWWidth = 10;
        let baseColor = this.displayObject(doc).color!.hex;

        if (mode === DrawingMode.Calculations) {
            if (this.entity.calculation) {
                if (this.entity.calculation.realNominalPipeDiameterMM) {
                    targetWWidth = this.entity.calculation.realNominalPipeDiameterMM;
                }
            }
            if (!this.entity.calculation || !this.entity.calculation.realNominalPipeDiameterMM) {
                baseColor = '#444444';
            }
        }

        const baseWidth = Math.max(2.0 / s, targetWWidth / this.toWorldLength(1));


        this.lastDrawnWidth = baseWidth;

        ctx.lineCap = 'round';
        if (layerActive && selected) {
            ctx.beginPath();
            ctx.lineWidth = baseWidth + 6.0 / s;
            this.lastDrawnWidth = baseWidth + 6.0 / s;
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
                res.push(ao.fromParentToWorldCoord(a.center));
            }
            if (bo.uid !== excludeUid) {
                res.push(bo.fromParentToWorldCoord(b.center));
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


    onDragStart(objectCoord: Coord) {
        //
    }
    onDrag(grabbedObjectCoord: Coord, eventObjectCoord: Coord, grabState: any): void {
        //
    }
    onDragFinish(): void {
        //
    }

    onMouseDown(event: MouseEvent, context: CanvasContext): boolean {
        const wc = context.viewPort.toWorldCoord({x: event.offsetX, y: event.offsetY});
        const oc = this.toObjectCoord(wc);

        // Check bounds
        if (this.inBounds(oc)) {
            this.onSelect();

            return true;
        }

        return false;
    }

    onMouseMove(event: MouseEvent, context: CanvasContext): MouseMoveResult {
        return UNHANDLED;
    }

    onMouseUp(event: MouseEvent, context: CanvasContext): boolean {
        const wc = context.viewPort.toWorldCoord({x: event.offsetX, y: event.offsetY});
        const oc = this.toObjectCoord(wc);
        // Check bounds
        return this.inBounds(oc);
    }

    prepareDelete(): BaseBackedObject[] {
        const result: BaseBackedObject[] = [this];
        for (let i = 0; i < 2; i++) {
            const a = this.objectStore.get(this.entity.endpointUid[i]);
            if (a instanceof BackedConnectable) {
                result.push(...a.prepareDeleteConnection(this.entity.uid));
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
                if (interaction.systemUid === this.entity.systemUid) {
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

    protected refreshObjectInternal(obj: PipeEntity): void {
        // asdf
    }
}

DrawableObjectFactory.registerEntity(EntityType.PIPE, Pipe);
