import { LayerImplementation } from "../../../src/htmlcanvas/layers/layer";
import { BackgroundImage } from "../../../src/htmlcanvas/objects/background-image";
import { ResizeControl } from "../../../src/htmlcanvas/objects/resize-control";
import { MouseMoveResult } from "../../../src/htmlcanvas/types";
import { ToolConfig } from "../../../src/store/tools/types";
import { DrawingContext } from "../../../src/htmlcanvas/lib/types";
import CanvasContext from "../../../src/htmlcanvas/lib/canvas-context";
import { DrawableEntityConcrete } from "../../../../common/src/api/document/entities/concrete-entity";
import { EntityType } from "../../../../common/src/api/document/entities/types";
import { cooperativeYield } from "../utils";
import { Coord } from "../../../../common/src/api/document/drawing";

export default class BackgroundLayer extends LayerImplementation {
    resizeBox: ResizeControl | null = null;

    async draw(
        context: DrawingContext,
        active: boolean,
        shouldContinue: () => boolean,
        reactive: Set<string>,
        selectedTool: ToolConfig
    ) {
        this.updateSelectionBox();

        // draw selected one on top.
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < this.uidsInOrder.length; i++) {
            const selectId = this.uidsInOrder[i];
            const background = context.globalStore.get(selectId);
            if (background && background instanceof BackgroundImage) {
                if (!this.isSelected(selectId) || !active || !background.hasDragged) {
                    background.draw(context, {
                        selected: this.isSelected(selectId),
                        active: active && !selectedTool.focusSelectedObject,
                        calculationFilters: null
                    });
                }
            } else {
                throw new Error("Expected background image, got " + background!.type + " instead");
            }
            await cooperativeYield(shouldContinue);
        }

        if (active) {
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < this.uidsInOrder.length; i++) {
                const selectId = this.uidsInOrder[i];
                const background = context.globalStore.get(selectId);
                if (
                    background &&
                    background instanceof BackgroundImage &&
                    this.isSelected(background) &&
                    (background.hasDragged || selectedTool.focusSelectedObject)
                ) {
                    background.draw(context, { selected: this.isSelected(selectId), active, calculationFilters: null });
                }
                await cooperativeYield(shouldContinue);
            }
        }
    }

    shouldAccept(entity: DrawableEntityConcrete): boolean {
        if (entity.type === EntityType.BACKGROUND_IMAGE) {
            return this.context.globalStore.levelOfEntity.get(entity.uid) === this.context.document.uiState.levelUid;
        }
        return false;
    }

    entitySortOrder(entity: DrawableEntityConcrete): number {
        return 0;
    }

    // When the state changes, the selection box needs to follow.
    updateSelectionBox() {
        this.resizeBox = null;
        this.uidsInOrder.forEach((selectId) => {
            if (this.isSelected(selectId)) {
                const background = this.context.globalStore.get(selectId)! as BackgroundImage;
                this.resizeBox = new ResizeControl(
                    background,
                    () => {
                        this.context.$store.dispatch('document/validateAndCommit');
                    }
                );
            }
        });
    }

    drawReactiveLayer(context: DrawingContext, interactive: string[]) {
        if (this.resizeBox) {
            this.resizeBox.draw(context, { active: true, selected: true, calculationFilters: null });
        }
    }

    getBackgroundAt(worldCoord: Coord) {
        for (let i = this.uidsInOrder.length - 1; i >= 0; i--) {
            const selectId = this.uidsInOrder[i];
            if (this.context.globalStore.get(selectId)) {
                const background = this.context.globalStore.get(selectId);
                if (background instanceof BackgroundImage) {
                    if (background.inBounds(background.toObjectCoord(worldCoord))) {
                        return background;
                    }
                } else {
                    throw new Error("Exepected background image, got" + background!.type + "instead");
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
