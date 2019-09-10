import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import ValveEntity, {fillValveDefaultFields} from '@/store/document/entities/valveEntity';
import {Matrix} from 'transformation-matrix';
import {ViewPort} from '@/htmlcanvas/viewport';
import {MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';
import * as TM from 'transformation-matrix';
import {ConnectableEntity, Coord, DocumentState, DrawableEntity, WithID} from '@/store/document/types';
import DrawableObject from '@/htmlcanvas/lib/drawable-object';
import {matrixScale} from '@/htmlcanvas/utils';
import DraggableObject from '@/htmlcanvas/lib/draggable-object';
import * as _ from 'lodash';
import Pipe from '@/htmlcanvas/objects/pipe';
import {ENTITY_NAMES} from '@/store/document/entities';
import PipeEntity from '@/store/document/entities/pipeEntity';
import Flatten from '@flatten-js/core';
import assert from 'assert';
import Connectable, {getRadials} from '@/htmlcanvas/lib/connectable';
import {lighten} from '@/lib/utils';

export default class Valve extends DraggableObject<ValveEntity> implements Connectable {

    onChange: (flowSource: Valve) => void;
    onCommit: (flowSource: Valve) => void;
    onSelect: (object: Valve) => void;

    lastDrawnRadius: number = 0;
    pixelRadius: number = 5;

    TURN_RADIUS_MM = 100;
    FITTING_DIAMETER_PIXELS = 6;

    constructor(
        context: DocumentState,
        objectStore: Map<string, DrawableObject>,
        parent: DrawableObject | null,
        obj: ValveEntity,
        onSelect: (object: Valve) => void,
        onChange: (flowSource: Valve) => void,
        onCommit: (flowSource: Valve) => void,
    ) {
        super(context, objectStore, parent, obj);
        this.onChange = onChange;
        this.onCommit = onCommit;
        this.onSelect = onSelect;
    }
    get position(): Matrix {
        return TM.translate(this.stateObject.center.x, this.stateObject.center.y);
    }

    drawInternal(ctx: CanvasRenderingContext2D, vp: ViewPort, layerActive: boolean, selected: boolean): void {
        // asdf
        const scale = matrixScale(ctx.getTransform());

        const screenSize = this.pixelRadius / scale;

        if (this.stateObject.connections.length === 2) {
            // TODO: draw an angled arc.
        } // else {

        ctx.lineCap = 'round';

        const minJointLength = this.FITTING_DIAMETER_PIXELS / scale;

        this.radials().forEach(([wc]) => {
            const oc = this.toObjectCoord(wc);
            const vec = new Flatten.Vector(Flatten.point(0, 0), Flatten.point(oc.x, oc.y));
            const small = vec.normalize().multiply(Math.max(minJointLength, this.toObjectLength(this.TURN_RADIUS_MM )));
            if (layerActive && selected) {
                ctx.beginPath();
                ctx.lineWidth = this.FITTING_DIAMETER_PIXELS * 3 / scale;
                ctx.strokeStyle = lighten(this.displayEntity.color!.hex, 50, 0.5);
                ctx.moveTo(0, 0);
                ctx.lineTo(small.x, small.y);
                ctx.stroke();
            }

            ctx.strokeStyle = this.displayEntity.color!.hex;
            ctx.lineWidth = this.FITTING_DIAMETER_PIXELS / scale;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(small.x, small.y);
            ctx.stroke();
        });
        // }

        // Draw a slightly thick line towards every point.
        this.lastDrawnRadius = screenSize * 2;
    }

    get displayEntity() {
        return fillValveDefaultFields(this.context, this.stateObject);
    }

    inBounds(oc: Coord): boolean {
        return Math.sqrt(oc.x ** 2 + oc.y ** 2) < this.lastDrawnRadius;
    }

    get friendlyTypeName(): string {
        if (this.stateObject.valveType === 'fitting') {
            if (this.stateObject.connections.length === 4) {
                return 'Cross fitting';
            } else if (this.stateObject.connections.length === 3) {
                return 'Tee fitting';
            } else if (this.stateObject.connections.length === 2) {
                return 'Elbow/Coupling fitting';
            } else if (this.stateObject.connections.length === 1) {
                return 'Deadleg';
            } else {
                return this.stateObject.connections.length + '-way fitting';
            }
        } else {
            return 'Valve';
        }
    }

    radials(exclude: string | null = null): Array<[Coord, BackedDrawableObject<DrawableEntity>]> {
        return getRadials(this, exclude);
    }


    onMouseDown(event: MouseEvent, vp: ViewPort): boolean {
        if (super.onMouseDown(event, vp)) {
            // We want to select too while moving
            // return true;
        }
        const wc = vp.toWorldCoord({x: event.offsetX, y: event.offsetY});
        const oc = this.toObjectCoord(wc);

        // Check bounds
        if (this.inBounds(oc)) {
            this.onSelect(this);

            return true;
        }

        return false;
    }

    onMouseMove(event: MouseEvent, vp: ViewPort): MouseMoveResult {
        const res = super.onMouseMove(event, vp);
        if (res.handled) {
            return res;
        }
        return UNHANDLED;
    }

    onMouseUp(event: MouseEvent, vp: ViewPort): boolean {
        if (super.onMouseUp(event, vp)) {
            return true;
        }

        const wc = vp.toWorldCoord({x: event.offsetX, y: event.offsetY});
        const oc = this.toObjectCoord(wc);
        // Check bounds
        return this.inBounds(oc);
    }

    onDrag(grabbedObjectCoord: Coord, eventObjectCoord: Coord, grabState: any): void {
        this.stateObject.center.x -= grabbedObjectCoord.x - eventObjectCoord.x;
        this.stateObject.center.y -= grabbedObjectCoord.y - eventObjectCoord.y;
        this.onChange(this);
    }

    onDragFinish(): void {
        this.onCommit(this);
    }

    onDragStart(objectCoord: Coord): any {
        return null;
    }


    prepareDelete(): Array<BackedDrawableObject<DrawableEntity>> {
        // Delete all connected pipes.
        // don't add 'this' since deleting our connecting pipes will automagically work
        const result: Array<BackedDrawableObject<DrawableEntity>> = [];
        _.clone(this.stateObject.connections).forEach((c) => {
            const o = this.objectStore.get(c);
            if (o instanceof BackedDrawableObject) {
                result.push(...o.prepareDelete());
            } else {
                throw new Error('Non existent connection on valve ' + JSON.stringify(this.stateObject));
            }
        });
        return result;
    }

    protected refreshObjectInternal(obj: ValveEntity): void {
        //
    }
}
