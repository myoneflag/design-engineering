import {DrawableEntity} from '../../../src/store/document/types';
import {EntityType} from '../../../src/store/document/entities/types';
import {ObjectStore} from '../../../src/htmlcanvas/lib/types';
import BackedDrawableObject, {
    BackedObjectConstructor,
    BaseBackedConstructor,
} from '../../../src/htmlcanvas/lib/backed-drawable-object';
import BaseBackedObject from '../../../src/htmlcanvas/lib/base-backed-object';
import {DrawableEntityConcrete} from '../../../src/store/document/entities/concrete-entity';
import Layer from '../../../src/htmlcanvas/layers/layer';

export default class DrawableObjectFactory {

    static constructors: Map<EntityType, BaseBackedConstructor> =
        new Map<EntityType, BaseBackedConstructor>();

    static registerEntity<Y extends EntityType, T extends DrawableEntityConcrete & {type: Y}>(
        type: Y,
        DrawableObject: BackedObjectConstructor<T>,
    ) {
        this.constructors.set(type, DrawableObject as unknown as BaseBackedConstructor);
    }

    // Set hadndlers to false to create object without adding it to the state.
    // Use this if you just need an object instance for calculations, for example.
    static build<T extends EntityType>(
        layer: Layer,
        entity: DrawableEntity & {type: T},
        objectStore: ObjectStore,
        handlers: Handlers | false,
    ) {

        const GenericDrawable = this.constructors.get(entity.type);
        if (GenericDrawable) {
            if (handlers === false) {
                const object: BaseBackedObject = new GenericDrawable(
                    objectStore,
                    layer,
                    entity,
                    () => { /**/ },
                    () => { /**/ },
                    () => { /**/ },
                );
                objectStore.set(entity.uid, object);
                return object;
            } else {
                const object: BaseBackedObject = new GenericDrawable(
                    objectStore,
                    layer,
                    entity,
                    (e) => handlers.onSelected(e),
                    handlers.onChange,
                    (e) => handlers.onCommit(e),
                );
                objectStore.set(entity.uid, object);
                return object;
            }
        } else {
            throw new Error('request to build unknown entity: ' + JSON.stringify(entity));
        }
    }
}

export interface Handlers {
    onSelected: (event: MouseEvent | KeyboardEvent) => void;
    onChange: () => void;
    onCommit: (event: MouseEvent | KeyboardEvent) => void;
}
