import {ViewPort} from '@/htmlcanvas/viewport';
import {DocumentState, DrawableEntity, WithID} from '@/store/document/types';
import {MouseMoveResult} from '@/htmlcanvas/types';
import DrawableObject from '@/htmlcanvas/lib/drawable-object';
import {Interaction} from '@/htmlcanvas/lib/interaction';
import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import {DrawingContext} from '@/htmlcanvas/lib/types';

export default interface Layer {
    selectedEntity: WithID | null;
    selectedObject: BaseBackedObject | null;

    draw(context: DrawingContext, active: boolean, ...args: any[]): any;
    update(doc: DocumentState): any;
    drawSelectionLayer(context: DrawingContext, interactive: DrawableEntity[] | null): any;

    onMouseMove(event: MouseEvent, vp: ViewPort): MouseMoveResult;
    onMouseDown(event: MouseEvent, vp: ViewPort): boolean;
    onMouseUp(event: MouseEvent, vp: ViewPort): boolean;

    offerInteraction(
        interaction: Interaction,
        filter?: (objects: DrawableEntity[]) => boolean,
        sortBy?: (objects: DrawableEntity[]) => any,
    ): DrawableEntity[] | null;
}
