import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import FlowSourceEntity from '@/store/document/entities/flow-source';
import {Matrix} from 'transformation-matrix';
import * as TM from 'transformation-matrix';
import {Color, DocumentState, FlowSystemParameters} from '@/store/document/types';
import DrawableObject from '@/htmlcanvas/lib/drawable-object';
import assert from 'assert';

export default class FlowSource extends BackedDrawableObject<FlowSourceEntity> {

    private system!: FlowSystemParameters;

    drawInternal(ctx: CanvasRenderingContext2D, ...args: any[]): void {
        ctx.fillStyle = this.color.hex;

        ctx.beginPath();
        ctx.arc(this.stateObject.center.x, this.stateObject.center.y, Math.max(this.stateObject.radiusMM, 500), 0, Math.PI * 2);
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
