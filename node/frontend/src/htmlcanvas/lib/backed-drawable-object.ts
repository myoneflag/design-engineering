import DrawableObject from '../../../src/htmlcanvas/lib/drawable-object';
import {Coord, DocumentState, DrawableEntity, WithID} from '../../../src/store/document/types';
import * as _ from 'lodash';
import {Interaction} from '../../../src/htmlcanvas/lib/interaction';
import {ObjectStore} from '../../../src/htmlcanvas/lib/types';
import BaseBackedObject from '../../../src/htmlcanvas/lib/base-backed-object';
import {DrawableEntityConcrete} from '../../../src/store/document/entities/concrete-entity';
import Layer from '../../../src/htmlcanvas/layers/layer';
import CanvasContext from '../../../src/htmlcanvas/lib/canvas-context';

export default abstract class BackedDrawableObject<T extends DrawableEntityConcrete> extends BaseBackedObject {
    entity: T;

    constructor(
        objectStore: ObjectStore,
        layer: Layer,
        obj: T,
        onSelect: (event: MouseEvent | KeyboardEvent) => void,
        onChange: () => void,
        onCommit: (event: MouseEvent | KeyboardEvent) => void,
    ) {
        super(objectStore, layer, obj, onSelect, onChange, onCommit);
        this.entity = obj; // to keep error checking happy
    }

    // Unfortunately, typescript does not allow abstract static methods. So this is just a human reminder
    // to register new objects with a concrete static method (suggest: register()). Don't actually do the
    // registration in this instance method, just no-op it and use it as a reminder to make the real one.
    abstract rememberToRegister(): void;
}

export type BaseBackedConstructor = new (
    objectStore: ObjectStore,
    layer: Layer,
    obj: DrawableEntity,
    onSelect: (event: MouseEvent | KeyboardEvent) => void,
    onChange: () => void,
    onCommit: (event: MouseEvent | KeyboardEvent) => void,
) => BaseBackedObject;

export type BackedObjectConstructor<T extends DrawableEntityConcrete> = new (
    objectStore: ObjectStore,
    layer: Layer,
    obj: T,
    onSelect: (event: MouseEvent | KeyboardEvent) => void,
    onChange: () => void,
    onCommit: (event: MouseEvent | KeyboardEvent) => void,
) => BackedDrawableObject<T>;