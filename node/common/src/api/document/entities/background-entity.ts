import { EntityType } from "./types";
import { FieldType, PropertyField } from "./property-field";
import { PaperSize } from "../../paper-config";
import { Coord, DrawableEntity, Rectangle } from "../drawing";

export interface BackgroundEntity extends DrawableEntity {
    type: EntityType.BACKGROUND_IMAGE;
    center: Coord;
    scaleName: string;
    scaleFactor: number;
    key: string;
    filename: string;
    crop: Rectangle;
    paperSize: PaperSize;
    rotation: number;

    // For scaling:
    pointA: Coord | null;
    pointB: Coord | null;

    // For replacing pdfs that need adjustments later:
    offset: Coord;

    // Backgrounds are part of PDFs and so may have many pages.
    page: number;
    totalPages: number;
}

export function makeBackgroundFields(): PropertyField[] {
    return [
        {
            property: "filename",
            title: "Title",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Text,
            params: null,
            readonly: true,
            multiFieldId: "filename"
        },
        {
            property: "rotation",
            title: "Rotation",
            hasDefault: false,
            isCalculated: false,
            type: FieldType.Rotation,
            params: null,
            multiFieldId: "rotation"
        }
    ];
}
