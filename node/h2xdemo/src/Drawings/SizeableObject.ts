import {Rectangle} from '@/store/document/types';
import DrawableObject from '@/Drawings/DrawableObject';

export default abstract class SizeableObject extends DrawableObject {
    // Size is relative to the center of the object.
    abstract get boundary(): Rectangle;
    abstract set boundary(value: Rectangle);
}
