import {Rectangle} from '@/store/document/types';
import DrawableObject from '@/htmlcanvas/lib/drawable-object';

export interface Sizeable {
    boundary: Rectangle;
}

export default abstract class SizeableObject extends DrawableObject implements Sizeable {
    // Size is relative to the center of the object.
    abstract get boundary(): Rectangle;
    abstract set boundary(value: Rectangle);
}
