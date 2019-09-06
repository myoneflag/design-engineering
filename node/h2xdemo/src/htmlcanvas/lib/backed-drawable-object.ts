import DrawableObject from '@/htmlcanvas/lib/drawable-object';
import {WithID} from '@/store/document/types';

export default abstract class BackedDrawableObject<T extends WithID> extends DrawableObject {
    stateObject: T;

    constructor(parent: DrawableObject | null, obj: T) {
        super(parent);
        this.stateObject = obj;
    }

    setObject(obj: T) {
        this.stateObject = obj;
    }
}
