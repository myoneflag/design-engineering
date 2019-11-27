import {LayerImplementation, SelectMode} from '@/htmlcanvas/layers/layer';
import {Coord, DocumentState, DrawableEntity} from '@/store/document/types';
import {BackgroundImage} from '@/htmlcanvas/objects/background-image';
import {ResizeControl} from '@/htmlcanvas/objects/resize-control';
import {MouseMoveResult} from '@/htmlcanvas/types';
import {ToolConfig} from '@/store/tools/types';
import BaseBackedObject from '@/htmlcanvas/lib/base-backed-object';
import {DrawingContext, ObjectStore} from '@/htmlcanvas/lib/types';
import CanvasContext from '@/htmlcanvas/lib/canvas-context';
import {DrawableEntityConcrete} from '@/store/document/entities/concrete-entity';

export default class BackgroundLayer extends LayerImplementation {
    resizeBox: ResizeControl | null = null;

    draw(context: DrawingContext, active: boolean, selectedTool: ToolConfig) {
        // draw selected one on top.
        this.uidsInOrder.forEach((selectId) => {
            const background = this.objectStore.get(selectId);
            if (background && background instanceof BackgroundImage) {
                if (!this.isSelected(selectId) || !active || !background.hasDragged) {
                    background.draw(
                        context,
                        this.isSelected(selectId), active && !selectedTool.focusSelectedObject,
                    );
                }
            } else {
                throw new Error('Expected background image, got ' + JSON.stringify(background) + ' instead');
            }
        });

        if (active) {
            this.uidsInOrder.forEach((selectId) => {
                const background = this.objectStore.get(selectId);
                if (background && background instanceof BackgroundImage
                    && this.isSelected(background)
                    && (background.hasDragged || selectedTool.focusSelectedObject)) {
                    background.draw(context, this.isSelected(selectId), active);
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
                    this,
                    background,
                    (event) => {
                        this.select([background.uid], event.ctrlKey ? SelectMode.Toggle : SelectMode.Replace);
                        this.updateSelectionBox();
                        this.onSelect();
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
                this.uidsInOrder.push(background.uid);
            } else {
                const obj = this.objectStore.get(background.uid)!;
                if (obj instanceof BackgroundImage) {
                    obj.refreshObject(background);
                    if (this.isSelected(background.uid)) {
                        this.onSelect();
                    }
                } else {
                    throw new Error('Expected background object but got ' + JSON.stringify(background));
                }
            }

            existingSids.push(background.uid);
        }

        const toDelete: string[] = [];
        this.uidsInOrder.forEach((selectId) => {
            if (existingSids.indexOf(selectId) === -1) {
                this.uidsInOrder.splice(this.uidsInOrder.indexOf(selectId), 1);
                if (this.isSelected(selectId)) {
                    this.select([selectId], SelectMode.Exclude);
                    this.onSelect();
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
        this.uidsInOrder.forEach((selectId) => {
            if (this.isSelected(selectId)) {
                const background = this.objectStore.get(selectId)! as BackgroundImage;
                this.resizeBox = new ResizeControl(
                    background,
                    this,
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
        if (this.selectedIds) {
            this.onChange();
        }
    }

    drawSelectionLayer(
        context: DrawingContext,
        interactive: DrawableEntity[] | null) {
        if (this.resizeBox) {
            this.resizeBox.draw(context);
        }

    }

    getBackgroundAt(worldCoord: Coord) {
        for (let i = this.uidsInOrder.length - 1; i >= 0; i--) {
            const selectId = this.uidsInOrder[i];
            if (this.objectStore.get(selectId)) {
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

    onMouseDown(event: MouseEvent, context: CanvasContext) {
        if (this.resizeBox) {
            if (this.resizeBox.onMouseDown(event, context)) {
                return true;
            }
        }

        return super.onMouseDown(event, context);
    }

    onMouseMove(event: MouseEvent, context: CanvasContext): MouseMoveResult {
        if (this.resizeBox) {
            const res = this.resizeBox.onMouseMove(event, context);
            if (res.handled) {
                return res;
            }
        }

        return super.onMouseMove(event, context);
    }


    onMouseUp(event: MouseEvent, context: CanvasContext) {
        if (this.resizeBox) {
            if (this.resizeBox.onMouseUp(event, context)) {
                return true;
            }
        }

        if (super.onMouseUp(event, context)) {
            return true;
        }

        this.resizeBox = null;
        return false;
    }

    dragObjects(objects: BaseBackedObject[]): void {
        //
    }

    releaseDrag(): void {
        //
    }
}
