import DrawableObject from '@/htmlcanvas/lib/drawable-object';
import {DocumentState, DrawableEntity, WithID} from '@/store/document/types';

export default abstract class BackedDrawableObject<T extends WithID> extends DrawableObject {
    stateObject: T;
    context: DocumentState;
    objectStore: Map<string, DrawableObject>;

    protected constructor(
        context: DocumentState,
        objectStore: Map<string, DrawableObject>,
        parent: DrawableObject | null,
        obj: T,
    ) {
        super(parent);
        this.stateObject = obj;
        this.objectStore = objectStore;
        this.context = context;
        this.refreshObjectInternal(obj);
    }

    refreshObject(parent: DrawableObject | null, obj: T) {
        this.stateObject = obj;
        this.parent = parent;
        this.refreshObjectInternal(obj);
    }

    // Return list of objects to remove.
    abstract prepareDelete(): Array<BackedDrawableObject<DrawableEntity>>;

    protected abstract refreshObjectInternal(obj: T): void;

    get uid() {
        return this.stateObject.uid;
    }
}
