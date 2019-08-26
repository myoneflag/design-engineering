import {ViewPort} from '@/Drawings/2DViewport';
import {DocumentState} from '@/store/document/types';

export interface MouseHandler {

}

export default interface Layer {
    draw: (ctx: CanvasRenderingContext2D, vp: ViewPort, doc: DocumentState) => any;
    update: (doc: DocumentState) => any;
}
