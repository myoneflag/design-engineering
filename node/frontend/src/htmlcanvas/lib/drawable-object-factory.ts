import { EntityType } from "../../../../common/src/api/document/entities/types";
import BackedDrawableObject, {
    BackedObjectConstructor,
    BaseBackedConstructor
} from "../../../src/htmlcanvas/lib/backed-drawable-object";
import BaseBackedObject from "../../../src/htmlcanvas/lib/base-backed-object";
import { DrawableEntityConcrete } from "../../../../common/src/api/document/entities/concrete-entity";
import Layer from "../../../src/htmlcanvas/layers/layer";
import { GlobalStore } from "./global-store";
import { ObjectStore } from "./object-store";
import { DrawableEntity } from "../../../../common/src/api/document/drawing";

export default class DrawableObjectFactory {
    static constructors: Map<EntityType, BaseBackedConstructor> = new Map<EntityType, BaseBackedConstructor>();

    static registerEntity<Y extends EntityType, T extends DrawableEntityConcrete & { type: Y }>(
        type: Y,
        DrawableObject: BackedObjectConstructor<T>
    ) {
        this.constructors.set(type, (DrawableObject as unknown) as BaseBackedConstructor);
    }

    // Set hadndlers to false to create object without adding it to the state.
    // Use this if you just need an object instance for calculations, for example.
    static buildVisible<T extends EntityType>(
        layer: Layer,
        entity: () => DrawableEntity & { type: T },
        objectStore: ObjectStore,
        handlers: Handlers
    ) {
        const GenericDrawable = this.constructors.get(entity().type);
        if (GenericDrawable) {
            const object: BaseBackedObject = new GenericDrawable(
                undefined,
                objectStore,
                layer,
                entity,
                (e) => handlers.onSelected(e),
                handlers.onChange,
                (e) => handlers.onCommit(e)
            );
            objectStore.set(entity().uid, object);
            return object;
        } else {
            throw new Error("request to build unknown entity: " + JSON.stringify(entity));
        }
    }

    static buildGhost(
        entity: () => DrawableEntityConcrete,
        global: GlobalStore,
        levelUid: string | null,
        vm: Vue | undefined
    ) {
        const GenericDrawable = this.constructors.get(entity().type);
        if (GenericDrawable) {
            const object: BaseBackedObject = new GenericDrawable(
                vm,
                global,
                undefined as any,
                entity,
                () => {
                    /**/
                },
                () => {
                    /**/
                },
                () => {
                    /**/
                }
            );
            global.set(entity().uid, object, levelUid);
            return object;
        } else {
            throw new Error("request to build unknown entity: " + JSON.stringify(entity));
        }
    }
}

export interface Handlers {
    onSelected: (event: MouseEvent | KeyboardEvent) => void;
    onChange: () => void;
    onCommit: (event: MouseEvent | KeyboardEvent) => void;
}
