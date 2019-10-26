import {PaperSize} from '@/config';
import {Coord, DrawableEntity, DrawingState, FlowSystemParameters, Rectangle} from '@/store/document/types';
import {EntityType} from '@/store/document/entities/types';
import {Choice} from '@/lib/types';
import {FieldType, PropertyField} from '@/store/document/entities/property-field';
import {cloneSimple} from '@/lib/utils';
import PipeEntity from '@/store/document/entities/pipe-entity';

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

export function makeBackgroundFields(): PropertyField[] {
    return [

        { property: 'filename', title: 'Title', hasDefault: false, isCalculated: false,
            type: FieldType.Text, params: null, readonly: true,  multiFieldId: 'filename' },
        { property: 'rotation', title: 'Rotation', hasDefault: false, isCalculated: false,
            type: FieldType.Rotation, params: null,  multiFieldId: 'rotation' },

    ];
}
