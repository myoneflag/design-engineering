import Layer from '@/htmlcanvas/layers/layer';
import {ViewPort} from '@/htmlcanvas/viewport';
import {MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';
import {DocumentState, DrawableEntity, WithID} from '@/store/document/types';
import DrawableObject from '@/htmlcanvas/lib/drawable-object';
import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import {ENTITY_NAMES} from '@/store/document/entities';
import FlowSource from '@/htmlcanvas/objects/flow-source';
import FlowSourceEntity from '@/store/document/entities/flow-source';

export default class  HydraulicsLayer implements Layer {

    uidToObject: Map<string, BackedDrawableObject<WithID>> = new Map<string, BackedDrawableObject<WithID>>();
    uidsInOrder: string[] = [];

    draw(ctx: CanvasRenderingContext2D, vp: ViewPort, active: boolean) {
        this.uidsInOrder.forEach((v) => {
            this.uidToObject.get(v)!.draw(ctx, vp);
        });
    }

    drawSelectionLayer (ctx: CanvasRenderingContext2D, vp: ViewPort) {

    }

    onMouseDown (event: MouseEvent, vp: ViewPort) {
        return false;
    }

    onMouseMove (event: MouseEvent, vp: ViewPort) {
        return UNHANDLED;
    }

    onMouseUp (event: MouseEvent, vp: ViewPort) {
        return false;
    }

    update (doc: DocumentState) {
        const thisIds = doc.drawing.entities.map((v) => v.uid);
        const removed = this.uidsInOrder.filter((v: string) => thisIds.indexOf(v) === -1);

        removed.forEach((v) =>  this.uidToObject.delete(v));

        // We have to create child objects from root to child with a tree.
        // Build tree.
        const adj:  Map<string|null, string[]> = new Map<string|null, string[]>();
        doc.drawing.entities.forEach((v) => {
            if (!adj.has((v.parentUid))) {
                adj.set(v.parentUid, []);
            }
            adj.get(v.parentUid)!.push(v.uid);
        });

        // Traverse tree, building real world objects in the correct order so that parents are always available before
        // children.
        const dfs: Array<string|null> = [null];
        let numVisited = 0;
        while (dfs.length) {
            const next = dfs.pop()!;
            numVisited ++;
            if (next != null) {
                const entity = doc.drawing.entities.find((v) => v.uid === next)!;

                if (this.uidToObject.get(entity.uid) !== undefined) {
                    // update existing object
                    this.uidToObject.get(entity.uid)!.refreshObject(
                        doc,
                        entity.parentUid == null ? null : this.uidToObject.get(entity.parentUid)!,
                        entity,
                    );
                } else {
                    // create new object
                    if (entity.type === ENTITY_NAMES.FLOW_SOURCE) {
                        this.uidToObject.set(entity.uid, new FlowSource(
                            doc,
                            entity.parentUid == null ? null : this.uidToObject.get(entity.parentUid)!,
                            entity as FlowSourceEntity,
                            ),
                        );
                    }
                }
            }


            if (adj.has(next)) {
                dfs.push(...adj.get(next)!);
            }
        }

        if (numVisited !== thisIds.length + 1) {

            throw new Error('Number of create objects not the same as total number of objects.' +
                ' Possible causes: multiple objects with the same ID. Cyclic parent dependency. ' +
                numVisited + ' vs ' + (thisIds.length + 1),
            );
        }

        this.uidsInOrder =  thisIds;
    }
}
