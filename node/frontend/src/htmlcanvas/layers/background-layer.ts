import {LayerImplementation, SelectMode} from '../../../src/htmlcanvas/layers/layer';
import {CalculationFilters, Coord, DocumentState, DrawableEntity} from '../../../src/store/document/types';
import {BackgroundImage} from '../../../src/htmlcanvas/objects/background-image';
import {ResizeControl} from '../../../src/htmlcanvas/objects/resize-control';
import {MouseMoveResult} from '../../../src/htmlcanvas/types';
import {ToolConfig} from '../../../src/store/tools/types';
import BaseBackedObject from '../../../src/htmlcanvas/lib/base-backed-object';
import {DrawingContext, ObjectStore} from '../../../src/htmlcanvas/lib/types';
import CanvasContext from '../../../src/htmlcanvas/lib/canvas-context';
import {DrawableEntityConcrete} from '../../../src/store/document/entities/concrete-entity';
import {EntityType} from "../../store/document/entities/types";
import {BackgroundEntity} from "../../store/document/entities/background-entity";
import {cooperativeYield} from "../utils";

export default class BackgroundLayer extends LayerImplementation {
    resizeBox: ResizeControl | null = null;

    async draw(context: DrawingContext, active: boolean, shouldContinue: () => boolean, reactive: Set<string>, selectedTool: ToolConfig) {
        // draw selected one on top.
        for (let i = 0; i < this.uidsInOrder.length; i++) {
            const selectId = this.uidsInOrder[i];
            const background = this.objectStore.get(selectId);
            if (background && background instanceof BackgroundImage) {
                if (!this.isSelected(selectId) || !active || !background.hasDragged) {
                    background.draw(
                        context,
                        {
                            selected: this.isSelected(selectId),
                            active: active && !selectedTool.focusSelectedObject,
                            calculationFilters: null,
                        },
                    );
                }
            } else {
                throw new Error('Expected background image, got ' + JSON.stringify(background) + ' instead');
            }
            await cooperativeYield(shouldContinue);
        }

        if (active) {
            for (let i = 0; i < this.uidsInOrder.length; i++) {
                const selectId = this.uidsInOrder[i];
                const background = this.objectStore.get(selectId);
                if (background && background instanceof BackgroundImage
                    && this.isSelected(background)
                    && (background.hasDragged || selectedTool.focusSelectedObject)) {
                    background.draw(
                        context,
                        {selected: this.isSelected(selectId), active, calculationFilters: null},
                    );
                }
                await cooperativeYield(shouldContinue);
            }
        }
    }
    select(objects: BaseBackedObject[] | string[], mode: SelectMode): void {
        super.select(objects, mode);

        this.updateSelectionBox();
    }

    addEntity(entity: () => DrawableEntityConcrete): void {
        super.addEntity(entity);
    }

    resetDocument(doc: DocumentState) {
        let entities: DrawableEntityConcrete[] = [];
        if (doc.uiState.levelUid) {
            if (!doc.drawing.levels[doc.uiState.levelUid]) {
                throw new Error('level ' + doc.uiState.levelUid + ' doesn\'t exist ' + JSON.stringify(doc));
            }
            entities = Object.values(doc.drawing.levels[doc.uiState.levelUid].entities);
        }

        this.resizeBox = null; // We regenerate this if needed.

        const existingSids: string[] = [];

        for (const entity of entities) {
            if (entity.type !== EntityType.BACKGROUND_IMAGE) {
                continue;
            }

            const background = entity;

            if (!this.objectStore.has(background.uid)) {
                const obj: BackgroundImage = new BackgroundImage(
                    undefined,
                    this.objectStore,
                    this,
                    () => (doc.uiState.levelUid ?
                        doc.drawing.levels[doc.uiState.levelUid].entities[entity.uid] :
                        doc.drawing.shared[entity.uid])as
                        BackgroundEntity,
                    (event) => {
                        this.select([background.uid], event.ctrlKey ? SelectMode.Toggle : SelectMode.Replace);
                        this.updateSelectionBox();
                        this.onSelect();
                    },
                    () => {
                        this.updateSelectionBox();
                        this.onChange([entity.uid]);
                    },
                    () => {
                        this.onCommit(obj.entity);
                    },
                );
                this.objectStore.set(background.uid, obj);
                this.uidsInOrder.push(background.uid);
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
            this.onChange(this.selectedIds);
        }
    }

    drawReactiveLayer(
        context: DrawingContext,
        interactive: string[],
    ) {
        if (this.resizeBox) {
            this.resizeBox.draw(context, {active: true, selected: true, calculationFilters: null});
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
}
