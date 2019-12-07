import {Coord, DrawableEntity, DrawingState, FlowSystemParameters, Rectangle} from '../../../../src/store/document/types';
import {EntityType} from '../../../../src/store/document/entities/types';
import {Choice} from '../../../../src/lib/types';
import {FieldType, PropertyField} from '../../../../src/store/document/entities/property-field';
import {cloneSimple} from '../../../../src/lib/utils';
import PipeEntity from '../../../../src/store/document/entities/pipe-entity';
import {PaperSize} from "../../../../../common/src/paper-config";

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
