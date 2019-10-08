import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import ValveEntity, {fillValveDefaultFields} from '@/store/document/entities/valve-entity';
import * as TM from 'transformation-matrix';
import {Matrix} from 'transformation-matrix';
import {ViewPort} from '@/htmlcanvas/viewport';
import {MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';
import {Coord, DocumentState, DrawableEntity, Rectangle} from '@/store/document/types';
import {matrixScale} from '@/htmlcanvas/utils';
import * as _ from 'lodash';
import Flatten from '@flatten-js/core';
import Connectable, {ConnectableObject} from '@/htmlcanvas/lib/object-traits/connectable';
import {lighten} from '@/lib/utils';
import CenterDraggableObject from '@/htmlcanvas/lib/object-traits/center-draggable-object';
import {Interaction, InteractionType} from '@/htmlcanvas/lib/interaction';
import {DrawingContext} from '@/htmlcanvas/lib/types';
import DrawableObjectFactory from '@/htmlcanvas/lib/drawable-object-factory';
import {EntityType} from '@/store/document/entities/types';
import Pipe from '@/htmlcanvas/objects/pipe';
import BackedConnectable from '@/htmlcanvas/lib/BackedConnectable';
import {isConnectable} from '@/store/document';
import {Catalog, ValveSize, ValveSpec} from '@/store/catalog/types';
import {lowerBoundTable} from '@/htmlcanvas/lib/utils';

@CenterDraggableObject
@ConnectableObject
export default class Valve extends BackedConnectable<ValveEntity> implements Connectable {
    static register(): void {
        DrawableObjectFactory.registerEntity(EntityType.VALVE, Valve);
    }

    minimumConnections = 1;

    lastDrawnWidth: number = 0;
    pixelRadius: number = 5;
    lastDrawnLength: number = 0;

    TURN_RADIUS_MM = 100;
    FITTING_DIAMETER_PIXELS = 6;
    lastRadials: Array<[Coord, BaseBackedObject]> = [];

    get position(): Matrix {
        return TM.translate(this.entity.center.x, this.entity.center.y);
    }

    // @ts-ignore sadly, typescript lacks annotation type modification so we must put this function here manually to
    // complete the type.
    getRadials(exclude?: string | null): Array<[Coord, BaseBackedObject]> { /* */
    }

    drawInternal({ctx, doc}: DrawingContext, layerActive: boolean, selected: boolean): void {

        // asdf
        const scale = matrixScale(ctx.getTransform());

        const screenSize = this.pixelRadius / scale;

        if (this.entity.connections.length === 2) {
            // TODO: draw an angled arc.
        } // else {

        ctx.lineCap = 'round';

        const minJointLength = this.FITTING_DIAMETER_PIXELS / scale;

        const width = Math.max(this.FITTING_DIAMETER_PIXELS / scale, 30 / this.toWorldLength(1));
        this.lastDrawnWidth = width;
        this.lastDrawnLength = Math.max(minJointLength, this.toObjectLength(this.TURN_RADIUS_MM));

        this.lastRadials = this.getRadials();
        this.lastRadials.forEach(([wc]) => {
            const oc = this.toObjectCoord(wc);
            const vec = new Flatten.Vector(Flatten.point(0, 0), Flatten.point(oc.x, oc.y));
            const small = vec.normalize().multiply(Math.max(minJointLength, this.toObjectLength(this.TURN_RADIUS_MM)));
            if (layerActive && selected) {
                ctx.beginPath();
                ctx.lineWidth = width + this.FITTING_DIAMETER_PIXELS * 2 / scale;
                this.lastDrawnWidth = width + this.FITTING_DIAMETER_PIXELS * 2 / scale;
                ctx.strokeStyle = lighten(this.displayEntity(doc).color!.hex, 50, 0.5);
                ctx.moveTo(0, 0);
                ctx.lineTo(small.x, small.y);
                ctx.stroke();
            }

            ctx.strokeStyle = this.displayEntity(doc).color!.hex;
            ctx.lineWidth = width;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(small.x, small.y);
            ctx.stroke();
        });
    }

    displayEntity(context: DocumentState) {
        return fillValveDefaultFields(context, this.entity);
    }

    inBounds(moc: Coord): boolean {
        let selected = false;
        this.lastRadials.forEach(([wc]) => {
            const oc = this.toObjectCoord(wc);
            const vec = new Flatten.Vector(Flatten.point(0, 0), Flatten.point(oc.x, oc.y));
            const small = vec.normalize().multiply(this.lastDrawnLength);

            if (Flatten.segment(Flatten.point(0, 0), Flatten.point(small.x, small.y))
                .distanceTo(Flatten.point(moc.x, moc.y))[0] <= this.lastDrawnWidth) {
                selected = true;
            }
        });
        return selected;
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


    offerInteraction(interaction: Interaction): DrawableEntity[] | null {
        switch (interaction.type) {
            case InteractionType.INSERT:
                if (isConnectable(interaction.entityType)) {
                    return [this.entity];
                }
                return null;
            case InteractionType.CONTINUING_PIPE:
            case InteractionType.STARTING_PIPE:
                return [this.entity];
            default:
                return null;
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
