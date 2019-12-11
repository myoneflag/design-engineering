import {ViewPort} from '../../../src/htmlcanvas/viewport';
import {DocumentState, DrawableEntity} from '../../../src/store/document/types';
import BackedDrawableObject from '../../../src/htmlcanvas/lib/backed-drawable-object';
import BaseBackedObject from '../../../src/htmlcanvas/lib/base-backed-object';
import PopupEntity from '../../../src/store/document/entities/calculations/popup-entity';
import Popup from '../../../src/htmlcanvas/objects/popup';
import {ValveType} from '../../../src/store/document/entities/directed-valves/valve-types';
import {Catalog} from '../../../src/store/catalog/types';

export interface DrawingContext {
    ctx: CanvasRenderingContext2D;
    vp: ViewPort;
    doc: DocumentState;
    catalog: Catalog;
}

export class ObjectStore extends Map<string, BaseBackedObject> {
    delete(key: string): boolean {
        console.log("Delete Called on Object Store with key " + key);
        const err = new Error();
        console.log(err.stack);
        return super.delete(key);
    }

}

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
