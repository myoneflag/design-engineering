import {ViewPort} from '@/htmlcanvas/viewport';
import {DocumentState, DrawableEntity} from '@/store/document/types';
import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import PopupEntity from '@/store/document/entities/calculations/popup-entity';
import Popup from '@/htmlcanvas/objects/popup';

export interface DrawingContext {
    ctx: CanvasRenderingContext2D;
    vp: ViewPort;
    doc: DocumentState;
}

export class ObjectStore extends Map<string, BaseBackedObject> {}

// tslint:disable-next-line:max-classes-per-file
export class MessageStore extends Map<string, Popup> {}
