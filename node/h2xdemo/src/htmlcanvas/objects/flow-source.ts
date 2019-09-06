import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import FlowSourceEntity from '@/store/document/entities/flow-source';
import {Matrix} from 'transformation-matrix';
import * as TM from 'transformation-matrix';
import {Color, DocumentState, FlowSystemParameters} from '@/store/document/types';
import DrawableObject from '@/htmlcanvas/lib/drawable-object';
import assert from 'assert';
import {matrixScale} from '@/htmlcanvas/utils';
import {lighten, lightenA} from '@/lib/utils';
import {ViewPort} from '@/htmlcanvas/viewport'
import {MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';

export default class FlowSource extends BackedDrawableObject<FlowSourceEntity> {

    private system!: FlowSystemParameters;
    onSelect: (object: FlowSource) => void;

    constructor(context: DocumentState, parent: DrawableObject | null, obj: FlowSourceEntity, onSelect: (object: FlowSource) => void) {
        super(context, parent, obj);
        this.onSelect = onSelect;
    }



    lastDrawnWorldRadius: number = 0; // for bounds detection

    drawInternal(ctx: CanvasRenderingContext2D, layerActive: boolean, selected: boolean): void {
        const mat = ctx.getTransform();
        const scale = matrixScale(mat);
        // Minimum screen size for them.
        const screenSize = this.stateObject.radiusMM * scale;
        this.lastDrawnWorldRadius = this.stateObject.radiusMM * scale;

        ctx.lineWidth = 0;

        if (selected) {
            // we want to draw a pixel sized dark halo around a selected component
            const haloSize = (Math.max(10, screenSize) + 5) / scale;

            ctx.fillStyle = lightenA(this.color.hex, -90, 1);

            ctx.beginPath();
            ctx.lineWidth = 0;
            ctx.globalAlpha = 1;
            ctx.arc(this.stateObject.center.x, this.stateObject.center.y, haloSize, 0, Math.PI * 2);
            ctx.fill();

            this.lastDrawnWorldRadius = haloSize;
        }

        if (layerActive) {
            if (screenSize < 10) {
                // Flow sources are very important and should be visible, even when zoomed out.

                ctx.fillStyle = this.color.hex;
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.arc(this.stateObject.center.x, this.stateObject.center.y, 10 / scale, 0, Math.PI * 2);
                ctx.fill();

                this.lastDrawnWorldRadius = 10 / scale;
            }
        }

        ctx.fillStyle = this.color.hex;

        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(this.stateObject.center.x, this.stateObject.center.y, this.stateObject.radiusMM, 0, Math.PI * 2);
        ctx.fill();

    }

    get position() : Matrix {
        return TM.identity();
    }

    get color() {
        return this.stateObject.color == null ? this.system.color : this.stateObject.color;
    }

    refreshObjectInternal(context: DocumentState, obj: FlowSourceEntity): void {
        const system = context.drawing.flowSystems.find((v) => v.uid === obj.systemUid);
        assert(system !== undefined);
        this.system = system!;
    }


    onMouseDown(event: MouseEvent, vp: ViewPort): boolean {
        const wc = vp.toWorldCoord({x: event.offsetX, y: event.offsetY});
        const oc = this.toObjectCoord(wc);

        // Check bounds
        const dist = Math.sqrt((oc.x - this.stateObject.center.x) ** 2 + (oc.y - this.stateObject.center.y));

        console.log("Mouse down event " + dist + " " + this.lastDrawnWorldRadius);
        if (dist <= this.lastDrawnWorldRadius) {
            this.onSelect(this);

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
        const dist = Math.sqrt((oc.x - this.stateObject.center.x) ** 2 + (oc.y - this.stateObject.center.y) ** 2);

        if (dist <= this.lastDrawnWorldRadius) {

            return true;
        }

        return false;
    }
}
