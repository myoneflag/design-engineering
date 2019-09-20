import BackedDrawableObject, {BaseBackedObject} from '@/htmlcanvas/lib/backed-drawable-object';
import ValveEntity, {fillValveDefaultFields} from '@/store/document/entities/valve-entity';
import * as TM from 'transformation-matrix';
import {Matrix} from 'transformation-matrix';
import {ViewPort} from '@/htmlcanvas/viewport';
import {MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';
import {Coord, DocumentState, DrawableEntity} from '@/store/document/types';
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

@CenterDraggableObject
@ConnectableObject
export default class Valve extends BackedDrawableObject<ValveEntity> implements Connectable {
    static register(): void {
        DrawableObjectFactory.registerEntity(EntityType.VALVE, Valve);
    }


    lastDrawnRadius: number = 0;
    pixelRadius: number = 5;

    TURN_RADIUS_MM = 100;
    FITTING_DIAMETER_PIXELS = 6;

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

        this.getRadials().forEach(([wc]) => {
            const oc = this.toObjectCoord(wc);
            const vec = new Flatten.Vector(Flatten.point(0, 0), Flatten.point(oc.x, oc.y));
            const small = vec.normalize().multiply(Math.max(minJointLength, this.toObjectLength(this.TURN_RADIUS_MM)));
            if (layerActive && selected) {
                ctx.beginPath();
                ctx.lineWidth = this.FITTING_DIAMETER_PIXELS * 3 / scale;
                ctx.strokeStyle = lighten(this.displayEntity(doc).color!.hex, 50, 0.5);
                ctx.moveTo(0, 0);
                ctx.lineTo(small.x, small.y);
                ctx.stroke();
            }

            ctx.strokeStyle = this.displayEntity(doc).color!.hex;
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

    displayEntity(context: DocumentState) {
        return fillValveDefaultFields(context, this.entity);
    }

    inBounds(oc: Coord): boolean {
        return Math.sqrt(oc.x ** 2 + oc.y ** 2) < this.lastDrawnRadius;
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


    offerInteraction(interaction: Interaction): boolean {
        switch (interaction.type) {
            case InteractionType.INSERT:
                return false;
            case InteractionType.CONTINUING_PIPE:
            case InteractionType.STARTING_PIPE:
                return true;
            default:
                return false;
        }
    }

    prepareDelete(): BaseBackedObject[] {
        return []; // this was handled by @Connectable
    }

    rememberToRegister(): void {
        //
    }

    protected refreshObjectInternal(obj: ValveEntity): void {
        //
    }
}

DrawableObjectFactory.registerEntity(EntityType.VALVE, Valve);
