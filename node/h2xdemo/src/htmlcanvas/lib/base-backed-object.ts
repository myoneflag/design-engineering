import DrawableObject from '@/htmlcanvas/lib/drawable-object';
import {Coord, DrawableEntity} from '@/store/document/types';
import {ObjectStore} from '@/htmlcanvas/lib/types';
import * as _ from 'lodash';
import {Interaction} from '@/htmlcanvas/lib/interaction';
import {EntityType} from '@/store/document/entities/types';
import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';

export default abstract class BaseBackedObject extends DrawableObject {
    entity: DrawableEntity;
    parentEntity: DrawableEntity | null;
    objectStore: ObjectStore;

    protected onSelect: () => void;
    protected onChange: () => void;
    protected onCommit: () => void;

    protected constructor(
        objectStore: ObjectStore,
        parentEntity: DrawableEntity | null,
        obj: DrawableEntity,
        onSelect: () => void,
        onChange: () => void,
        onCommit: () => void,
    ) {
        super(null);
        this.parentEntity = parentEntity;
        this.entity = obj;
        this.onSelect = onSelect;
        this.onChange = onChange;
        this.onCommit = onCommit;
        this.objectStore = objectStore;
        this.refreshObjectInternal(obj);
    }

    get parent() {
        if (this.parentEntity === null) {
            return null;
        } else {
            const result = this.objectStore.get(this.parentEntity.uid);
            if (result) {
                return result;
            }
            throw new Error('Parent object not created while ');
        }
    }

    set parent(par: BaseBackedObject | null) {
        if (par) {
            this.parentEntity = par.parentEntity;
        } else {
            this.parentEntity = null;
        }
    }

    refreshObject(parentEntity: DrawableEntity | null, obj: DrawableEntity) {
        const old = _.cloneDeep(this.entity);
        this.entity = obj;
        this.parentEntity = parentEntity;
        this.refreshObjectInternal(obj, old);
    }

    abstract offerInteraction(interaction: Interaction): DrawableEntity[] | null;

    // Return list of objects to remove.
    abstract prepareDelete(): BaseBackedObject[];

    abstract inBounds(objectCoord: Coord, objectRadius?: number): boolean;

    protected abstract refreshObjectInternal(obj: DrawableEntity, old?: DrawableEntity): void;

    get uid() {
        return this.entity.uid;
    }

    get type(): EntityType {
        return this.entity.type;
    }
}
