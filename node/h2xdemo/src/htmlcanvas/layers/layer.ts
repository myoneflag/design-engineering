import {Coord, DocumentState, DrawableEntity, WithID} from '@/store/document/types';
import {MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';
import {Interaction} from '@/htmlcanvas/lib/interaction';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import {DrawingContext, ObjectStore} from '@/htmlcanvas/lib/types';
import {DrawableEntityConcrete} from '@/store/document/entities/concrete-entity';
import CanvasContext from '@/htmlcanvas/lib/canvas-context';
import {assertUnreachable} from '@/lib/utils';
import {EntityType} from '@/store/document/entities/types';
import {Draggable} from '@/htmlcanvas/lib/object-traits/draggable-object';
import DrawableObjectFactory from '@/htmlcanvas/lib/drawable-object-factory';
import {MainEventBus} from '@/store/main-event-bus';

export default interface Layer {
    selectedEntities: WithID[];
    selectedObjects: BaseBackedObject[];

    select(objects: BaseBackedObject[], mode: SelectMode): void;

    draw(context: DrawingContext, active: boolean, ...args: any[]): any;
    update(doc: DocumentState): any;
    drawSelectionLayer(context: DrawingContext, interactive: DrawableEntityConcrete[] | null): any;

    onMouseMove(event: MouseEvent, context: CanvasContext): MouseMoveResult;
    onMouseDown(event: MouseEvent, context: CanvasContext): boolean;
    onMouseUp(event: MouseEvent, context: CanvasContext): boolean;

    onMultiSelectDragStart(event: MouseEvent, world: Coord, context: CanvasContext): any;
    onMultiSelectDrag(event: MouseEvent, world: Coord,  grabState: any, context: CanvasContext): void;
    onMultiSelectDragFinish(event: MouseEvent, grabState: any, context: CanvasContext): void;

    // Call this when starting a drag, to make sure all mouse events go to it until the drag ends.
    dragObjects(objects: BaseBackedObject[], context: CanvasContext): void;
    releaseDrag(context: CanvasContext): void;

    isSelected(object: BaseBackedObject | string): boolean;

    addEntity(entity: DrawableEntityConcrete): void;
    deleteEntity(entity: DrawableEntityConcrete): void;

    offerInteraction(
        interaction: Interaction,
        filter?: (objects: DrawableEntityConcrete[]) => boolean,
        sortBy?: (objects: DrawableEntityConcrete[]) => any,
    ): DrawableEntityConcrete[] | null;
}

export enum SelectMode {
    Replace,
    Toggle,
    Add,
    Exclude,
}

export abstract class LayerImplementation implements Layer {
    objectStore: ObjectStore;
    uidsInOrder: string[] = [];

    selectedIds: string[] = [];
    draggedObjects: BaseBackedObject[] | null = null;

    onChange: () => any;
    onSelect: () => any;
    onCommit: (obj: DrawableEntityConcrete) => any;

    constructor(
        objectStore: ObjectStore,
        onChange: () => any,
        onSelect: () => any,
        onCommit: (obj: DrawableEntityConcrete) => any,
    ) {
        this.onChange = onChange;
        this.onSelect = onSelect;
        this.onCommit = onCommit;
        this.objectStore = objectStore;
        this.rig();
    }

    rig() {
        MainEventBus.$on('delete-entity', this.onDeleteEntity);
        MainEventBus.$on('add-entity', this.onAddEntity);
    }

    onDeleteEntity = (e: DrawableEntityConcrete) => {
        let i = this.selectedIds.indexOf(e.uid);
        if (i !== -1) {
            this.selectedIds.splice(i, 1);
        }
        if (this.draggedObjects) {
            i = this.draggedObjects.findIndex((o) => o.uid === e.uid);
            if (i !== -1) {
                this.draggedObjects.splice(i, 1);
            }
        }
    }

    onAddEntity = (e: DrawableEntityConcrete) => {
        // who cares
    }

    get selectedObjects() {
        return this.selectedIds.map((uid) => this.objectStore.get(uid)!);
    }

    get selectedEntities() {
        return this.selectedObjects.map((o) => o.entity);
    }

    select(objects: BaseBackedObject[] | string[], mode: SelectMode): void {
        let ids: string[];

        if (objects.length !== 0 && objects[0] instanceof BaseBackedObject) {
            ids = (objects as BaseBackedObject[]).map((o) => o.uid);
        } else {
            ids = (objects as string[]);
        }
        switch (mode) {
            case SelectMode.Replace:
                this.selectedIds = ids;
                return;
            case SelectMode.Toggle:
                const common = this.selectedIds.filter((uid) => ids.includes(uid));
                this.selectedIds.push(...ids);
                this.selectedIds = this.selectedIds.filter((uid) => !common.includes(uid));
                return;
            case SelectMode.Add:
                this.selectedIds.push(...ids.filter((uid) => !this.selectedIds.includes(uid)));
                return;
            case SelectMode.Exclude:
                this.selectedIds = this.selectedIds.filter((uid) => !ids.includes(uid));
                return;
        }
        assertUnreachable(mode);
    }

    isSelected(object: BaseBackedObject | string) {
        if (object instanceof BaseBackedObject) {
            return this.selectedIds.indexOf(object.uid) !== -1;
        } else {
            return this.selectedIds.indexOf(object) !== -1;
        }
    }

    abstract draw(context: DrawingContext, active: boolean, ...args: any[]): any;

    drawSelectionLayer(context: DrawingContext, interactive: DrawableEntity[] | null) {
        if (this.selectedObjects) {
            this.selectedIds.forEach((uid) => {
                this.objectStore.get(uid)!.draw(context, true, true);
            });
        }
        if (interactive) {
            for (let i = interactive.length - 1; i >= 0; i--) {
                const ii = interactive[i];
                if (this.uidsInOrder.indexOf(ii.uid) !== -1) {
                    this.objectStore.get(ii.uid)!.draw(context, true, true);
                }
            }
        }
    }

    offerInteraction(
        interaction: Interaction,
        filter?: (objects: DrawableEntityConcrete[]) => boolean,
        sortKey?: (objects: DrawableEntityConcrete[]) => any,
    ): DrawableEntityConcrete[] | null {

        const candidates: Array<[any, DrawableEntityConcrete[]]> = [];

        for (let i = this.uidsInOrder.length - 1; i >= 0; i--) {
            const uid = this.uidsInOrder[i];
            if (this.objectStore.has(uid)) {
                const object = this.objectStore.get(uid)!;
                const objectCoord = object.toObjectCoord(interaction.worldCoord);
                const objectLength = object.toObjectLength(interaction.worldRadius);
                if (object.inBounds(objectCoord, objectLength)) {

                    const result = object.offerInteraction(interaction);
                    if (result && result.length) {
                        if (filter === undefined || filter(result)) {
                            if (sortKey === undefined) {
                                return result;
                            } else {
                                candidates.push([sortKey(result), result]);
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

    onMouseDown(event: MouseEvent, context: CanvasContext) {
        for (let i = this.uidsInOrder.length - 1; i >= 0; i--) {
            const uid = this.uidsInOrder[i];
            if (this.objectStore.has(uid)) {
                const object = this.objectStore.get(uid)!;
                if (object.onMouseDown(event, context)) {
                    return true;
                }
            }
        }

        return false;
    }

    onMouseMove(event: MouseEvent, context: CanvasContext): MouseMoveResult {
        if (this.draggedObjects) {
            context.$store.dispatch('document/revert', false);
            const res = this.draggedObjects[0].onMouseMove(event, context);
            if (res.handled) {
                return res;
            }
        }

        for (let i = this.uidsInOrder.length - 1; i >= 0; i--) {
            const uid = this.uidsInOrder[i];
            if (this.objectStore.has(uid)) {
                const object = this.objectStore.get(uid)!;
                const res = object.onMouseMove(event, context);
                if (res.handled) {
                    return res;
                }
            }
        }

        return UNHANDLED;
    }


    onMouseUp(event: MouseEvent, context: CanvasContext) {
        if (this.draggedObjects) {
            if (this.draggedObjects[0].onMouseUp(event, context)) {
                return true;
            }
        }

        for (let i = this.uidsInOrder.length - 1; i >= 0; i--) {
            const uid = this.uidsInOrder[i];
            if (this.objectStore.has(uid)) {
                const object = this.objectStore.get(uid)!;
                if (object.onMouseUp(event, context)) {
                    return true;
                }
            }
        }


        if (!event.shiftKey && !event.ctrlKey) {
            this.select([], SelectMode.Replace);
        }

        this.onSelect();
        this.onChange();

        return false;
    }

    dragObjects(objects: BaseBackedObject[], context: CanvasContext): void {
        context.isLayerDragging = true;
        this.draggedObjects = objects;
    }

    releaseDrag(context: CanvasContext): void {
        if (this.draggedObjects) {
            this.draggedObjects.forEach((o) => {
                if (!this.uidsInOrder.includes(o.uid)) {
                    this.objectStore.delete(o.uid);
                }
            });
        }
        context.isLayerDragging = false;
        this.draggedObjects = null;
    }

    onSelected(event: MouseEvent | KeyboardEvent, uid: string) {
        let diffed = false;
        if (event.ctrlKey) {
            this.select([uid], SelectMode.Add);
            diffed = true;
        } else if (event.shiftKey) {
            if (this.isSelected(uid)) {
                diffed = true;
            }
            this.select([uid], SelectMode.Exclude);
        } else {
            if (!this.isSelected(uid) || this.selectedIds.length !== 1) {
                diffed = true;
            }
            this.select([uid], SelectMode.Replace);
        }

        if (diffed) {
            this.onSelect();
        }
    }

    multiDragOrder(uid: string) {
        const e = this.objectStore.get(uid)!.entity;
        switch (e.type) {
            case EntityType.BACKGROUND_IMAGE:
                return 0;
            case EntityType.FIXTURE:
            case EntityType.VALVE:
            case EntityType.FLOW_SOURCE:
            case EntityType.TMV:
                return 1;
            case EntityType.PIPE:
                return 2;
            case EntityType.SYSTEM_NODE:
            case EntityType.RESULTS_MESSAGE:
                throw new Error('cannot handle entities of this maginitied');
        }
    }

    onMultiSelectDragStart(event: MouseEvent, world: Coord, context: CanvasContext): MultiSelectDragParams {
        let allDraggable = true;

        // figure out which elements need to get drag events.
        const toMoveUids: string[] = this.selectedIds.filter((uid) => {
            const o = this.objectStore.get(uid)!;
            if (o.entity.parentUid) {
                const po = this.objectStore.get(o.entity.parentUid)!;
                if (po.layer.isSelected(po.uid)) {
                    return false;
                }
            }
            if (!o.draggable) {
                allDraggable = false;
                return false;
            }

            switch (o.entity.type) {
                case EntityType.BACKGROUND_IMAGE:
                case EntityType.VALVE:
                case EntityType.FLOW_SOURCE:
                case EntityType.FIXTURE:
                case EntityType.TMV:
                    return true;
                case EntityType.PIPE:
                    return o.entity.endpointUid.filter((euid) => this.isSelected(euid)).length < 2;
                case EntityType.SYSTEM_NODE:
                case EntityType.RESULTS_MESSAGE:
                    throw new Error('cannot handle multi dragging for this object');
            }
        });

        toMoveUids.sort((a, b) => {
            return this.multiDragOrder(a) - this.multiDragOrder(b);
        });

        if (!allDraggable) {
            return {
                initialObjectCoords: new Map<string, Coord>(),
                initialStates: new Map<string, any>(),
                toMoveUids: [],
            };
        }

        const initialStates = new Map<string, any>();
        const initialObjectCoords = new Map<string, Coord>();
        toMoveUids.forEach((uid) => {
            const o = this.objectStore.get(uid) as BaseBackedObject & Draggable;
            initialStates.set(uid, o.onDragStart(event, o.toObjectCoord(world), context, true));
            initialObjectCoords.set(uid, o.toObjectCoord(world));
        });

        return {
            initialObjectCoords,
            initialStates,
            toMoveUids,
        };
    }

    onMultiSelectDrag(event: MouseEvent, world: Coord, grabState: MultiSelectDragParams, context: CanvasContext): void {
        context.$store.dispatch('document/revert', false);
        grabState.toMoveUids.forEach((uid) => {
            const o = this.objectStore.get(uid) as BaseBackedObject & Draggable;
            o.onDrag(
                event,
                grabState.initialObjectCoords.get(uid)!,
                o.toObjectCoord(world),
                grabState.initialStates.get(uid),
                context,
                true,
            );
        });
        context.processDocument(false);
        this.onChange();
    }

    onMultiSelectDragFinish(event: MouseEvent, grabState: MultiSelectDragParams, context: CanvasContext): void {
        grabState.toMoveUids.forEach((uid) => {
            const o = this.objectStore.get(uid) as BaseBackedObject & Draggable;
            o.onDragFinish(event, context, true);
        });
        this.onCommit(this.objectStore.get(grabState.toMoveUids[0])!.entity);
    }

    addEntity(entity: DrawableEntityConcrete): void {
        for (let i = 0; i <= this.uidsInOrder.length; i++) {
            const io = this.objectStore.get(this.uidsInOrder[i]);

            if (i === this.uidsInOrder.length ||
                this.entitySortOrder(io!.entity) >=
                this.entitySortOrder(entity)
            ) {
                this.uidsInOrder.splice(i, 0, entity.uid);
                break;
            }

            if (io === undefined) {
                throw new Error('we have a uid that is not found ' + this.uidsInOrder[i]);
            }
        }


        DrawableObjectFactory.build(
            this,
            entity,
            this.objectStore,
            {
                onSelected: (e) => this.onSelected(e, entity.uid),
                onChange: () => this.onChange(),
                onCommit: (e) => this.onCommit(entity),
            },
        );
    }

    deleteEntity(entity: DrawableEntityConcrete): void {
        const ix = this.uidsInOrder.indexOf(entity.uid);
        if (ix === -1) {
            throw new Error('Deleting object from layer that doesn\'t exist');
        }

        this.uidsInOrder.splice(ix, 1);
        this.objectStore.delete(entity.uid);
    }

    entitySortOrder(entity: DrawableEntityConcrete): number {
        return 0;
    }

    abstract update(doc: DocumentState): any;
}

export interface MultiSelectDragParams {
    initialStates: Map<string, any>;
    initialObjectCoords: Map<string, Coord>;
    toMoveUids: string[];
}
