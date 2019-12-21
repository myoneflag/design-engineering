import {Coord, DocumentState, DrawableEntity, WithID} from '../../../src/store/document/types';
import {MouseMoveResult, UNHANDLED} from '../../../src/htmlcanvas/types';
import {Interaction} from '../../../src/htmlcanvas/lib/interaction';
import BaseBackedObject from '../../../src/htmlcanvas/lib/base-backed-object';
import {DrawingContext, GlobalStore, ObjectStore} from '../../../src/htmlcanvas/lib/types';
import {DrawableEntityConcrete} from '../../../src/store/document/entities/concrete-entity';
import CanvasContext from '../../../src/htmlcanvas/lib/canvas-context';
import {EntityType} from '../../../src/store/document/entities/types';
import {Draggable} from '../../../src/htmlcanvas/lib/object-traits/draggable-object';
import DrawableObjectFactory from '../../../src/htmlcanvas/lib/drawable-object-factory';
import {MainEventBus} from '../../../src/store/main-event-bus';
import {rebaseAll} from '../../../src/htmlcanvas/lib/black-magic/rebase-all';
import {assertUnreachable} from "../../../src/config";

export default interface Layer {
    uidsInOrder: string[];
    selectedEntities: DrawableEntityConcrete[];
    selectedObjects: BaseBackedObject[];
    selectedIds: string[];

    select(objects: BaseBackedObject[], mode: SelectMode): void;

    draw(context: DrawingContext, active: boolean, shouldContinue: () => boolean, exclude: Set<string>, ...args: any[]): Promise<any>;
    resetDocument(doc: DocumentState): any;
    drawReactiveLayer(context: DrawingContext, interactive: string[], reactive: Set<string>): any;

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

    addEntity(entity: () => DrawableEntityConcrete): void;
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

    onChange: (uids: string[]) => any;
    onSelect: () => any;
    onCommit: (obj: DrawableEntityConcrete) => any;

    constructor(
        objectStore: ObjectStore,
        onChange: (uids: string[]) => any,
        onSelect: () => any,
        onCommit: (obj: DrawableEntityConcrete) => any,
    ) {
        this.onChange = onChange;
        this.onSelect = onSelect;
        this.onCommit = onCommit;
        this.objectStore = objectStore;
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
                this.selectedIds.splice(0, this.selectedIds.length, ...ids);
                return;
            case SelectMode.Toggle:
                const common = this.selectedIds.filter((uid) => ids.includes(uid));
                this.selectedIds.push(...ids);
                this.selectedIds.splice(0, this.selectedIds.length,
                    ...this.selectedIds.filter((uid) => !common.includes(uid)));
                return;
            case SelectMode.Add:
                this.selectedIds.push(...ids.filter((uid) => !this.selectedIds.includes(uid)));
                return;
            case SelectMode.Exclude:
                this.selectedIds.splice(0, this.selectedIds.length,
                    ...this.selectedIds.filter((uid) => !ids.includes(uid)));
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

    abstract draw(context: DrawingContext, active: boolean, ...args: any[]): Promise<any>;

    drawReactiveLayer(context: DrawingContext, uncommitted: string[], reactive: Set<string>) {
        const selectedSet = new Set(this.selectedIds);
        const mySet = new Set(this.uidsInOrder);
        const uncommittedSet = new Set(uncommitted);

        reactive.forEach((uid) => {
            if (!selectedSet.has(uid) && !uncommittedSet.has(uid)) {
                const o = this.objectStore.get(uid);
                if (o) {
                    o.draw(context, {
                        active: true,
                        selected: false,
                        calculationFilters: null,
                    });
                }
            }
        });

        this.selectedIds.forEach((uid) => {
            if (!uncommittedSet.has(uid)) {
                this.objectStore.get(uid)!.draw(context, {active: true, selected: true, calculationFilters: null});
            }
        });

        uncommitted.forEach((ii) => {
            if (mySet.has(ii)) {
                this.objectStore.get(ii)!.draw(
                    context,
                    {active: true, selected: true, calculationFilters: null},
                );
            }
        });
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
                if (object.entity === undefined) {
                    throw new Error('object is deleted but still in this layer ' + uid);
                }
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

        return false;
    }

    dragObjects(objects: BaseBackedObject[], context: CanvasContext): void {
        context.isLayerDragging = true;
        this.objectStore.preserve(objects.map((o) => o.uid));
        this.draggedObjects = objects;
    }

    releaseDrag(context: CanvasContext): void {
        this.objectStore.preserve([]);
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

    multiDragOrder(uid: string): number {
        const e = this.objectStore.get(uid)!.entity;
        switch (e.type) {
            case EntityType.BACKGROUND_IMAGE:
                return 0;
            case EntityType.FIXTURE:
            case EntityType.FITTING:
            case EntityType.RISER:
            case EntityType.DIRECTED_VALVE:
            case EntityType.TMV:
                return 1;
            case EntityType.PIPE:
                return 2;
            case EntityType.SYSTEM_NODE:
                throw new Error('cannot handle entities of this maginitied');
        }
        assertUnreachable(e);
    }

    onMultiSelectDragStart(event: MouseEvent, world: Coord, context: CanvasContext): MultiSelectDragParams {
        let allDraggable = true;

        // figure out which elements need to get drag events.
        const toMoveUids: string[] = this.selectedIds.filter((uid) => {
            const o = this.objectStore.get(uid)!;
            if (o.entity.parentUid) {
                const po = this.objectStore.get(o.entity.parentUid)!;
                if (this.isSelected(po.uid)) {
                    return false;
                }
            }
            if (!o.draggable) {
                allDraggable = false;
                return false;
            }

            switch (o.entity.type) {
                case EntityType.BACKGROUND_IMAGE:
                case EntityType.FITTING:
                case EntityType.RISER:
                case EntityType.FIXTURE:
                case EntityType.TMV:
                case EntityType.DIRECTED_VALVE:
                    return true;
                case EntityType.PIPE:
                    return o.entity.endpointUid.filter((euid) => this.isSelected(euid)).length < 2;
                case EntityType.SYSTEM_NODE:
                    throw new Error('cannot handle multi dragging for this object');
                default:
                    assertUnreachable(o.entity);
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

    onMultiSelectDrag(event: MouseEvent, world: Coord, grabState: MultiSelectDragParams, context: CanvasContext) {
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
        this.onChange(grabState.toMoveUids);
    }

    onMultiSelectDragFinish(event: MouseEvent, grabState: MultiSelectDragParams, context: CanvasContext): void {
        grabState.toMoveUids.forEach((uid) => {
            const o = this.objectStore.get(uid) as BaseBackedObject & Draggable;
            o.onDragFinish(event, context, true);
        });
        rebaseAll(context);
        this.onCommit(this.objectStore.get(grabState.toMoveUids[0])!.entity);
    }

    addEntity(entity: () => DrawableEntityConcrete): void {

        DrawableObjectFactory.buildVisible(
            this,
            entity,
            this.objectStore,
            {
                onSelected: (e) => this.onSelected(e, entity().uid),
                onChange: () => this.onChange([entity().uid]),
                onCommit: (e) => this.onCommit(entity()),
            },
        );
/*
        const getSortOrder = (i: number) => {
            const io = this.objectStore.get(this.uidsInOrder[i]);
            return this.entitySortOrder(io!.entity);
        };

        const myVal = this.entitySortOrder(entity());
        let high = this.uidsInOrder.length;
        let low = 0; // find first element
        while (low < high) {
            const mid = Math.floor((low + high) / 2);
            const midVal = getSortOrder(mid);

            if (midVal > myVal) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }
        this.uidsInOrder.splice(low, 0, entity().uid);
*/

        for (let i = 0; i <= this.uidsInOrder.length; i++) {
            const io = this.objectStore.get(this.uidsInOrder[i]);

            if (i === this.uidsInOrder.length ||
                this.entitySortOrder(io!.entity) >=
                this.entitySortOrder(entity())
            ) {
                this.uidsInOrder.splice(i, 0, entity().uid);
                break;
            }

            if (io === undefined) {
                throw new Error('we have a uid that is not found ' + this.uidsInOrder[i]);
            }
        }

    }

    deleteEntity(entity: DrawableEntityConcrete): void {
        const ix = this.uidsInOrder.indexOf(entity.uid);
        if (ix === -1) {
            // Do not throw an error
        } else {
            this.uidsInOrder.splice(ix, 1);
        }

        this.objectStore.delete(entity.uid);

        if (this.selectedIds.includes(entity.uid)) {
            this.selectedIds.splice(this.selectedIds.indexOf(entity.uid), 1);
        }
    }

    entitySortOrder(entity: DrawableEntityConcrete): number {
        return 0;
    }

    abstract resetDocument(doc: DocumentState): any;
}

export interface MultiSelectDragParams {
    initialStates: Map<string, any>;
    initialObjectCoords: Map<string, Coord>;
    toMoveUids: string[];
}
