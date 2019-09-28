import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import PipeEntity, {fillPipeDefaultFields} from '@/store/document/entities/pipe-entity';
import * as TM from 'transformation-matrix';
import {Matrix} from 'transformation-matrix';
import {ViewPort} from '@/htmlcanvas/viewport';
import {MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';
import {ConnectableEntity, Coord, DocumentState, Rectangle} from '@/store/document/types';
import {matrixScale} from '@/htmlcanvas/utils';
import Flatten from '@flatten-js/core';
import {Draggable, DraggableObject} from '@/htmlcanvas/lib/object-traits/draggable-object';
import * as _ from 'lodash';
import ValveEntity from '@/store/document/entities/valve-entity';
import assert from 'assert';
import {lighten} from '@/lib/utils';
import {Interaction, InteractionType} from '@/htmlcanvas/lib/interaction';
import {DrawingContext} from '@/htmlcanvas/lib/types';
import DrawableObjectFactory from '@/htmlcanvas/lib/drawable-object-factory';
import {EntityType} from '@/store/document/entities/types';
import BackedConnectable from '@/htmlcanvas/lib/BackedConnectable';

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

    drawInternal({ctx, doc}: DrawingContext, layerActive: boolean, selected: boolean): void {
        const s = matrixScale(ctx.getTransform());

        // lol what are our coordinates
        const [aw, bw] = this.worldEndpoints();
        const ao = this.toObjectCoord(aw);
        const bo = this.toObjectCoord(bw);

        ctx.lineCap = 'round';
        if (layerActive && selected) {
            ctx.beginPath();
            ctx.lineWidth = 8.0 / s;
            ctx.strokeStyle = lighten(this.displayObject(doc).color!.hex, 0, 0.5);

            ctx.moveTo(ao.x, ao.y);
            ctx.lineTo(bo.x, bo.y);
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.strokeStyle = this.displayObject(doc).color!.hex;
        ctx.lineWidth = 2.0 / s;
        ctx.moveTo(ao.x, ao.y);
        ctx.lineTo(bo.x, bo.y);
        ctx.stroke();

        if (_.isEqual(ao, bo)) {
            // Because flatten throws an error when creating a line with two equal points, we make a point here instead.
            this.lastDrawnLine = new Flatten.Point(ao.x, ao.y);
        } else {
            this.lastDrawnLine = new Flatten.Segment(new Flatten.Point(ao.x, ao.y), new Flatten.Point(bo.x, bo.y));
        }
        this.lastDrawnWidth = 8.0 / s;
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

    project(wc: Coord): Coord {
        if (this.lastDrawnLine instanceof Flatten.Segment) {
            const shortSeg: Flatten.Segment = this.lastDrawnLine.distanceTo(Flatten.point(wc.x, wc.y))[1];
            return {x: shortSeg.ps.x, y: shortSeg.ps.y};
        } else {
            return {x: this.lastDrawnLine.x, y: this.lastDrawnLine.y};
        }
    }

    inBounds(oc: Coord, radius: number = 0): boolean {
        if (!this.lastDrawnLine) {
            return false;
        }
        return this.lastDrawnLine.distanceTo(new Flatten.Point(oc.x, oc.y))[0] < this.lastDrawnWidth + radius;
    }

    get computedLengthM(): number {
        const [wa, wb] = this.worldEndpoints();
        return Math.sqrt((wa.x - wb.x) ** 2 + (wa.y - wb.y) ** 2) / 1000;
    }

    displayObject(doc: DocumentState): PipeEntity {
        return fillPipeDefaultFields(doc, this.computedLengthM, this.entity);
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

    onMouseDown(event: MouseEvent, vp: ViewPort): boolean {
        const wc = vp.toWorldCoord({x: event.offsetX, y: event.offsetY});
        const oc = this.toObjectCoord(wc);

        // Check bounds
        if (this.inBounds(oc)) {
            this.onSelect();

            return true;
        }

        return false;
    }

    onMouseMove(event: MouseEvent, vp: ViewPort): MouseMoveResult {
        return UNHANDLED;
    }

    onMouseUp(event: MouseEvent, vp: ViewPort): boolean {
        const wc = vp.toWorldCoord({x: event.offsetX, y: event.offsetY});
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

    offerInteraction(interaction: Interaction): boolean {
        switch (interaction.type) {
            case InteractionType.INSERT:
                return true;
            case InteractionType.CONTINUING_PIPE:
            case InteractionType.STARTING_PIPE:
            default:
                return false;
        }
    }

    rememberToRegister(): void {
        //
    }

    shape(): Flatten.Segment | null {
        if (this.lastDrawnLine) {
            if (this.lastDrawnLine instanceof Flatten.Point) {
                const w = this.toWorldCoord(this.lastDrawnLine);
                return Flatten.point([w.x, w.y]);
            } else {
                const aw = this.toWorldCoord(this.lastDrawnLine.ps);
                const bw = this.toWorldCoord(this.lastDrawnLine.pe);

                return Flatten.segment(Flatten.point(aw.x, aw.y), Flatten.point(bw.x, bw.y));
            }
        }
        // We will let the connected components handle that, because we don't know what our bounding box really is.
        return null;
    }

    protected refreshObjectInternal(obj: PipeEntity): void {
        // asdf
    }
}

DrawableObjectFactory.registerEntity(EntityType.PIPE, Pipe);
