import {ViewPort} from '@/htmlcanvas/viewport';
import {DocumentState} from '@/store/document/types';
import {MouseMoveResult} from '@/htmlcanvas/types';

export default interface Layer {
    draw: (ctx: CanvasRenderingContext2D, vp: ViewPort, ...args: any[]) => any;
    update: (doc: DocumentState) => any;
    drawSelectionLayer: (ctx: CanvasRenderingContext2D, vp: ViewPort) => any;

    onMouseMove: (event: MouseEvent, vp: ViewPort) => MouseMoveResult;
    onMouseDown: (event: MouseEvent, vp: ViewPort) => boolean;
    onMouseUp: (event: MouseEvent, vp: ViewPort) => boolean;
}
