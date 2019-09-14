import {ViewPort} from '@/htmlcanvas/viewport';
import {DocumentState, DrawableEntity, WithID} from '@/store/document/types';
import {MouseMoveResult} from '@/htmlcanvas/types';
import DrawableObject from '@/htmlcanvas/lib/drawable-object';
import {Interaction} from '@/htmlcanvas/tools/interaction';
import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';

export default interface Layer {
    selectedEntity: WithID | null;
    selectedObject: DrawableObject | null;

    draw(
        ctx: CanvasRenderingContext2D,
        vp: ViewPort,
        active: boolean,
        ...args: any[]
    ): any;
    update(doc: DocumentState): any;
    drawSelectionLayer(
        ctx: CanvasRenderingContext2D,
        vp: ViewPort,
        interactive: BackedDrawableObject<DrawableEntity> | null,
    ): any;

    onMouseMove(event: MouseEvent, vp: ViewPort): MouseMoveResult;
    onMouseDown(event: MouseEvent, vp: ViewPort): boolean;
    onMouseUp(event: MouseEvent, vp: ViewPort): boolean;

    offerInteraction(
        interaction: Interaction,
        filter?: (object: BackedDrawableObject<DrawableEntity>) => boolean,
    ): BackedDrawableObject<DrawableEntity> | null;
}
