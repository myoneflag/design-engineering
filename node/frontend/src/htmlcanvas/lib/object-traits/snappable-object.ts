import BackedDrawableObject from "../../../../src/htmlcanvas/lib/backed-drawable-object";
import { CenteredEntityConcrete } from "../../../../../common/src/api/document/entities/concrete-entity";
import CanvasContext from "../../../../src/htmlcanvas/lib/canvas-context";
import { getInsertCoordsAt } from "../../../../src/htmlcanvas/lib/utils";
import BaseBackedObject from "../base-backed-object";
import { UNHANDLED } from "../../types";

export function SnappableObject<T extends new (...args: any[]) => BaseBackedObject>(constructor: T) {
    // @ts-ignore abstract class expression limitation in the language. In practice this is fine.
    return class extends constructor  {
        snappable: true = true;
    };
}
