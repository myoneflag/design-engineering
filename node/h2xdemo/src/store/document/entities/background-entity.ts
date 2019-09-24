import {PaperSize} from '@/config';
import {Coord, DrawableEntity, Rectangle} from '@/store/document/types';
import {EntityType} from '@/store/document/entities/types';

export interface BackgroundEntity extends DrawableEntity {
    type: EntityType.BACKGROUND_IMAGE;
    center: Coord;
    scaleName: string;
    scaleFactor: number;
    uri: string;
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
