import Layer from '@/htmlcanvas/layers/layer';
import {ViewPort} from '@/htmlcanvas/viewport';
import {MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';
import {Coord, DocumentState, DrawableEntity, WithID} from '@/store/document/types';
import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import {ENTITY_NAMES} from '@/store/document/entities';
import FlowSource from '@/htmlcanvas/objects/flow-source';
import FlowSourceEntity from '@/store/document/entities/flow-source-entity';
import * as _ from 'lodash';
import DrawableObject from '@/htmlcanvas/lib/drawable-object';
import Valve from '@/htmlcanvas/objects/valve';
import ValveEntity from '@/store/document/entities/valveEntity';
import Pipe from '@/htmlcanvas/objects/pipe';
import PipeEntity from '@/store/document/entities/pipeEntity';

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
        onSelect: (drawable: BackedDrawableObject<WithID> | null) => any,
        onCommit: (drawable: BackedDrawableObject<WithID>) => any,
    ) {
        this.objectStore = objectStore;
        this.onChange = onChange;

        this.onSelect = onSelect;
        this.onCommit = onCommit;
    }

    get selectedEntity() {
        if (this.selectedObject == null) {
            return null;
        }
        return this.selectedObject.stateObject;
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

        removed.forEach((v) => {
            this.objectStore.delete(v);
            if (this.selectedObject && v === this.selectedObject.stateObject.uid) {
                this.selectedObject = null;
                this.onSelect(null);
            }
        });

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
                            this.objectStore,
                            parent,
                            entity as FlowSourceEntity,
                            (object) => this.onSelected(object),
                            () => this.onChange(),
                            (flowSource) => this.onCommit(flowSource),
                        ));
                    } else if (entity.type === ENTITY_NAMES.VALVE) {
                        this.objectStore.set(entity.uid, new Valve(
                            doc,
                            this.objectStore,
                            parent,
                            entity as ValveEntity,
                            (object) => this.onSelected(object),
                            () => this.onChange(),
                            (flowSource) => this.onCommit(flowSource),
                        ));
                    } else if (entity.type === ENTITY_NAMES.PIPE) {
                        this.objectStore.set(entity.uid, new Pipe(
                            doc,
                            this.objectStore,
                            parent,
                            entity as PipeEntity,
                            (object) => this.onSelected(object),
                            () => this.onChange(),
                            (flowSource) => this.onCommit(flowSource),
                        ));
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

        this.uidsInOrder = [];

        // We draw valves on top, followed by pipes and finally risers, sinks and everything else.
        this.uidsInOrder.push(...thisIds.filter((a) => {
            const o = (this.objectStore.get(a) as BackedDrawableObject<DrawableEntity>).stateObject;
            return o.type === ENTITY_NAMES.VALVE;
        }));

        this.uidsInOrder.splice(0, 0, ...thisIds.filter((a) => {
            const o = (this.objectStore.get(a) as BackedDrawableObject<DrawableEntity>).stateObject;
            return o.type === ENTITY_NAMES.PIPE;
        }));

        this.uidsInOrder.splice(0, 0, ...thisIds.filter((a) => {
            return this.uidsInOrder.indexOf(a) === -1;
        }));
    }

    getObjectAt(worldCoord: Coord, exclude: string[] = []): DrawableObject | null {
        for (let i = this.uidsInOrder.length - 1; i >= 0; i--) {
            const uid = this.uidsInOrder[i];
            if (exclude.indexOf(uid) !== -1) {
                continue;
            }
            if (this.objectStore.has(uid)) {
                const object = this.objectStore.get(uid)!;
                if (object.inBounds(object.toObjectCoord(worldCoord))) {
                    return object;
                }
            }
        }
        return null;
    }

    onSelected(object: BackedDrawableObject<WithID> | null) {
        const oldSelected = this.selectedObject;
        this.selectedObject = object;
        if (oldSelected !== null && object !== null && oldSelected.uid !== object.uid
            || (oldSelected !== null) !== (object !== null)) {
            this.onSelect(this.selectedObject);
        }
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
