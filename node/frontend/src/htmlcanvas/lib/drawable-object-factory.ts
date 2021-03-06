import { EntityType } from "../../../../common/src/api/document/entities/types";
import { BackedObjectConstructor, BaseBackedConstructor } from "../../../src/htmlcanvas/lib/backed-drawable-object";
import BaseBackedObject from "../../../src/htmlcanvas/lib/base-backed-object";
import { DrawableEntityConcrete } from "../../../../common/src/api/document/entities/concrete-entity";
import { GlobalStore } from "./global-store";
import { DrawableEntity } from "../../../../common/src/api/document/drawing";
import { DocumentState } from "../../store/document/types";

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
        entity: DrawableEntity & { type: T },
        globalStore: GlobalStore,
        document: DocumentState,
        levelUid: string | null,
        handlers: Handlers
    ) {
        const GenericDrawable = this.constructors.get(entity.type);
        if (GenericDrawable) {
            const object: BaseBackedObject = new GenericDrawable(
                undefined,
                globalStore,
                document,
                entity,
                (e) => handlers.onSelect(e),
                handlers.onRedrawNeeded,
                (e) => handlers.onInteractionComplete(e)
            );
            globalStore.set(entity.uid, object, levelUid);
            return object;
        } else {
            throw new Error("request to build unknown entity: " + JSON.stringify(entity));
        }
    }

    static buildGhost(
        entity: DrawableEntityConcrete,
        global: GlobalStore,
        document: DocumentState,
        levelUid: string | null,
        vm: Vue | undefined
    ) {
        const GenericDrawable = this.constructors.get(entity.type);
        if (GenericDrawable) {
            const object: BaseBackedObject = new GenericDrawable(
                vm,
                global,
                document,
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
            global.set(entity.uid, object, levelUid);
            return object;
        } else {
            throw new Error("request to build unknown entity: " + JSON.stringify(entity));
        }
    }
}

export interface Handlers {
    onSelect: (event: MouseEvent | KeyboardEvent) => void;
    onRedrawNeeded: () => void;
    onInteractionComplete: (event: MouseEvent | KeyboardEvent) => void;
}
