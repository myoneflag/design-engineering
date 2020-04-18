import CanvasContext from "../../../../src/htmlcanvas/lib/canvas-context";
import { EntityType } from "../../../../../common/src/api/document/entities/types";
import Centered from "../../../../src/htmlcanvas/lib/object-traits/centered-object";
import BackedDrawableObject from "../../../../src/htmlcanvas/lib/backed-drawable-object";
import {
    CenteredEntityConcrete,
    isCentered,
    isConnectableEntity
} from "../../../../../common/src/api/document/entities/concrete-entity";
import BaseBackedObject from "../../../../src/htmlcanvas/lib/base-backed-object";

export function rebaseAll(context: CanvasContext) {
    for (const lvl of Object.keys(context.document.diffFilter.levels)) {
        for (const euid of context.globalStore.entitiesInLevel.get(lvl)!) {
            const o = context.globalStore.get(euid)!;
            if (isCentered(o.entity.type)) {
                const co = o as BaseBackedObject & Centered;
                co.debase(context);
                co.rebase(context);
            }
        }
    }
}
