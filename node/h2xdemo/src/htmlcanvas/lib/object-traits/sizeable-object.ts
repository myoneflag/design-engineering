import {Rectangle} from '@/store/document/types';
import DrawableObject from '@/htmlcanvas/lib/drawable-object';

export interface Sizeable {
    boundary: Rectangle;
}

export type SizeableObject = Sizeable & DrawableObject;
