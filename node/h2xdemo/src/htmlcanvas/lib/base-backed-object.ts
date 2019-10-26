import DrawableObject from '@/htmlcanvas/lib/drawable-object';
import {Coord, DrawableEntity} from '@/store/document/types';
import {ObjectStore} from '@/htmlcanvas/lib/types';
import * as _ from 'lodash';
import {Interaction} from '@/htmlcanvas/lib/interaction';
import {EntityType} from '@/store/document/entities/types';
import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import {DrawableEntityConcrete} from '@/store/document/entities/concrete-entity';
import Layer from '@/htmlcanvas/layers/layer';
import {cloneSimple} from '@/lib/utils';
import CanvasContext from '@/htmlcanvas/lib/canvas-context';

export default abstract class BaseBackedObject extends DrawableObject {
    entity: DrawableEntityConcrete;
    parentEntity: DrawableEntity | null;
    objectStore: ObjectStore;

    protected onSelect: (event: MouseEvent | KeyboardEvent) => void;
    protected onChange: () => void;
    protected onCommit: (event: MouseEvent | KeyboardEvent) => void;

    protected constructor(
        objectStore: ObjectStore,
        layer: Layer,
        parentEntity: DrawableEntity | null,
        obj: DrawableEntityConcrete,
        onSelect: (event: MouseEvent | KeyboardEvent) => void,
        onChange: () => void,
        onCommit: (event: MouseEvent | KeyboardEvent) => void,
    ) {
        super(null, layer);
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

    refreshObject(parentEntity: DrawableEntity | null, obj: DrawableEntityConcrete) {
        const old = this.entity;
        this.entity = obj;
        this.parentEntity = parentEntity;
        this.refreshObjectInternal(obj, old);
    }

    abstract offerInteraction(interaction: Interaction): DrawableEntityConcrete[] | null;

    // Return list of objects to remove.
    abstract prepareDelete(context: CanvasContext): BaseBackedObject[];

    abstract inBounds(objectCoord: Coord, objectRadius?: number): boolean;

    protected abstract refreshObjectInternal(obj: DrawableEntity, old?: DrawableEntity): void;

    get uid() {
        return this.entity.uid;
    }

    get type(): EntityType {
        return this.entity.type;
    }
}
