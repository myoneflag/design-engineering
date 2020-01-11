import CanvasContext from "../../../../src/htmlcanvas/lib/canvas-context";
import { EntityType } from "../../../../src/store/document/entities/types";
import Centered from "../../../../src/htmlcanvas/lib/object-traits/centered-object";
import BackedDrawableObject from "../../../../src/htmlcanvas/lib/backed-drawable-object";
import {
    CenteredEntityConcrete,
    isCentered,
    isConnectableEntity
} from "../../../../src/store/document/entities/concrete-entity";
import BaseBackedObject from "../../../../src/htmlcanvas/lib/base-backed-object";

export function rebaseAll(context: CanvasContext) {
    context.objectStore.forEach((o) => {
        if (isCentered(o.entity.type)) {
            const co = o as BaseBackedObject & Centered;
            co.debase();
            co.rebase(context);
        }
    });
}
