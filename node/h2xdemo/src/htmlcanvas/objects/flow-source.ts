import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import FlowSourceEntity from '@/store/document/entities/flow-source';
import {Matrix} from 'transformation-matrix';
import * as TM from 'transformation-matrix';
import {Color, DocumentState, FlowSystemParameters} from '@/store/document/types';
import DrawableObject from '@/htmlcanvas/lib/drawable-object';
import assert from 'assert';
import {matrixScale} from '@/htmlcanvas/utils';

export default class FlowSource extends BackedDrawableObject<FlowSourceEntity> {

    private system!: FlowSystemParameters;

    drawInternal(ctx: CanvasRenderingContext2D, ...args: any[]): void {
        const mat = ctx.getTransform();
        const scale = matrixScale(mat);
        // Minimum screen size for them.
        const screenSize = this.stateObject.radiusMM * scale;

        if (screenSize < 10) {
            // Flow sources are very important and should be visible, even when zoomed out.

            ctx.fillStyle = this.color.hex;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(this.stateObject.center.x, this.stateObject.center.y, 10 / scale, 0, Math.PI * 2);
            ctx.fill();
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
}
