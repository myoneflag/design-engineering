import { Rectangle } from "../../../../src/store/document/types";
import DrawableObject from "../../../../src/htmlcanvas/lib/drawable-object";

export interface Sizeable {
    boundary: Rectangle;
}

export type SizeableObject = Sizeable & DrawableObject;
