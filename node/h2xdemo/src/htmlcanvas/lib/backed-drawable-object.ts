import DrawableObject from '@/htmlcanvas/lib/drawable-object';
import {Coord, DocumentState, DrawableEntity, WithID} from '@/store/document/types';
import * as _ from 'lodash';
import {Interaction} from '@/htmlcanvas/tools/interaction';


export default abstract class BackedDrawableObject<T extends DrawableEntity> extends DrawableObject {
    stateObject: T;
    context: DocumentState;
    objectStore: Map<string, DrawableObject>;

    protected onSelect: () => void;
    protected onChange: () => void;
    protected onCommit: () => void;

    constructor(
        context: DocumentState,
        objectStore: Map<string, DrawableObject>,
        parent: DrawableObject | null,
        obj: T,
        onSelect: () => void,
        onChange: () => void,
        onCommit: () => void,
    ) {
        super(parent);
        this.stateObject = obj;
        this.objectStore = objectStore;
        this.context = context;
        this.onSelect = onSelect;
        this.onChange = onChange;
        this.onCommit = onCommit;
        this.refreshObjectInternal(obj);
    }

    refreshObject(parent: DrawableObject | null, obj: T) {
        const old = _.cloneDeep(this.stateObject);
        this.stateObject = obj;
        this.parent = parent;
        this.refreshObjectInternal(obj, old);
    }

    abstract offerInteraction(interaction: Interaction): boolean;

    // Return list of objects to remove.
    abstract prepareDelete(): Array<BackedDrawableObject<DrawableEntity>>;

    abstract inBounds(objectCoord: Coord): boolean;

    protected abstract refreshObjectInternal(obj: T, old?: T): void;

    get uid() {
        return this.stateObject.uid;
    }

    get type() {
        return this.stateObject.type;
    }
}
