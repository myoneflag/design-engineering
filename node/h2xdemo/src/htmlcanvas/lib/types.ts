import {ViewPort} from '@/htmlcanvas/viewport';
import {DocumentState, DrawableEntity} from '@/store/document/types';
import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import PopupEntity from '@/store/document/entities/calculations/popup-entity';
import Popup from '@/htmlcanvas/objects/popup';
import {ValveType} from '@/store/document/entities/directed-valves/valve-types';

export interface DrawingContext {
    ctx: CanvasRenderingContext2D;
    vp: ViewPort;
    doc: DocumentState;
}

export class ObjectStore extends Map<string, BaseBackedObject> {}

// tslint:disable-next-line:max-classes-per-file
export class MessageStore extends Map<string, Popup> {}

export interface SelectionTarget {
    uid: string | null;
    property?: string;
    message?: string;
    variant?: string;
    title?: string;
    recenter?: boolean;
}

export interface ValveId {
    type: ValveType;
    name: string;
    catalogId: string;
}
