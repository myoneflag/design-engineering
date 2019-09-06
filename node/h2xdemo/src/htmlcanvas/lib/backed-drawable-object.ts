import DrawableObject from '@/htmlcanvas/lib/drawable-object';
import {DocumentState, WithID} from '@/store/document/types';

export default abstract class BackedDrawableObject<T extends WithID> extends DrawableObject {
    stateObject: T;

    constructor(context: DocumentState, parent: DrawableObject | null, obj: T) {
        super(parent);
        this.stateObject = obj;
        this.refreshObjectInternal(context, obj);
    }

    refreshObject(context: DocumentState, parent: DrawableObject | null, obj: T) {
        this.stateObject = obj;
        this.parent = parent;
        this.refreshObjectInternal(context, obj);
    }

    protected abstract refreshObjectInternal(context: DocumentState, obj: T): void;

    get uid() {
        return this.stateObject.uid;
    }
}
