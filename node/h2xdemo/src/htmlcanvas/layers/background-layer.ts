import Layer from '@/htmlcanvas/layers/layer';
import {Coord, DocumentState, DrawableEntity} from '@/store/document/types';
import {ViewPort} from '@/htmlcanvas/viewport';
import {BackgroundImage} from '@/htmlcanvas/objects/background-image';
import {ResizeControl} from '@/htmlcanvas/objects/resize-control';
import {MouseMoveResult, UNHANDLED} from '@/htmlcanvas/types';
import {ToolConfig} from '@/store/tools/types';
import DrawableObject from '@/htmlcanvas/lib/drawable-object';
import BackedDrawableObject, {BaseBackedObject} from '@/htmlcanvas/lib/backed-drawable-object';
import {Interaction} from '@/htmlcanvas/lib/interaction';
import {DrawingContext, ObjectStore} from '@/htmlcanvas/lib/types';
import {BackgroundEntity} from '@/store/document/entities/background-entity';

export default class BackgroundLayer implements Layer {
    sidsInOrder: string[] = [];
    selectedId: string | null = null;
    resizeBox: ResizeControl | null = null;

    onChange: () => any;
    onSelect: (selectId: BackgroundEntity | null, drawable: DrawableObject | null) => any;
    onCommit: (selectId: BackgroundEntity) => any;
    objectStore: ObjectStore;

    constructor(
        objectStore: ObjectStore,
        onChange: () => any,
        onSelect: (selectId: BackgroundEntity | null, drawable: DrawableObject | null) => any,
        onCommit: (selectId: BackgroundEntity) => any,
    ) {
        this.onChange = onChange;
        this.onSelect = onSelect;
        this.onCommit = onCommit;
        this.objectStore = objectStore;
    }

    get selectedObject() {
        if (this.selectedId == null) {
            return null;
        }
        return this.objectStore.get(this.selectedId)!;
    }

    get selectedEntity() {
        if (this.selectedObject instanceof BackgroundImage) {
            return this.selectedObject.entity;
        }
        return null;
    }

    draw(context: DrawingContext, active: boolean, selectedTool: ToolConfig) {
        // draw selected one on top.
        this.sidsInOrder.forEach((selectId) => {
            const background = this.objectStore.get(selectId);
            if (background && background instanceof BackgroundImage) {
                if (selectId !== this.selectedId || !active || !background.hasDragged) {
                    background.draw(
                        context,
                        this.selectedId === selectId, active && !selectedTool.focusSelectedObject,
                    );
                }
            } else {
                throw new Error('Expected background image, got ' + JSON.stringify(background) + ' instead');
            }
        });

        if (active) {
            this.sidsInOrder.forEach((selectId) => {
                const background = this.objectStore.get(selectId);
                if (background && background instanceof BackgroundImage
                    && background.entity.uid === this.selectedId
                    && (background.hasDragged || selectedTool.focusSelectedObject)) {
                    background.draw(context, this.selectedId === selectId, active);
                }
            });
        }
    }

    update(doc: DocumentState) {
        this.resizeBox = null; // We regenerate this if needed.

        const existingSids: string[] = [];

        for (const background of doc.drawing.backgrounds) {
            if (!this.objectStore.has(background.uid)) {
                const obj: BackgroundImage = new BackgroundImage(
                    this.objectStore,
                    null,
                    background,
                    () => {
                        this.selectedId = background.uid;
                        this.updateSelectionBox();
                        this.onSelect(background, obj);
                    },
                    () => {
                        this.updateSelectionBox();
                        this.onChange();
                    },
                    () => {
                        this.onCommit(obj.entity);
                    },
                );
                this.objectStore.set(background.uid, obj);
                this.sidsInOrder.push(background.uid);
            } else {
                const obj = this.objectStore.get(background.uid)!;
                if (obj instanceof BackgroundImage) {
                    obj.refreshObject(null, background);
                    if (background.uid === this.selectedId) {
                        this.onSelect(background, obj);
                    }
                } else {
                    throw new Error('Expected background object but got ' + JSON.stringify(background));
                }
            }

            existingSids.push(background.uid);
        }

        const toDelete: string[] = [];
        this.sidsInOrder.forEach((selectId) => {
            if (existingSids.indexOf(selectId) === -1) {
                this.sidsInOrder.splice(this.sidsInOrder.indexOf(selectId), 1);
                if (selectId === this.selectedId) {
                    this.selectedId = null;
                    this.onSelect(null, null);
                }
                toDelete.push(selectId);
            }

        });
        toDelete.forEach((s) => this.objectStore.delete(s));

        this.updateSelectionBox();
    }

    // When the state changes, the selection box needs to follow.
    updateSelectionBox() {
        this.resizeBox = null;
        this.sidsInOrder.forEach((selectId) => {
            if (selectId === this.selectedId) {
                const background = this.objectStore.get(selectId)! as BackgroundImage;
                this.resizeBox = new ResizeControl(
                    background,
                    () =>  this.onSelectedResize(),
                    () => {
                        // Do deh operation transform.
                        // TODO: Deh operation transform
                        this.onCommit(background.entity);
                    },
                );
            }
        });
    }

    // This is when our guy resizes
    onSelectedResize() {
        if (this.selectedId) {
            this.onChange();
        }
    }

    drawSelectionLayer(
        context: DrawingContext,
        interactive: BaseBackedObject | null) {
        if (this.resizeBox) {
            this.resizeBox.draw(context);
        }

        if (interactive && this.sidsInOrder.indexOf(interactive.uid) !== -1) {
            this.objectStore.get(interactive.entity.uid)!.draw(context, true, true);
        }
    }

    getBackgroundAt(worldCoord: Coord, objectStore: ObjectStore) {
        for (let i = this.sidsInOrder.length - 1; i >= 0; i--) {
            const selectId = this.sidsInOrder[i];
            if (objectStore.get(selectId)) {
                const background = this.objectStore.get(selectId);
                if (background instanceof BackgroundImage) {
                    if (background.inBounds(background.toObjectCoord(worldCoord))) {
                        return background;
                    }
                } else {
                    throw new Error('Exepected background image, got' + JSON.stringify(background) + 'instead');
                }
            }
        }
        return null;
    }

    onMouseDown(event: MouseEvent, vp: ViewPort) {
        if (this.resizeBox) {
            if (this.resizeBox.onMouseDown(event, vp)) {
                return true;
            }
        }

        for (let i = this.sidsInOrder.length - 1; i >= 0; i--) {
            const selectId = this.sidsInOrder[i];
            if (this.objectStore.get(selectId)) {
                const background = this.objectStore.get(selectId);
                if (background instanceof BackgroundImage) {
                    if (background.onMouseDown(event, vp)) {
                        return true;
                    }
                } else {
                    throw new Error('Exepected background image, got' + JSON.stringify(background) + 'instead');
                }
            }
        }

        return false;
    }

    onMouseMove(event: MouseEvent, vp: ViewPort): MouseMoveResult {
        if (this.resizeBox) {
            const res = this.resizeBox.onMouseMove(event, vp);
            if (res.handled) {
                return res;
            }
        }

        for (let i = this.sidsInOrder.length - 1; i >= 0; i--) {
            const selectId = this.sidsInOrder[i];
            const background = this.objectStore.get(selectId);
            if (background instanceof BackgroundImage) {
                const res = background.onMouseMove(event, vp);
                if (res.handled) {
                    return res;
                }
            } else {
                throw new Error('Exepected background image, got' + JSON.stringify(background) + 'instead');
            }
        }

        return UNHANDLED;
    }


    onMouseUp(event: MouseEvent, vp: ViewPort) {
        if (this.resizeBox) {
            if (this.resizeBox.onMouseUp(event, vp)) {
                return true;
            }
        }

        for (let i = this.sidsInOrder.length - 1; i >= 0; i--) {
            const selectId = this.sidsInOrder[i];
            const background = this.objectStore.get(selectId);
            if (background instanceof BackgroundImage) {
                if (background.onMouseUp(event, vp)) {
                    return true;
                }
            } else {
                throw new Error('Expected background image, got' + JSON.stringify(background) + 'instead');
            }
        }

        this.selectedId = null;
        this.resizeBox = null;
        this.onSelect(null, null);
        this.onChange();

        return false;
    }

    offerInteraction(
        interaction: Interaction,
        filter?: (object: BaseBackedObject) => boolean,
    ): BaseBackedObject | null {
        for (let i = this.sidsInOrder.length - 1; i >= 0; i--) {
            const uid = this.sidsInOrder[i];
            if (this.objectStore.has(uid)) {
                const object = this.objectStore.get(uid)!;
                const objectCoord = object.toObjectCoord(interaction.worldCoord);
                if (object.inBounds(objectCoord)) {
                    if (object.offerInteraction(interaction)) {
                        if (filter === undefined || filter(object)) {
                            return object;
                        }
                    }
                }
            }
        }
        return null;
    }
}
