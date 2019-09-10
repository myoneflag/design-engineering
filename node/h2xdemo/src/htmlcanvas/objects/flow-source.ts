import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import FlowSourceEntity from '@/store/document/entities/flow-source-entity';
import {Matrix} from 'transformation-matrix';
import * as TM from 'transformation-matrix';
import {Coord, DocumentState, DrawableEntity, FlowSystemParameters} from '@/store/document/types';
import DrawableObject from '@/htmlcanvas/lib/drawable-object';
import assert from 'assert';
import {matrixScale} from '@/htmlcanvas/utils';
import {lighten} from '@/lib/utils';
import {ViewPort} from '@/htmlcanvas/viewport';
import {MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';
import DraggableObject from '@/htmlcanvas/lib/draggable-object';
import Connectable, {getRadials} from '@/htmlcanvas/lib/connectable';

export default class FlowSource extends DraggableObject<FlowSourceEntity> implements Connectable {

    MINIMUM_RADIUS_PX: number = 3;
    onSelect: (object: FlowSource) => void;
    lastDrawnWorldRadius: number = 0; // for bounds detection


    onChange: (flowSource: FlowSource) => void;
    onCommit: (flowSource: FlowSource) => void;

    private systems: FlowSystemParameters[];

    constructor(
        context: DocumentState,
        objectStore: Map<string, DrawableObject>,
        parent: DrawableObject | null,
        obj: FlowSourceEntity,
        onSelect: (object: FlowSource) => void,
        onChange: (flowSource: FlowSource) => void,
        onCommit: (flowSource: FlowSource) => void,
    ) {
        super(context, objectStore, parent, obj);
        this.systems = context.drawing.flowSystems;
        this.onChange = onChange;
        this.onCommit = onCommit;
        this.onSelect = onSelect;
    }

    drawInternal(ctx: CanvasRenderingContext2D, vp: ViewPort, layerActive: boolean, selected: boolean): void {
        this.lastDrawnWorldRadius = 0;

        const mat = ctx.getTransform();
        const scale = matrixScale(mat);
        // Minimum screen size for them.
        const screenSize = vp.toScreenLength(this.stateObject.diameterMM / 2);

        ctx.lineWidth = 0;

        if (selected) {
            // we want to draw a pixel sized dark halo around a selected component
            const haloSize = (Math.max(this.MINIMUM_RADIUS_PX, screenSize) + 5) / scale;

            ctx.fillStyle = lighten(this.color.hex, -90, 1);

            ctx.beginPath();
            ctx.lineWidth = 0;
            ctx.globalAlpha = 1;
            ctx.arc(0, 0, haloSize, 0, Math.PI * 2);
            ctx.fill();

            this.lastDrawnWorldRadius = Math.max(this.lastDrawnWorldRadius, haloSize);
        }

        if (layerActive) {
            if (screenSize < this.MINIMUM_RADIUS_PX) {
                // Flow sources are very important and should be visible, even when zoomed out.

                ctx.fillStyle = this.color.hex;
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.arc(
                    0,
                    0,
                    this.MINIMUM_RADIUS_PX / scale,
                    0,
                    Math.PI * 2,
                );
                ctx.fill();

                this.lastDrawnWorldRadius = Math.max(this.lastDrawnWorldRadius, this.MINIMUM_RADIUS_PX / scale);
            }
        }

        ctx.fillStyle = this.color.hex;

        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(
            0,
            0,
            this.toObjectLength(this.stateObject.diameterMM / 2),
            0,
            Math.PI * 2,
        );
        this.lastDrawnWorldRadius = Math.max(
            this.lastDrawnWorldRadius,
            this.toObjectLength(this.stateObject.diameterMM / 2),
        );
        ctx.fill();

    }

    radials(exclude: string | null = null): Array<[Coord, BackedDrawableObject<DrawableEntity>]> {
        return getRadials(this, exclude);
    }

    get position(): Matrix {
        return TM.transform(
            TM.translate(this.stateObject.center.x, this.stateObject.center.y),
        );
    }

    get color() {
        return this.stateObject.color == null ? this.system.color : this.stateObject.color;
    }

    get system(): FlowSystemParameters {
        const result = this.systems.find((v) => v.uid === this.stateObject.systemUid);
        if (result) {
            return result;
        } else {
            throw new Error('Flow system not found for flow source ' + JSON.stringify(this.stateObject));
        }
    }

    refreshObjectInternal(obj: FlowSourceEntity): void {
        const system = this.context.drawing.flowSystems.find((v) => v.uid === obj.systemUid);
        assert(system !== undefined);
    }

    inBounds(objectCoord: Coord) {
        const dist = Math.sqrt(
            (objectCoord.x) ** 2
            + (objectCoord.y) ** 2,
        );
        return dist <= this.lastDrawnWorldRadius;
    }

    onDragStart(objectCoord: Coord) {
        return null;
    }

    onDrag(grabbedObjectCoord: Coord, eventObjectCoord: Coord, grabState: any) {
        this.stateObject.center.x -= grabbedObjectCoord.x - eventObjectCoord.x;
        this.stateObject.center.y -= grabbedObjectCoord.y - eventObjectCoord.y;
        this.onChange(this);
    }

    onDragFinish() {
        this.onCommit(this);
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

    prepareDelete(): Array<BackedDrawableObject<DrawableEntity>> {
        return [this];
    }
}
