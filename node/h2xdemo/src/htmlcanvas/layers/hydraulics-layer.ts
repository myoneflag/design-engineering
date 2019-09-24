import Layer from '@/htmlcanvas/layers/layer';
import {ViewPort} from '@/htmlcanvas/viewport';
import {MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';
import {Coord, DocumentState, DrawableEntity, WithID} from '@/store/document/types';
import BackedDrawableObject from '@/htmlcanvas/lib/backed-drawable-object';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import FlowSource from '@/htmlcanvas/objects/flow-source';
import FlowSourceEntity from '@/store/document/entities/flow-source-entity';
import * as _ from 'lodash';
import DrawableObject from '@/htmlcanvas/lib/drawable-object';
import Valve from '@/htmlcanvas/objects/valve';
import ValveEntity from '@/store/document/entities/valve-entity';
import Pipe from '@/htmlcanvas/objects/pipe';
import PipeEntity from '@/store/document/entities/pipe-entity';
import {EntityType} from '@/store/document/entities/types';
import {Interaction} from '@/htmlcanvas/lib/interaction';
import {DrawingContext, ObjectStore} from '@/htmlcanvas/lib/types';
import TmvEntity from '@/store/document/entities/tmv/tmv-entity';
import Tmv from '@/htmlcanvas/objects/tmv/tmv';
import DrawableObjectFactory from '../lib/drawable-object-factory';

export default class  HydraulicsLayer implements Layer {
    uidsInOrder: string[] = [];

    onChange: () => any;
    onSelect: (drawable: BaseBackedObject | null) => any;
    onCommit: (drawable: BaseBackedObject) => any;

    selectedObject: BaseBackedObject | null = null;

    objectStore: ObjectStore;

    constructor(
        objectStore: Map<string,  BaseBackedObject>,
        onChange: () => any,
        onSelect: (drawable: BaseBackedObject | null) => any,
        onCommit: (drawable: BaseBackedObject) => any,
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
        return this.selectedObject.entity;
    }

    draw(context: DrawingContext, active: boolean) {
        this.uidsInOrder.forEach((v) => {
            this.objectStore.get(v)!.draw(context, active);
        });
    }

    drawSelectionLayer(context: DrawingContext, interactive: BaseBackedObject | null) {
        if (this.selectedObject) {
            this.objectStore.get(this.selectedObject.entity.uid)!.draw(context, true, true);
        }
        if (interactive && this.uidsInOrder.indexOf(interactive.uid) !== -1) {
            this.objectStore.get(interactive.entity.uid)!.draw(context, true, true);
        }
    }



    update(doc: DocumentState) {
        const thisIds = doc.drawing.entities.map((v) => v.uid);
        const removed = this.uidsInOrder.filter((v: string) => thisIds.indexOf(v) === -1);

        removed.forEach((v) => {
            this.objectStore.delete(v);
            if (this.selectedObject && v === this.selectedObject.entity.uid) {
                this.selectedObject = null;
                this.onSelect(null);
            }
        });

        // We have to create child objects from root to child with a tree.
        // Build tree.
        const adj: Map<string|null, string[]> = new Map<string|null, string[]>();
        doc.drawing.entities.forEach((entity) => {

            let parent: BaseBackedObject | null = null;
            if (entity.parentUid) {
                parent = this.objectStore.get(entity.parentUid)!;
            }

            if (this.objectStore.get(entity.uid) !== undefined) {
                // update existing object
                const object = this.objectStore.get(entity.uid)!;
                object.refreshObject(
                    parent ? parent.entity : null,
                    entity,
                );
            } else {
                DrawableObjectFactory.build(
                    entity,
                    parent ? parent.entity : null,
                    this.objectStore,
                    {
                        onSelected: (o) => this.onSelected(o),
                        onChange: () => this.onChange(),
                        onCommit: (o) => this.onCommit(o),
                    },
                );
            }
        });

        this.uidsInOrder = [];


        // We draw valves on top, followed by pipes and finally risers, sinks and everything else.
        this.uidsInOrder.push(...thisIds.filter((a) => {
            const o = (this.objectStore.get(a) as BaseBackedObject).entity;
            return o.type === EntityType.VALVE;
        }));


        this.uidsInOrder.splice(0, 0, ...thisIds.filter((a) => {
            const o = (this.objectStore.get(a) as BaseBackedObject).entity;
            return this.uidsInOrder.indexOf(a) === -1 && o.type !== EntityType.PIPE;
        }));

        this.uidsInOrder.splice(0, 0, ...thisIds.filter((a) => {
            const o = (this.objectStore.get(a) as BaseBackedObject).entity;
            return o.type === EntityType.PIPE;
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

    onSelected(object: BaseBackedObject | null) {
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

    offerInteraction(
        interaction: Interaction,
        filter?: (object: BaseBackedObject) => boolean,
        sortKey?: (object: BaseBackedObject) => any,
    ): BaseBackedObject | null {

        const candidates: Array<[any, BaseBackedObject]> = [];

        for (let i = this.uidsInOrder.length - 1; i >= 0; i--) {
            const uid = this.uidsInOrder[i];
            if (this.objectStore.has(uid)) {
                const object = this.objectStore.get(uid)!;
                const objectCoord = object.toObjectCoord(interaction.worldCoord);
                const objectLength = object.toObjectLength(interaction.worldRadius);
                if (object.inBounds(objectCoord, objectLength)) {
                    if (object.offerInteraction(interaction)) {
                        if (filter === undefined || filter(object)) {
                            if (sortKey === undefined) {
                                return object;
                            } else {
                                candidates.push([sortKey(object), object]);
                            }
                        }
                    }
                }
            }
        }

        if (candidates.length) {
            let best = candidates[0][1];
            let bestScore = candidates[0][0];

            for (let i = 1; i < candidates.length; i++) {
                if (candidates[i][0] > bestScore) {
                    bestScore = candidates[i][0];
                    best = candidates[i][1];
                }
            }
            return best;
        }

        return null;
    }
}
