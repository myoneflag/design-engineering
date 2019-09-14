import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import PipeEntity, {fillPipeDefaultFields} from '@/store/document/entities/pipeEntity';
import {Matrix} from 'transformation-matrix';
import {ViewPort} from '@/htmlcanvas/viewport';
import {MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';
import {ConnectableEntity, Coord, DocumentState, DrawableEntity} from '@/store/document/types';
import * as TM from 'transformation-matrix';
import {matrixScale} from '@/htmlcanvas/utils';
import DrawableObject from '@/htmlcanvas/lib/drawable-object';
import Flatten from '@flatten-js/core';
import {Draggable, DraggableObject} from '@/htmlcanvas/lib/object-traits/draggable-object';
import * as _ from 'lodash';
import ValveEntity from '@/store/document/entities/valveEntity';
import assert from 'assert';
import {lighten} from '@/lib/utils';
import {Interaction, InteractionType} from '@/htmlcanvas/tools/interaction';

@DraggableObject
export default class Pipe extends BackedDrawableObject<PipeEntity> implements Draggable {
    lastDrawnLine!: Flatten.Segment | Flatten.Point;
    lastDrawnWidth!: number;

    get position(): Matrix {
        // We don't draw by object location because the object doesn't really have an own location. Instead, its
        // location is determined by other objects.
        return TM.identity();
    }

    drawInternal(ctx: CanvasRenderingContext2D, vp: ViewPort, layerActive: boolean, selected: boolean): void {
        const s = matrixScale(ctx.getTransform());

        // lol what are our coordinates
        const [aw, bw] = this.worldEndpoints();
        const ao = this.toObjectCoord(aw);
        const bo = this.toObjectCoord(bw);

        ctx.lineCap = 'round';
        if (layerActive && selected) {
            ctx.beginPath();
            ctx.lineWidth = 8.0 / s;
            ctx.strokeStyle = lighten(this.displayObject.color!.hex, 0, 0.5);

            ctx.moveTo(ao.x, ao.y);
            ctx.lineTo(bo.x, bo.y);
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.strokeStyle = this.displayObject.color!.hex;
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
            this.context.drawing.entities.find((e) => e.uid === this.stateObject.endpointUid[0]) as ConnectableEntity;
        const b: ConnectableEntity =
            this.context.drawing.entities.find((e) => e.uid === this.stateObject.endpointUid[1]) as ConnectableEntity;

        if (!a || !b) {
            throw new Error('One of pipe\'s endpoints are missing. Pipe is: ' + JSON.stringify(this.stateObject));
        }

        const ao = this.objectStore.get(a.uid) as BackedDrawableObject<DrawableEntity>;
        const bo = this.objectStore.get(b.uid) as BackedDrawableObject<DrawableEntity>;
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
            throw new Error('One of pipe\'s endpoints are missing. Pipe is: ' + JSON.stringify(this.stateObject));
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

    inBounds(oc: Coord): boolean {
        if (!this.lastDrawnLine) {
            return false;
        }
        return this.lastDrawnLine.distanceTo(new Flatten.Point(oc.x, oc.y))[0] < this.lastDrawnWidth;
    }

    get computedLengthM(): number {
        const [wa, wb] = this.worldEndpoints();
        return Math.sqrt((wa.x - wb.x) ** 2 + (wa.y - wb.y) ** 2) / 1000;
    }

    get displayObject(): PipeEntity {
        return fillPipeDefaultFields(this.context, this.computedLengthM, this.stateObject);
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

    prepareDelete(): Array<BackedDrawableObject<DrawableEntity>> {
        const result: Array<BackedDrawableObject<DrawableEntity>> = [this];
        for (let i = 0; i < 2; i++) {
            const a = this.objectStore.get(this.stateObject.endpointUid[i]);
            if (a instanceof BackedDrawableObject) {
                const state = a.stateObject as ValveEntity;
                const toDelete = state.connections.indexOf(this.stateObject.uid);
                assert(toDelete !== -1);
                state.connections.splice(toDelete, 1);
                if (state.connections.length === 0) {
                    result.push(a);
                }
            } else {
                throw new Error('endpoint non existent on pipe ' + JSON.stringify(this.stateObject));
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

    protected refreshObjectInternal(obj: PipeEntity): void {
        // asdf
    }
}
