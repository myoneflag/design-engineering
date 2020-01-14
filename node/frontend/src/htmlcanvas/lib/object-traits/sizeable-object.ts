import DrawableObject from "../../../../src/htmlcanvas/lib/drawable-object";
import { Rectangle } from "../../../../../common/src/api/document/drawing";

export interface Sizeable {
    boundary: Rectangle;
}

export type SizeableObject = Sizeable & DrawableObject;
