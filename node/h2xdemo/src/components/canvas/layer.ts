import {ViewPort} from '@/Drawings/2DViewport';
import {DocumentState} from '@/store/document/types';

export interface MouseHandler {

}

export default interface Layer {
    draw: (ctx: CanvasRenderingContext2D, vp: ViewPort, active: boolean) => any;
    update: (doc: DocumentState) => any;
    drawSelectionLayer: (ctx: CanvasRenderingContext2D, vp: ViewPort) => any;

    onMouseMove: (event: MouseEvent, vp: ViewPort) => boolean;
    onMouseDown: (event: MouseEvent, vp: ViewPort) => boolean;
    onMouseUp: (event: MouseEvent, vp: ViewPort) => boolean;
}
