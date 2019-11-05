import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import ValveEntity, {fillValveDefaultFields} from '@/store/document/entities/valve-entity';
import * as TM from 'transformation-matrix';
import {Matrix} from 'transformation-matrix';
import {Coord, DocumentState} from '@/store/document/types';
import {matrixScale} from '@/htmlcanvas/utils';
import Flatten from '@flatten-js/core';
import Connectable, {ConnectableObject} from '@/htmlcanvas/lib/object-traits/connectable';
import {lighten} from '@/lib/utils';
import CenterDraggableObject from '@/htmlcanvas/lib/object-traits/center-draggable-object';
import {DrawingContext} from '@/htmlcanvas/lib/types';
import DrawableObjectFactory from '@/htmlcanvas/lib/drawable-object-factory';
import {EntityType} from '@/store/document/entities/types';
import BackedConnectable from '@/htmlcanvas/lib/BackedConnectable';
import {getDragPriority} from '@/store/document';
import {Catalog, ValveSize} from '@/store/catalog/types';
import {lowerBoundTable} from '@/htmlcanvas/lib/utils';
import Pipe from '@/htmlcanvas/objects/pipe';
import {SelectableObject} from '@/htmlcanvas/lib/object-traits/selectable';
import PipeEntity from '@/store/document/entities/pipe-entity';
import uuid from 'uuid';
import CanvasContext from '@/htmlcanvas/lib/canvas-context';
import {ConnectableEntityConcrete} from '@/store/document/entities/concrete-entity';
import {CenteredObject} from '@/htmlcanvas/lib/object-traits/centered-object';

@SelectableObject
@CenterDraggableObject
@ConnectableObject
@CenteredObject
export default class Valve extends BackedConnectable<ValveEntity> implements Connectable {
    static register(): void {
        DrawableObjectFactory.registerEntity(EntityType.VALVE, Valve);
    }

    minimumConnections = 1;
    maximumConnections = null;
    dragPriority = getDragPriority(EntityType.VALVE);

    lastDrawnWidth!: number;
    pixelRadius: number = 5;
    lastDrawnLength!: number;

    TURN_RADIUS_MM = 100;
    FITTING_DIAMETER_PIXELS = 3;
    lastRadials!: Array<[Coord, BaseBackedObject]>;

    get position(): Matrix {
        return TM.translate(this.entity.center.x, this.entity.center.y);
    }

    debase(): void {
        throw new Error('Method not implemented.');
    }

    rebase(context: CanvasContext): void {
        throw new Error('Method not implemented.');
    }

    // @ts-ignore sadly, typescript lacks annotation type modification so we must put this function here manually to
    // complete the type.
    getRadials(exclude?: string | null): Array<[Coord, BaseBackedObject]> { /* */
    }


    drawInternal({ctx, doc}: DrawingContext, layerActive: boolean, selected: boolean): void {

        // asdf
        const scale = matrixScale(ctx.getTransform());

        if (this.entity.connections.length === 2) {
            // TODO: draw an angled arc.
        } // else {

        ctx.lineCap = 'round';

        const minJointLength = this.FITTING_DIAMETER_PIXELS / scale;

        const defaultWidth = Math.max(this.FITTING_DIAMETER_PIXELS / scale, 25 / this.toWorldLength(1));
        this.lastDrawnWidth = defaultWidth;
        this.lastDrawnLength = Math.max(minJointLength, this.toObjectLength(this.TURN_RADIUS_MM));

        this.lastRadials = this.getRadials();
        this.lastRadials.forEach(([wc, pipe]) => {
            let targetWidth = defaultWidth;
            if (pipe.entity.type === EntityType.PIPE) {

                if ((pipe as Pipe).lastDrawnWidth) {
                    targetWidth =
                        Math.max(defaultWidth, (pipe as Pipe).lastDrawnWidth + this.FITTING_DIAMETER_PIXELS / scale);
                }
            }
            const oc = this.toObjectCoord(wc);
            const vec = new Flatten.Vector(Flatten.point(0, 0), Flatten.point(oc.x, oc.y));
            const small = vec.normalize().multiply(Math.max(minJointLength, this.toObjectLength(this.TURN_RADIUS_MM)));
            if (layerActive && selected) {
                ctx.beginPath();
                ctx.lineWidth = targetWidth + this.FITTING_DIAMETER_PIXELS * 2 / scale;

                this.lastDrawnWidth = defaultWidth + this.FITTING_DIAMETER_PIXELS * 2 / scale;
                ctx.strokeStyle = lighten(this.displayEntity(doc).color!.hex, 50, 0.5);
                ctx.moveTo(0, 0);
                ctx.lineTo(small.x, small.y);
                ctx.stroke();
            }

            ctx.strokeStyle = this.displayEntity(doc).color!.hex;
            ctx.lineWidth = targetWidth;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(small.x, small.y);
            ctx.stroke();
        });
    }

    displayEntity(context: DocumentState) {
        return fillValveDefaultFields(context, this.entity);
    }

    inBounds(moc: Coord, radius: number = 0): boolean {
        if (this.lastRadials && this.lastDrawnLength !== undefined && this.lastDrawnWidth !== undefined) {
            let selected = false;
            this.lastRadials.forEach(([wc]) => {
                const oc = this.toObjectCoord(wc);
                const vec = new Flatten.Vector(Flatten.point(0, 0), Flatten.point(oc.x, oc.y));
                const small = vec.normalize().multiply(this.lastDrawnLength);

                if (Flatten.segment(Flatten.point(0, 0), Flatten.point(small.x, small.y))
                    .distanceTo(Flatten.point(moc.x, moc.y))[0] <= this.lastDrawnWidth + radius) {
                    selected = true;
                }
            });
            return selected;
        } else {
            const l = this.toObjectLength(this.TURN_RADIUS_MM * 1.5);
            return moc.x * moc.x + moc.y * moc.y <= (l + radius) * (l + radius);
        }
    }

    get friendlyTypeName(): string {
        if (this.entity.valveType === 'fitting') {
            if (this.entity.connections.length === 4) {
                return 'Cross fitting';
            } else if (this.entity.connections.length === 3) {
                return 'Tee fitting';
            } else if (this.entity.connections.length === 2) {
                return 'Elbow/Coupling fitting';
            } else if (this.entity.connections.length === 1) {
                return 'Deadleg';
            } else {
                return this.entity.connections.length + '-way fitting';
            }
        } else {
            return 'Valve';
        }
    }

    prepareDelete(): BaseBackedObject[] {
        return []; // this was handled by @Connectable
    }

    rememberToRegister(): void {
        //
    }

    getCatalogPage(catalog: Catalog, diameter: number): ValveSize | null {
        const valve = catalog.valves[this.entity.valveType];
        if (!valve) {
            return null;
        }
        const page = lowerBoundTable(valve.valvesBySize, diameter);
        if (!page) {
            return null;
        }
        return page;
    }

    protected refreshObjectInternal(obj: ValveEntity): void {
        //
    }
}

DrawableObjectFactory.registerEntity(EntityType.VALVE, Valve);
