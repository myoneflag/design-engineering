import Layer from '@/htmlcanvas/layers/layer';
import {ViewPort} from '@/htmlcanvas/viewport';
import {MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';
import {DocumentState, WithID} from '@/store/document/types';
import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import {ENTITY_NAMES} from '@/store/document/entities';
import FlowSource from '@/htmlcanvas/objects/flow-source';
import FlowSourceEntity from '@/store/document/entities/flow-source';
import * as _ from 'lodash';
import DrawableObject from '@/htmlcanvas/lib/drawable-object';

export default class  HydraulicsLayer implements Layer {
    uidsInOrder: string[] = [];

    onChange: () => any;
    onSelect: (drawable: BackedDrawableObject<WithID> | null) => any;
    onCommit: (drawable: BackedDrawableObject<WithID>) => any;

    selectedObject: BackedDrawableObject<WithID> | null = null;

    objectStore: Map<string, DrawableObject>;

    constructor(
        objectStore: Map<string, DrawableObject>,
        onChange: () => any,
        onSelect: (drawable: BackedDrawableObject<WithID> | null)
        => any, onCommit: (drawable: BackedDrawableObject<WithID>) => any
    ) {
        this.objectStore = objectStore;
        this.onChange = onChange;

        this.onSelect = onSelect;
        this.onCommit = onCommit;
    }


    draw(ctx: CanvasRenderingContext2D, vp: ViewPort, active: boolean) {
        this.uidsInOrder.forEach((v) => {
            this.objectStore.get(v)!.draw(ctx, vp, active);
        });
    }

    drawSelectionLayer(ctx: CanvasRenderingContext2D, vp: ViewPort) {
        if (this.selectedObject) {
            this.objectStore.get(this.selectedObject.stateObject.uid)!.draw(ctx, vp, true, true);
        }
    }

    update(doc: DocumentState) {
        const thisIds = doc.drawing.entities.map((v) => v.uid);
        const removed = this.uidsInOrder.filter((v: string) => thisIds.indexOf(v) === -1);

        removed.forEach((v) =>  this.objectStore.delete(v));

        // We have to create child objects from root to child with a tree.
        // Build tree.
        const adj: Map<string|null, string[]> = new Map<string|null, string[]>();
        doc.drawing.entities.forEach((v) => {
            if (!adj.has((v.parentUid))) {
                adj.set(v.parentUid, []);
            }
            adj.get(v.parentUid)!.push(v.uid);
        });

        // Traverse tree, building real world objects in the correct order so that parents are always available before
        // children.
        const roots: Array<string | null> = [null, ...(doc.drawing.backgrounds.map((v) => v.uid))];
        const dfs: Array<string|null> = _.clone(roots);
        let numVisited = 0;
        while (dfs.length) {
            const next = dfs.pop()!;
            numVisited ++;

            // Root elements are not part of this.
            if (roots.indexOf(next) === -1) {
                const entity = doc.drawing.entities.find((v) => v.uid === next)!;

                let parent: DrawableObject | null = null;
                if (entity.parentUid) {
                    parent = this.objectStore.get(entity.parentUid)!;
                }

                if (this.objectStore.get(entity.uid) !== undefined) {
                    // update existing object
                    const object = this.objectStore.get(entity.uid);
                    if (object instanceof BackedDrawableObject) {
                        object.refreshObject(
                            doc,
                            parent,
                            entity,
                        );
                    } else {
                        throw new Error('Expected backed drawable object, got ' + JSON.stringify(object) + ' instead');
                    }
                } else {
                    // create new object
                    if (entity.type === ENTITY_NAMES.FLOW_SOURCE) {
                        this.objectStore.set(entity.uid, new FlowSource(
                            doc,
                            parent,
                            entity as FlowSourceEntity,
                            (object) => this.onSelected(object),
                            ),
                        );
                    }
                }
            }


            if (adj.has(next)) {
                dfs.push(...adj.get(next)!);
            }
        }

        if (numVisited !== thisIds.length + roots.length) {

            throw new Error('Number of create objects not the same as total number of objects.' +
                ' Possible causes: multiple objects with the same ID. Cyclic parent dependency. ' +
                numVisited + ' vs ' + (thisIds.length + roots.length),
            );
        }

        this.uidsInOrder =  thisIds;
    }


    onSelected(object: BackedDrawableObject<WithID> | null) {
        this.selectedObject = object;
        this.onSelect(this.selectedObject);
    }

    onMouseDown(event: MouseEvent, vp: ViewPort) {
        for (let i = this.uidsInOrder.length - 1; i >= 0; i--) {
            const uid = this.uidsInOrder[i];
            if (this.objectStore.has(uid)) {
                const object = this.objectStore.get(uid)!;
                if (object.onMouseDown(event, vp)) {
                    return true;
                }
            }
        }

        return false;
    }

    onMouseMove(event: MouseEvent, vp: ViewPort): MouseMoveResult {
        for (let i = this.uidsInOrder.length - 1; i >= 0; i--) {
            const uid = this.uidsInOrder[i];
            if (this.objectStore.has(uid)) {
                const object = this.objectStore.get(uid)!;
                const res = object.onMouseMove(event, vp);
                if (res.handled) {
                    return res;
                }
            }
        }

        return UNHANDLED;
    }


    onMouseUp(event: MouseEvent, vp: ViewPort) {
        for (let i = this.uidsInOrder.length - 1; i >= 0; i--) {
            const uid = this.uidsInOrder[i];
            if (this.objectStore.has(uid)) {
                const object = this.objectStore.get(uid)!;
                if (object.onMouseUp(event, vp)) {
                    return true;
                }
            }
        }


        this.selectedObject = null;
        this.onSelect(null);
        this.onChange();

        return false;
    }
}
