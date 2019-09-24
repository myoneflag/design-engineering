import DrawableObject from '@/htmlcanvas/lib/drawable-object';
import {Coord, DocumentState, DrawableEntity, WithID} from '@/store/document/types';
import * as _ from 'lodash';
import {Interaction} from '@/htmlcanvas/lib/interaction';
import {ObjectStore} from '@/htmlcanvas/lib/types';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';

export default abstract class BackedDrawableObject<T extends DrawableEntity> extends BaseBackedObject {
    entity: T;

    constructor(
        objectStore: ObjectStore,
        parentEntity: DrawableEntity | null,
        obj: T,
        onSelect: () => void,
        onChange: () => void,
        onCommit: () => void,
    ) {
        super(objectStore, parentEntity, obj, onSelect, onChange, onCommit);
        this.entity = obj; // to keep error checking happy
    }

    // Unfortunately, typescript does not allow abstract static methods. So this is just a human reminder
    // to register new objects with a concrete static method (suggest: register()). Don't actually do the
    // registration in this instance method, just no-op it and use it as a reminder to make the real one.
    abstract rememberToRegister(): void;

}

export type BaseBackedConstructor = new (
    objectStore: ObjectStore,
    parentEntity: DrawableEntity | null,
    obj: DrawableEntity,
    onSelect: () => void,
    onChange: () => void,
    onCommit: () => void,
) => BaseBackedObject;

export type BackedObjectConstructor<T extends DrawableEntity> = new (
    objectStore: ObjectStore,
    parentEntity: DrawableEntity | null,
    obj: T,
    onSelect: () => void,
    onChange: () => void,
    onCommit: () => void,
) => BackedDrawableObject<T>;
