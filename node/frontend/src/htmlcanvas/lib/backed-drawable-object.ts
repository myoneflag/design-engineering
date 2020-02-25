import DrawableObject from "../../../src/htmlcanvas/lib/drawable-object";
import { DocumentState } from "../../../src/store/document/types";
import * as _ from "lodash";
import { Interaction } from "../../../src/htmlcanvas/lib/interaction";
import BaseBackedObject from "../../../src/htmlcanvas/lib/base-backed-object";
import { DrawableEntityConcrete } from "../../../../common/src/api/document/entities/concrete-entity";
import Layer from "../../../src/htmlcanvas/layers/layer";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import { ObjectStore } from "./object-store";
import { Coord, DrawableEntity, WithID } from "../../../../common/src/api/document/drawing";
import { GlobalStore } from "./global-store";

export default abstract class BackedDrawableObject<T extends DrawableEntityConcrete> extends BaseBackedObject {
    entity: T;

    constructor(
        vm: Vue | undefined,
        globalStore: GlobalStore,
        document: DocumentState,
        obj: T,
        onSelect: (event: MouseEvent | KeyboardEvent) => void,
        onChange: () => void,
        onCommit: (event: MouseEvent | KeyboardEvent) => void
    ) {
        super(vm, globalStore, document, obj, onSelect, onChange, onCommit);
    }

    // Unfortunately, typescript does not allow abstract static methods. So this is just a human reminder
    // to register new objects with a concrete static method (suggest: register()). Don't actually do the
    // registration in this instance method, just no-op it and use it as a reminder to make the real one.
    abstract rememberToRegister(): void;
}

export type BaseBackedConstructor = new (
    vm: Vue | undefined,
    globalStore: GlobalStore,
    document: DocumentState,
    obj: DrawableEntity,
    onSelect: (event: MouseEvent | KeyboardEvent) => void,
    onChange: () => void,
    onCommit: (event: MouseEvent | KeyboardEvent) => void
) => BaseBackedObject;

export type BackedObjectConstructor<T extends DrawableEntityConcrete> = new (
    vm: Vue | undefined,
    objectStore: GlobalStore,
    document: DocumentState,
    obj: T,
    onSelect: (event: MouseEvent | KeyboardEvent) => void,
    onChange: () => void,
    onCommit: (event: MouseEvent | KeyboardEvent) => void
) => BackedDrawableObject<T>;
