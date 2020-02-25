import { DocumentState, EntityParam } from "../../../src/store/document/types";
import { MouseMoveResult, UNHANDLED } from "../../../src/htmlcanvas/types";
import { Interaction } from "../../../src/htmlcanvas/lib/interaction";
import BaseBackedObject from "../../../src/htmlcanvas/lib/base-backed-object";
import { DrawingContext } from "../../../src/htmlcanvas/lib/types";
import { DrawableEntityConcrete } from "../../../../common/src/api/document/entities/concrete-entity";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import { Draggable } from "../../../src/htmlcanvas/lib/object-traits/draggable-object";
import DrawableObjectFactory from "../../../src/htmlcanvas/lib/drawable-object-factory";
import { MainEventBus } from "../../../src/store/main-event-bus";
import { rebaseAll } from "../../../src/htmlcanvas/lib/black-magic/rebase-all";
import { GlobalStore } from "../lib/global-store";
import { ObjectStore } from "../lib/object-store";
import { assertUnreachable } from "../../../../common/src/api/config";
import { Coord, DrawableEntity, WithID } from "../../../../common/src/api/document/drawing";

export default interface Layer {
    uidsInOrder: string[];

    draw(
        context: DrawingContext,
        active: boolean,
        shouldContinue: () => boolean,
        exclude: Set<string>,
        ...args: any[]
    ): Promise<any>;

    drawReactiveLayer(context: DrawingContext, interactive: string[], reactive: Set<string>): any;

    onMouseMove(event: MouseEvent, context: CanvasContext): MouseMoveResult;
    onMouseDown(event: MouseEvent, context: CanvasContext): boolean;
    onMouseUp(event: MouseEvent, context: CanvasContext): boolean;

    onMultiSelectDragStart(event: MouseEvent, world: Coord, context: CanvasContext): any;
    onMultiSelectDrag(event: MouseEvent, world: Coord, grabState: any, context: CanvasContext): void;
    onMultiSelectDragFinish(event: MouseEvent, grabState: any, context: CanvasContext): void;

    // Call this when starting a drag, to make sure all mouse events go to it until the drag ends.
    dragObjects(objects: BaseBackedObject[], context: CanvasContext): void;
    releaseDrag(context: CanvasContext): void;

    isSelected(object: BaseBackedObject | string): boolean;

    offerInteraction(
        interaction: Interaction,
        filter?: (objects: DrawableEntityConcrete[]) => boolean,
        sortBy?: (objects: DrawableEntityConcrete[]) => any
    ): DrawableEntityConcrete[] | null;

    off(): void;
}

export enum SelectMode {
    Replace,
    Toggle,
    Add,
    Exclude
}

export abstract class LayerImplementation implements Layer {
    context: CanvasContext;
    uidsInOrder: string[] = [];
    draggedObjects: BaseBackedObject[] | null = null;

    constructor(context: CanvasContext) {
        this.context = context;

        MainEventBus.$on("current-level-changed", this.reloadLevel.bind(this));
        MainEventBus.$on("add-entity", this.addEntity.bind(this));
        MainEventBus.$on("delete-entity", this.deleteEntity.bind(this));

        this.reloadLevel();
    }

    off() {
        MainEventBus.$off("current-level-changed", this.reloadLevel.bind(this));
        MainEventBus.$off("add-entity", this.addEntity.bind(this));
        MainEventBus.$off("delete-entity", this.deleteEntity.bind(this));
    }

    addEntity({ entity, levelUid }: EntityParam) {
        if (this.shouldAccept(entity)) {
            if (this.uidsInOrder.includes(entity.uid)) {
                // This can happen if we were asked to reset level during a multi operation with a lagged event
                // that was behind the global state. But we will tolerate this.
                return;
            }
            for (let i = 0; i <= this.uidsInOrder.length; i++) {
                const io = this.context.globalStore.get(this.uidsInOrder[i]);

                // we can't assume the existence of the object, because our state (which is updated by events)
                // can be behind the actual objectstore state (which is updated directly in the store).
                if (
                    i === this.uidsInOrder.length ||
                    (io && this.entitySortOrder(io.entity) >= this.entitySortOrder(entity))
                ) {
                    this.uidsInOrder.splice(i, 0, entity.uid);
                    break;
                }
            }
        }
    }

    deleteEntity({ entity, levelUid }: EntityParam) {
        if (this.uidsInOrder.includes(entity.uid)) {
            this.uidsInOrder.splice(this.uidsInOrder.indexOf(entity.uid), 1);
        }
    }

    reloadLevel() {
        this.uidsInOrder.splice(0);

        // Our sync with the globalstore is only eventually consistent, but this is still OK.
        // If we miss out things that would later be deleted, that's OK.
        // If we add things that would later be added, that's OK too.
        this.context.globalStore.forEach((o) => {
            if (this.shouldAccept(o.entity)) {
                this.uidsInOrder.push(o.entity.uid);
            }
        });

        this.uidsInOrder.sort(
            (a, b) =>
                this.entitySortOrder(this.context.globalStore.get(a)!.entity) -
                this.entitySortOrder(this.context.globalStore.get(b)!.entity)
        );
    }

    get selectedIds(): string[] {
        return this.context.document.uiState.selectedUids;
    }

    get selectedObjects() {
        return this.selectedIds.map((uid) => this.context.globalStore.get(uid)!);
    }

    get selectedEntities() {
        return this.selectedObjects.map((o) => o.entity);
    }

    abstract shouldAccept(entity: DrawableEntityConcrete): boolean;

    abstract entitySortOrder(entity: DrawableEntityConcrete): number;

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
        const myMap = new Map(this.uidsInOrder.map((v, k) => [v, k]));
        const uncommittedSet = new Set(uncommitted);

        const uidsToDraw = Array.from(
            new Set([...uncommitted, ...Array.from(reactive), ...this.selectedIds])
        ).filter((uid) => myMap.has(uid));
        uidsToDraw.sort((a, b) => myMap.get(a)! - myMap.get(b)!);

        uidsToDraw.forEach((uid) => {
            const o = this.context.globalStore.get(uid);
            if (o) {
                o.draw(context, {
                    active: true,
                    selected: selectedSet.has(uid) || uncommittedSet.has(uid),
                    calculationFilters: null,
                    forExport: false
                });
            }
        });
    }

    offerInteraction(
        interaction: Interaction,
        filter?: (objects: DrawableEntityConcrete[]) => boolean,
        sortKey?: (objects: DrawableEntityConcrete[]) => any
    ): DrawableEntityConcrete[] | null {
        const candidates: Array<[any, DrawableEntityConcrete[]]> = [];

        for (let i = this.uidsInOrder.length - 1; i >= 0; i--) {
            const uid = this.uidsInOrder[i];
            if (this.context.globalStore.has(uid)) {
                const object = this.context.globalStore.get(uid)!;
                if (object.entity === undefined) {
                    throw new Error("object is deleted but still in this layer " + uid);
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
            if (this.context.globalStore.has(uid)) {
                const object = this.context.globalStore.get(uid)!;
                try {
                    if (object.onMouseDown(event, context)) {
                        return true;
                    }
                } catch (e) {
                    // tslint:disable-next-line:no-console
                    console.log(e);
                }
            }
        }

        return false;
    }

    onMouseMove(event: MouseEvent, context: CanvasContext): MouseMoveResult {
        if (this.draggedObjects) {
            context.$store.dispatch("document/revert", false);
            const res = this.draggedObjects[0].onMouseMove(event, context);
            if (res.handled) {
                return res;
            }
        }

        for (let i = this.uidsInOrder.length - 1; i >= 0; i--) {
            const uid = this.uidsInOrder[i];
            if (this.context.globalStore.has(uid)) {
                try {
                    const object = this.context.globalStore.get(uid)!;
                    const res = object.onMouseMove(event, context);
                    if (res.handled) {
                        return res;
                    }
                } catch (e) {
                    // tslint:disable-next-line:no-console
                    console.log("warning: error in object handler for mouseMove: ");
                    // tslint:disable-next-line:no-console
                    console.log(e);
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
            if (this.context.globalStore.has(uid)) {
                const object = this.context.globalStore.get(uid)!;
                try {
                    if (object.onMouseUp(event, context)) {
                        return true;
                    }
                } catch (e) {
                    // tslint:disable-next-line:no-console
                    console.log("warning: error in object handler for mouseMove: ");
                    // tslint:disable-next-line:no-console
                    console.log(e);
                }
            }
        }

        if (!event.shiftKey && !event.ctrlKey) {
            this.context.document.uiState.selectedUids.splice(0);
        }

        return false;
    }

    dragObjects(objects: BaseBackedObject[], context: CanvasContext): void {
        context.isLayerDragging = true;
        this.context.globalStore.preserve(objects.map((o) => o.uid));
        this.draggedObjects = objects;
    }

    releaseDrag(context: CanvasContext): void {
        this.context.globalStore.preserve([]);
        context.isLayerDragging = false;
        this.draggedObjects = null;
    }

    multiDragOrder(uid: string): number {
        const e = this.context.globalStore.get(uid)!.entity;
        switch (e.type) {
            case EntityType.BACKGROUND_IMAGE:
                return 0;
            case EntityType.FIXTURE:
            case EntityType.LOAD_NODE:
            case EntityType.PLANT:
            case EntityType.FITTING:
            case EntityType.RISER:
            case EntityType.FLOW_SOURCE:
            case EntityType.DIRECTED_VALVE:
            case EntityType.BIG_VALVE:
                return 1;
            case EntityType.PIPE:
                return 2;
            case EntityType.SYSTEM_NODE:
                throw new Error("cannot handle entities of this magnitude");
        }
        assertUnreachable(e);
    }

    onMultiSelectDragStart(event: MouseEvent, world: Coord, context: CanvasContext): MultiSelectDragParams {
        let allDraggable = true;

        // figure out which elements need to get drag events.
        const toMoveUids: string[] = this.selectedIds.filter((uid) => {
            const o = this.context.globalStore.get(uid)!;
            if (o.entity.parentUid) {
                const po = this.context.globalStore.get(o.entity.parentUid)!;
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
                case EntityType.LOAD_NODE:
                case EntityType.FLOW_SOURCE:
                case EntityType.PLANT:
                case EntityType.BIG_VALVE:
                case EntityType.DIRECTED_VALVE:
                    return true;
                case EntityType.PIPE:
                    return o.entity.endpointUid.filter((euid) => this.isSelected(euid)).length < 2;
                case EntityType.SYSTEM_NODE:
                    throw new Error("cannot handle multi dragging for this object");
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
                toMoveUids: []
            };
        }

        const initialStates = new Map<string, any>();
        const initialObjectCoords = new Map<string, Coord>();
        toMoveUids.forEach((uid) => {
            const o = this.context.globalStore.get(uid) as BaseBackedObject & Draggable;
            initialStates.set(uid, o.onDragStart(event, o.toObjectCoord(world), context, true));
            initialObjectCoords.set(uid, o.toObjectCoord(world));
        });

        return {
            initialObjectCoords,
            initialStates,
            toMoveUids
        };
    }

    onMultiSelectDrag(event: MouseEvent, world: Coord, grabState: MultiSelectDragParams, context: CanvasContext) {
        context.$store.dispatch("document/revert", false);
        grabState.toMoveUids.forEach((uid) => {
            const o = this.context.globalStore.get(uid) as BaseBackedObject & Draggable;
            o.onDrag(
                event,
                grabState.initialObjectCoords.get(uid)!,
                o.toObjectCoord(world),
                grabState.initialStates.get(uid),
                context,
                true
            );
        });
        context.scheduleDraw();
    }

    onMultiSelectDragFinish(event: MouseEvent, grabState: MultiSelectDragParams, context: CanvasContext): void {
        grabState.toMoveUids.forEach((uid) => {
            const o = this.context.globalStore.get(uid) as BaseBackedObject & Draggable;
            o.onDragFinish(event, context, true);
        });
    }
}

export interface MultiSelectDragParams {
    initialStates: Map<string, any>;
    initialObjectCoords: Map<string, Coord>;
    toMoveUids: string[];
}
