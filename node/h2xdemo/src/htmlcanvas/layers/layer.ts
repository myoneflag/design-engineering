import {ViewPort} from '@/htmlcanvas/viewport';
import {DocumentState, DrawableEntity, WithID} from '@/store/document/types';
import {MouseMoveResult} from '@/htmlcanvas/types';
import DrawableObject from '@/htmlcanvas/lib/drawable-object';
import {Interaction} from '@/htmlcanvas/lib/interaction';
import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import {DrawingContext} from '@/htmlcanvas/lib/types';
import {DrawableEntityConcrete} from '@/store/document/entities/concrete-entity';
import CanvasContext from '@/htmlcanvas/lib/canvas-context';

export default interface Layer {
    selectedEntity: WithID | null;
    selectedObject: BaseBackedObject | null;

    select(object: BaseBackedObject | null): void;

    draw(context: DrawingContext, active: boolean, ...args: any[]): any;
    update(doc: DocumentState): any;
    drawSelectionLayer(context: DrawingContext, interactive: DrawableEntityConcrete[] | null): any;

    onMouseMove(event: MouseEvent, context: CanvasContext): MouseMoveResult;
    onMouseDown(event: MouseEvent, context: CanvasContext): boolean;
    onMouseUp(event: MouseEvent, context: CanvasContext): boolean;

    // Call this when starting a drag, to make sure all mouse events go to it until the drag ends.
    dragObjects(objects: BaseBackedObject[]): void;
    releaseDrag(): void;

    offerInteraction(
        interaction: Interaction,
        filter?: (objects: DrawableEntityConcrete[]) => boolean,
        sortBy?: (objects: DrawableEntityConcrete[]) => any,
    ): DrawableEntityConcrete[] | null;
}
