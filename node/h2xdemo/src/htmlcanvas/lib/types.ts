import {ViewPort} from '@/htmlcanvas/viewport';
import {DocumentState, DrawableEntity} from '@/store/document/types';
import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';

export interface DrawingContext {
    ctx: CanvasRenderingContext2D;
    vp: ViewPort;
    doc: DocumentState;
}

export class ObjectStore extends Map<string, BaseBackedObject> {}
