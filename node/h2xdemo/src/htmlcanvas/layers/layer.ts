import {ViewPort} from '@/htmlcanvas/viewport';
import {DocumentState, WithID} from '@/store/document/types';
import {MouseMoveResult} from '@/htmlcanvas/types';
import DrawableObject from '@/htmlcanvas/lib/drawable-object';

export default interface Layer {
    selectedEntity: WithID | null;
    selectedObject: DrawableObject | null;

    draw: (ctx: CanvasRenderingContext2D, vp: ViewPort, ...args: any[]) => any;
    update: (doc: DocumentState) => any;
    drawSelectionLayer: (ctx: CanvasRenderingContext2D, vp: ViewPort) => any;

    onMouseMove: (event: MouseEvent, vp: ViewPort) => MouseMoveResult;
    onMouseDown: (event: MouseEvent, vp: ViewPort) => boolean;
    onMouseUp: (event: MouseEvent, vp: ViewPort) => boolean;
}
