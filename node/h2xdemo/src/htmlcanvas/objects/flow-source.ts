import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import FlowSourceEntity from '@/store/document/entities/flow-source';
import {Matrix} from 'transformation-matrix';
import * as TM from 'transformation-matrix';
import {Coord, DocumentState, FlowSystemParameters} from '@/store/document/types';
import DrawableObject from '@/htmlcanvas/lib/drawable-object';
import assert from 'assert';
import {matrixScale} from '@/htmlcanvas/utils';
import {lighten} from '@/lib/utils';
import {ViewPort} from '@/htmlcanvas/viewport';
import {MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';
import DraggableObject, {Movable} from '@/htmlcanvas/lib/draggable-object';

export default class FlowSource extends DraggableObject<FlowSourceEntity> {

    MINIMUM_RADIUS_PX: number = 3;
    onSelect: (object: FlowSource) => void;
    lastDrawnWorldRadius: number = 0; // for bounds detection


    onChange: (flowSource: FlowSource) => void;
    onCommit: (flowSource: FlowSource) => void;

    private system!: FlowSystemParameters;

    constructor(
        context: DocumentState, parent: DrawableObject | null,
        obj: FlowSourceEntity,
        onSelect: (object: FlowSource) => void,
        onChange: (flowSource: FlowSource) => void,
        onCommit: (flowSource: FlowSource) => void,
    ) {
        super(context, parent, obj);
        this.onChange = onChange;
        this.onCommit = onCommit;
        this.onSelect = onSelect;
    }



    drawInternal(ctx: CanvasRenderingContext2D, vp: ViewPort, layerActive: boolean, selected: boolean): void {
        const mat = ctx.getTransform();
        const scale = matrixScale(mat);
        // Minimum screen size for them.
        const screenSize = vp.toScreenLength(this.stateObject.radiusMM);
        this.lastDrawnWorldRadius = this.stateObject.radiusMM;

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

            this.lastDrawnWorldRadius = haloSize;
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

                this.lastDrawnWorldRadius = this.MINIMUM_RADIUS_PX / scale;
            }
        }

        ctx.fillStyle = this.color.hex;

        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(
            0,
            0,
            this.toObjectLength(this.stateObject.radiusMM),
            0,
            Math.PI * 2,
        );
        ctx.fill();

    }

    get position(): Matrix {
        return TM.transform(
            TM.translate(this.stateObject.center.x, this.stateObject.center.y),
        );
    }

    get color() {
        return this.stateObject.color == null ? this.system.color : this.stateObject.color;
    }

    refreshObjectInternal(context: DocumentState, obj: FlowSourceEntity): void {
        const system = context.drawing.flowSystems.find((v) => v.uid === obj.systemUid);
        assert(system !== undefined);
        this.system = system!;
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
            // return true;
            // We want to select too while moving
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
}
